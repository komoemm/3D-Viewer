import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { decodeSPZ } from './spzDecoder';
import { globalDecoderWorkerPool } from './decoderWorkerPool';
import { LoadedModel, ModelStats } from '../types';

/**
 * Concurrency-controlled queue for asynchronous 3D model parsing and loading.
 * Limits concurrent model decoding and geometry parsing to a max of 2-3 at a time
 * to prevent main-thread freezing and VRAM spike bottlenecks.
 */
export class ModelLoadingQueue {
  private maxConcurrent: number;
  private running = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Enqueue a model loading task. Executes immediately if below concurrency limit,
   * otherwise waits for previous tasks to settle.
   */
  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.running++;
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.running--;
          this.next();
        }
      };

      if (this.running < this.maxConcurrent) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  private next() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const task = this.queue.shift();
      if (task) task();
    }
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  get activeCount(): number {
    return this.running;
  }
}

// Global model loader queue singleton with max concurrency of 2
export const globalModelLoadingQueue = new ModelLoadingQueue(2);

// Setup DRACO Loader singleton
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const fbxLoader = new FBXLoader();
const plyLoader = new PLYLoader();
const objLoader = new OBJLoader();
const stlLoader = new STLLoader();

/**
 * Prepares and optimizes meshes in an Object3D hierarchy:
 * - Enables frustum culling
 * - Pre-computes bounding box and bounding sphere for accurate spatial clipping
 * - Configures shadow casting/receiving
 */
export function optimizeMeshHierarchy(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
      child.frustumCulled = true;
      child.castShadow = true;
      child.receiveShadow = true;

      const geom = child.geometry;
      if (geom) {
        if (!geom.boundingSphere) {
          geom.computeBoundingSphere();
        }
        if (!geom.boundingBox) {
          geom.computeBoundingBox();
        }
      }
    }
  });
}

/**
 * Calculates statistics (triangles, vertices, mesh count, materials, size) for an Object3D.
 */
export function calculateModelStats(object: THREE.Object3D): ModelStats {
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  const materialSet = new Set<string>();

  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
      meshes++;
      child.frustumCulled = true;
      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => materialSet.add(m.uuid));
        } else {
          materialSet.add(child.material.uuid);
        }
      }

      const geom = child.geometry;
      if (geom) {
        if (!geom.boundingSphere) {
          geom.computeBoundingSphere();
        }
        if (!geom.boundingBox) {
          geom.computeBoundingBox();
        }

        if (geom.index) {
          triangles += geom.index.count / 3;
        } else if (geom.attributes.position) {
          triangles += geom.attributes.position.count / 3;
        }
        if (geom.attributes.position) {
          vertices += geom.attributes.position.count;
        }
      }
    }
  });

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());

  return {
    triangles: Math.round(triangles),
    vertices,
    meshes,
    materials: materialSet.size,
    size: { x: size.x, y: size.y, z: size.z },
  };
}

/**
 * Centers an object and aligns its bottom to Y=0 ground plane.
 */
export function normalizeModelPosition(object: THREE.Object3D, existingModels: LoadedModel[]): void {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Center horizontally and depth-wise
  object.position.x -= center.x;
  object.position.y -= center.y;
  object.position.z -= center.z;

  // Place bottom on ground plane Y=0
  const updatedBox = new THREE.Box3().setFromObject(object);
  object.position.y -= updatedBox.min.y;

  // Auto-offset along X axis if other models exist
  if (existingModels.length > 0) {
    const maxX = Math.max(...existingModels.map((m) => m.object.position.x));
    const offset = Math.max(size.x, size.z, 2) + 1.2;
    object.position.x = maxX + offset;
  }
}

export const isThreeScript = (fileName: string): boolean => /\.(ts|js)$/i.test(fileName);

/**
 * Loads a 3D model file and returns a LoadedModel object.
 * Processes via the globalModelLoadingQueue to limit concurrent decodes to 2 max.
 */
export async function loadModelFile(file: File, existingModels: LoadedModel[]): Promise<LoadedModel> {
  return globalModelLoadingQueue.enqueue(async () => {
    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const url = URL.createObjectURL(file);

    let object: THREE.Object3D | null = null;
    let animations: THREE.AnimationClip[] = [];

    try {
      if (ext === 'glb' || ext === 'gltf') {
        const gltf = await gltfLoader.loadAsync(url);
        object = gltf.scene;
        animations = gltf.animations || [];
      } else if (ext === 'fbx') {
        const fbx = await fbxLoader.loadAsync(url);
        object = fbx;
        animations = fbx.animations || [];
      } else if (ext === 'ply') {
        if (globalDecoderWorkerPool.available) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const res = await globalDecoderWorkerPool.decode('ply', { buffer: arrayBuffer });
            if (res.positions) {
              const geom = new THREE.BufferGeometry();
              geom.setAttribute('position', new THREE.BufferAttribute(res.positions, 3));
              if (res.normals) geom.setAttribute('normal', new THREE.BufferAttribute(res.normals, 3));
              else geom.computeVertexNormals();
              if (res.colors) geom.setAttribute('color', new THREE.BufferAttribute(res.colors, 3));
              if (res.indices) geom.setIndex(new THREE.BufferAttribute(res.indices, 1));
              geom.computeBoundingSphere();
              geom.computeBoundingBox();

              if (!res.isPoints) {
                const mat = new THREE.MeshStandardMaterial({
                  color: 0x94a3b8,
                  roughness: 0.35,
                  metalness: 0.25,
                  vertexColors: !!res.colors,
                });
                object = new THREE.Mesh(geom, mat);
              } else {
                const mat = new THREE.PointsMaterial({
                  size: 0.05,
                  vertexColors: !!res.colors,
                  color: res.colors ? 0xffffff : 0x3b82f6,
                });
                object = new THREE.Points(geom, mat);
              }
            }
          } catch (workerErr) {
            console.warn('Worker PLY decoding error, using fallback:', workerErr);
          }
        }

        if (!object) {
          const geom = await plyLoader.loadAsync(url);
          geom.computeVertexNormals();
          if (geom.index || (geom.attributes.normal && geom.attributes.position.count > 500)) {
            const mat = new THREE.MeshStandardMaterial({
              color: 0x94a3b8,
              roughness: 0.35,
              metalness: 0.25,
              vertexColors: !!geom.attributes.color,
            });
            object = new THREE.Mesh(geom, mat);
          } else {
            const mat = new THREE.PointsMaterial({
              size: 0.05,
              vertexColors: !!geom.attributes.color,
              color: geom.attributes.color ? 0xffffff : 0x3b82f6,
            });
            object = new THREE.Points(geom, mat);
          }
        }
      } else if (ext === 'spz') {
        const geom = await decodeSPZ(file);
        const mat = new THREE.PointsMaterial({
          size: 0.04,
          vertexColors: true,
        });
        object = new THREE.Points(geom, mat);
      } else if (ext === 'obj') {
        if (globalDecoderWorkerPool.available) {
          try {
            const text = await file.text();
            const res = await globalDecoderWorkerPool.decode('obj', { text });
            if (res.meshes && res.meshes.length > 0) {
              const group = new THREE.Group();
              for (const m of res.meshes) {
                const geom = new THREE.BufferGeometry();
                geom.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
                if (m.normals) geom.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
                else geom.computeVertexNormals();
                if (m.uvs) geom.setAttribute('uv', new THREE.BufferAttribute(m.uvs, 2));
                if (m.colors) geom.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
                if (m.indices) geom.setIndex(new THREE.BufferAttribute(m.indices, 1));
                geom.computeBoundingSphere();
                geom.computeBoundingBox();

                const mat = new THREE.MeshStandardMaterial({
                  color: 0x94a3b8,
                  roughness: 0.35,
                  metalness: 0.25,
                  vertexColors: !!m.colors,
                });
                const mesh = new THREE.Mesh(geom, mat);
                mesh.name = m.name;
                group.add(mesh);
              }
              object = group;
            }
          } catch (workerErr) {
            console.warn('Worker OBJ decoding error, using fallback:', workerErr);
          }
        }

        if (!object) {
          object = await objLoader.loadAsync(url);
        }
      } else if (ext === 'stl') {
        if (globalDecoderWorkerPool.available) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const res = await globalDecoderWorkerPool.decode('stl', { buffer: arrayBuffer });
            if (res.positions) {
              const geom = new THREE.BufferGeometry();
              geom.setAttribute('position', new THREE.BufferAttribute(res.positions, 3));
              if (res.normals) geom.setAttribute('normal', new THREE.BufferAttribute(res.normals, 3));
              else geom.computeVertexNormals();
              geom.computeBoundingSphere();
              geom.computeBoundingBox();

              const mat = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                roughness: 0.35,
                metalness: 0.2,
              });
              object = new THREE.Mesh(geom, mat);
            }
          } catch (workerErr) {
            console.warn('Worker STL decoding error, using fallback:', workerErr);
          }
        }

        if (!object) {
          const geom = await stlLoader.loadAsync(url);
          geom.computeVertexNormals();
          const mat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.35,
            metalness: 0.2,
          });
          object = new THREE.Mesh(geom, mat);
        }
      } else if (isThreeScript(filename)) {
        object = await loadThreeJsScript(file);
      } else {
        throw new Error(
          `Unsupported file format: .${ext}. Supported formats are .glb, .gltf, .fbx, .ply, .spz, .obj, .stl, .ts, .js`
        );
      }

      if (!object) {
        throw new Error(`Failed to parse 3D model geometry for ${filename}`);
      }

      if (isThreeScript(filename)) {
        // Procedural script-generated groups:
        // center horizontal axes (X, Z) and align base to Y=0 (grid floor)
        alignAndCenterProceduralModel(object);
        applyMaterialAndShadowAssurance(object);
      } else {
        optimizeMeshHierarchy(object);
        normalizeModelPosition(object, existingModels);
      }
      const stats = calculateModelStats(object);

      const modelId = `model_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        id: modelId,
        name: filename,
        object,
        visible: true,
        isScript: isThreeScript(filename),
        stats,
        animations,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  });
}

/**
 * Creates a procedural 3D demo sculpture.
 */
export function createDemoModel(existingModels: LoadedModel[]): LoadedModel {
  const group = new THREE.Group();

  // Central Glossy Torus Knot
  const torusGeo = new THREE.TorusKnotGeometry(0.8, 0.24, 128, 20);
  const torusMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.1,
    metalness: 0.85,
  });
  const torusMesh = new THREE.Mesh(torusGeo, torusMat);
  torusMesh.position.y = 1.3;
  torusMesh.castShadow = true;
  group.add(torusMesh);

  // Orbiting Satellites (Spheres & Octahedrons)
  const colors = [0xef4444, 0x10b981, 0xf59e0b, 0xa855f7];
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const geom =
      i % 2 === 0
        ? new THREE.SphereGeometry(0.22, 32, 32)
        : new THREE.OctahedronGeometry(0.25, 0);

    const mat = new THREE.MeshStandardMaterial({
      color: colors[i],
      roughness: 0.2,
      metalness: 0.6,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(Math.cos(angle) * 1.8, 1.3 + Math.sin(angle * 2) * 0.2, Math.sin(angle) * 1.8);
    mesh.castShadow = true;
    group.add(mesh);
  }

  // Futuristic Base Pedestal
  const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.35, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.5,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.175;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  optimizeMeshHierarchy(group);
  normalizeModelPosition(group, existingModels);
  const stats = calculateModelStats(group);

  const modelNumber = existingModels.length + 1;
  const modelId = `demo_model_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: modelId,
    name: `Procedural_Sculpture_${modelNumber}.glb`,
    object: group,
    visible: true,
    stats,
    animations: [],
  };
}

/**
 * Traverses an Object3D hierarchy and deeply disposes all geometries, textures,
 * materials, and skeleton buffers to prevent VRAM memory leaks.
 */
export function dispose3DObject(object: THREE.Object3D): void {
  if (!object) return;

  const disposedTextures = new Set<string>();
  const disposedMaterials = new Set<string>();
  const disposedGeometries = new Set<string>();

  const disposeTexture = (tex: any) => {
    if (tex && typeof tex.dispose === 'function' && !disposedTextures.has(tex.uuid)) {
      disposedTextures.add(tex.uuid);
      tex.dispose();
    }
  };

  const disposeMaterial = (mat: THREE.Material) => {
    if (!mat || disposedMaterials.has(mat.uuid)) return;
    disposedMaterials.add(mat.uuid);

    const matAny = mat as any;
    // Explicit standard PBR texture map properties
    const textureProps = [
      'map',
      'aoMap',
      'alphaMap',
      'bumpMap',
      'normalMap',
      'displacementMap',
      'roughnessMap',
      'metalnessMap',
      'emissiveMap',
      'specularMap',
      'specularColorMap',
      'specularIntensityMap',
      'envMap',
      'lightMap',
      'clearcoatMap',
      'clearcoatRoughnessMap',
      'clearcoatNormalMap',
      'transmissionMap',
      'thicknessMap',
      'sheenColorMap',
      'sheenRoughnessMap',
      'iridescenceMap',
      'iridescenceThicknessMap',
      'anisotropyMap',
      'gradientMap',
      'matcap',
    ];

    for (const prop of textureProps) {
      if (matAny[prop]) {
        disposeTexture(matAny[prop]);
      }
    }

    // Traverse all keys on material to safely catch non-standard or dynamically attached textures
    for (const key of Object.keys(matAny)) {
      const val = matAny[key];
      if (val && typeof val === 'object' && (val.isTexture || val.isWebGLRenderTarget)) {
        disposeTexture(val);
      }
    }

    // Check custom shader uniforms if any
    if (matAny.uniforms) {
      for (const key of Object.keys(matAny.uniforms)) {
        const val = matAny.uniforms[key]?.value;
        if (val && typeof val === 'object') {
          if (val.isTexture || val.isWebGLRenderTarget) {
            disposeTexture(val);
          } else if (Array.isArray(val)) {
            val.forEach((item) => {
              if (item && (item.isTexture || item.isWebGLRenderTarget)) {
                disposeTexture(item);
              }
            });
          }
        }
      }
    }

    mat.dispose();
  };

  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
      // 1. Dispose Geometry
      if (child.geometry && !disposedGeometries.has(child.geometry.uuid)) {
        disposedGeometries.add(child.geometry.uuid);
        child.geometry.dispose();
      }

      // 2. Dispose Materials & Textures
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => disposeMaterial(mat));
        } else {
          disposeMaterial(child.material);
        }
      }

      // 3. Dispose Skeleton / SkinnedMesh bones if present
      if ((child as any).skeleton && typeof (child as any).skeleton.dispose === 'function') {
        (child as any).skeleton.dispose();
      }
    }
  });

  if (object.parent) {
    object.parent.remove(object);
  }
}

/**
 * Captures stack traces, parses line/column numbers, and formats friendly error
 * notifications for TypeScript syntax and runtime execution errors.
 */
export function formatScriptError(
  err: any,
  filename: string,
  stage: 'syntax' | 'runtime',
  sourceCode?: string
): Error {
  const rawMessage = err?.message || String(err);
  const stack = err?.stack || '';

  let lineNumber: number | null = null;
  let columnNumber: number | null = null;

  // 1. Direct location properties from compiler (e.g. Sucrase err.loc = { line, column })
  if (err?.loc && typeof err.loc.line === 'number') {
    lineNumber = err.loc.line;
    columnNumber = typeof err.loc.column === 'number' ? err.loc.column : null;
  }

  // 2. Parse (line:column) from message string
  if (lineNumber === null) {
    const locMatch = rawMessage.match(/\((\d+)[:,\s]+(\d+)\)/);
    if (locMatch) {
      lineNumber = parseInt(locMatch[1], 10);
      columnNumber = parseInt(locMatch[2], 10);
    }
  }

  // 3. Parse "line \d+" from message string
  if (lineNumber === null) {
    const lineMatch = rawMessage.match(/line\s+(\d+)/i);
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
    }
  }

  // 4. Parse stack trace lines:
  // Look for frames referencing <anonymous>, Function, or eval
  if (lineNumber === null && stack) {
    const stackFrames = stack.split('\n');
    for (const frame of stackFrames) {
      const match = frame.match(/(?:<anonymous>|Function|eval)[^:]*:(\d+):(\d+)/i);
      if (match) {
        const rawLine = parseInt(match[1], 10);
        const col = parseInt(match[2], 10);
        // In new Function('THREE', ...), Chrome/V8 wraps code with a 2-line header
        const adjustedLine = rawLine > 2 ? rawLine - 2 : rawLine;
        lineNumber = adjustedLine;
        columnNumber = col;
        break;
      }
    }
  }

  const prefix = stage === 'syntax' ? 'TypeScript syntax error' : 'Runtime execution error';
  const locString = lineNumber !== null 
    ? ` (Line ${lineNumber}${columnNumber !== null ? `:${columnNumber}` : ''})` 
    : '';

  // Clean out redundant prefixes like "Error: ", "SyntaxError: ", "TypeError: "
  const cleanedMsg = rawMessage.replace(/^(?:SyntaxError|TypeError|ReferenceError|RangeError|Error):\s*/i, '');
  const formattedMsg = `${prefix} in "${filename}"${locString}: ${cleanedMsg}`;

  const formattedErr = new Error(formattedMsg);
  formattedErr.stack = stack;
  return formattedErr;
}

/**
 * Traverses an Object3D hierarchy and ensures:
 * 1. Every mesh has castShadow = true and receiveShadow = true.
 * 2. If materials lack environment map intensity or roughness definitions,
 *    assigns sensible PBR defaults (roughness: 0.5, metalness: 0.1, envMapIntensity: 1.0)
 *    so procedural meshes never appear completely black or unlit.
 */
export function applyMaterialAndShadowAssurance(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = true;

      if (child.geometry) {
        if (!child.geometry.boundingSphere) child.geometry.computeBoundingSphere();
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      }

      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (!mat) return;
          const matAny = mat as any;

          // If roughness is missing or undefined/NaN, assign PBR default 0.5
          if (
            matAny.roughness === undefined ||
            matAny.roughness === null ||
            typeof matAny.roughness !== 'number' ||
            isNaN(matAny.roughness)
          ) {
            matAny.roughness = 0.5;
          }

          // If metalness is missing or undefined/NaN, assign PBR default 0.1
          if (
            matAny.metalness === undefined ||
            matAny.metalness === null ||
            typeof matAny.metalness !== 'number' ||
            isNaN(matAny.metalness)
          ) {
            matAny.metalness = 0.1;
          }

          // If envMapIntensity is missing or undefined/NaN, assign default 1.0
          if (
            matAny.envMapIntensity === undefined ||
            matAny.envMapIntensity === null ||
            typeof matAny.envMapIntensity !== 'number' ||
            isNaN(matAny.envMapIntensity)
          ) {
            matAny.envMapIntensity = 1.0;
          }

          mat.needsUpdate = true;
        });
      }
    }
  });
}

/**
 * Auto-centers horizontal axes (X, Z) and aligns base to Y=0 (grid floor)
 * for procedural script-generated groups.
 */
export function alignAndCenterProceduralModel(loadedObject: THREE.Object3D): {
  center: THREE.Vector3;
  size: THREE.Vector3;
  cameraDistance: number;
} {
  const box = new THREE.Box3().setFromObject(loadedObject);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Center horizontal axes (X, Z) and align base to Y=0 (grid floor)
  loadedObject.position.x -= center.x;
  loadedObject.position.z -= center.z;
  loadedObject.position.y -= box.min.y;

  const maxDim = Math.max(size.x, size.y, size.z) || 2;
  const cameraDistance = maxDim * 2.0;

  return { center, size, cameraDistance };
}

/**
 * Loads and dynamically executes a Three.js script (.ts or .js) with 100% plug-and-play
 * compatibility with img2threejs procedural files (such as kitchenModel.ts).
 *
 * Supports:
 * - Dynamic dependency loading of Sucrase
 * - TypeScript transpilation with CommonJS/ESM interop
 * - Universal Export Detection for img2threejs procedural models
 * - Auto-centering and Y=0 ground alignment
 * - Material & shadow assurance for procedural meshes
 * - Precise syntax and runtime error feedback with line numbers
 */
export async function loadThreeJsScript(file: File): Promise<THREE.Object3D> {
  const filename = file.name;
  const code = await file.text();

  // 1. Dynamic Dependency Loading: Sucrase is loaded dynamically only when a script is executed
  let transform: any;
  try {
    const sucraseModule = await import('sucrase');
    transform = sucraseModule.transform;
  } catch (err: any) {
    throw new Error(`TypeScript transpiler error: ${err?.message || err}`);
  }

  // 2. TypeScript & CommonJS Module Transpilation
  let transpiledCode: string;
  try {
    transpiledCode = transform(code, { transforms: ['typescript', 'imports'] }).code;
  } catch (err: any) {
    throw formatScriptError(err, filename, 'syntax', code);
  }

  // 3. Robust Module Interop:
  // Support `import * as THREE from 'three'`, `import THREE from 'three'`, and CommonJS `require('three')`
  const threeExport = new Proxy(THREE, {
    get(target, prop, receiver) {
      if (prop === 'default') return THREE;
      return Reflect.get(target, prop, receiver);
    },
  });
  (threeExport as any).default = THREE;

  if (typeof window !== 'undefined') {
    (window as any).THREE = threeExport;
  }

  const customRequire = (moduleName: string) => {
    if (moduleName === 'three' || moduleName.startsWith('three/') || moduleName.startsWith('three')) {
      return threeExport;
    }
    throw new Error(`Module "${moduleName}" cannot be resolved. Only "three" is supported.`);
  };

  const moduleObj: { exports: any } = { exports: {} };
  const exportsObj = moduleObj.exports;

  // Execute transpiled script in sandbox
  try {
    const fn = new Function('THREE', 'require', 'exports', 'module', transpiledCode);
    fn(threeExport, customRequire, exportsObj, moduleObj);
  } catch (err: any) {
    throw formatScriptError(err, filename, 'runtime', code);
  }

  // 4. Universal Export Detection for img2threejs procedural files:
  // Support multiple export styles:
  // a. module.exports.default
  // b. Named functions such as createModel, createKitchenModel, buildScene, or any function starting with create or generate
  // c. Iterate through all keys in module.exports and if a property is a function returning an instance of THREE.Object3D or THREE.Group, invoke it.
  // d. Handle cases where the export is an instantiated THREE.Object3D directly instead of a factory function.
  // e. Support async factories: const model = await Promise.resolve(candidateExport(THREE));

  interface ExportCandidate {
    name: string;
    value: any;
    priority: number;
    isNamedFactory?: boolean;
  }

  const candidates: ExportCandidate[] = [];

  const inspectExportContainer = (container: any, sourceLabel: string) => {
    if (!container) return;

    // Direct Object3D instance
    if (container instanceof THREE.Object3D) {
      candidates.push({ name: sourceLabel, value: container, priority: 100 });
      return;
    }

    // Direct factory function
    if (typeof container === 'function') {
      candidates.push({ name: sourceLabel, value: container, priority: 95, isNamedFactory: true });
      return;
    }

    if (typeof container === 'object') {
      // 1. Check .default first
      if (container.default !== undefined) {
        if (container.default instanceof THREE.Object3D) {
          candidates.push({ name: 'default', value: container.default, priority: 96 });
        } else if (typeof container.default === 'function') {
          candidates.push({ name: 'default', value: container.default, priority: 95, isNamedFactory: true });
        } else if (typeof container.default === 'object' && container.default !== null) {
          // If default is an object of named functions (e.g. export default { createKitchenModel })
          for (const [subKey, subVal] of Object.entries(container.default)) {
            if (subVal instanceof THREE.Object3D) {
              candidates.push({ name: `default.${subKey}`, value: subVal, priority: 85 });
            } else if (typeof subVal === 'function') {
              const isMatch = /^(create|generate|build|make|init|setup|render)/i.test(subKey);
              candidates.push({
                name: `default.${subKey}`,
                value: subVal,
                priority: isMatch ? 90 : 70,
                isNamedFactory: true,
              });
            }
          }
        }
      }

      // 2. Iterate through all keys in container (img2threejs procedural files)
      for (const [key, val] of Object.entries(container)) {
        if (key === '__esModule' || key === 'default') continue;
        if (val === undefined || val === null) continue;

        if (val instanceof THREE.Object3D) {
          // d. Handle cases where the export is an instantiated THREE.Object3D directly
          candidates.push({ name: key, value: val, priority: 82 });
        } else if (typeof val === 'function') {
          // b. Named functions such as createModel, createKitchenModel, buildScene, or any function starting with create or generate
          const isExactImg2ThreeMatch = /^(createModel|createKitchenModel|buildScene|generateMesh|model|scene|kitchenModel)$/i.test(key);
          const isPrefixMatch = /^(create|generate|build|make|init|setup|render)/i.test(key);

          const priority = isExactImg2ThreeMatch ? 93 : isPrefixMatch ? 89 : 65;
          candidates.push({ name: key, value: val, priority, isNamedFactory: true });
        }
      }
    }
  };

  inspectExportContainer(moduleObj.exports, 'module.exports');
  if (exportsObj && exportsObj !== moduleObj.exports) {
    inspectExportContainer(exportsObj, 'exports');
  }

  // Sort candidates by descending priority
  candidates.sort((a, b) => b.priority - a.priority);

  let finalResult: THREE.Object3D | null = null;
  let factoryRuntimeError: Error | null = null;

  for (const cand of candidates) {
    try {
      let result = cand.value;

      if (typeof result === 'function') {
        try {
          result = result(threeExport);
        } catch (invokeErr: any) {
          if (typeof invokeErr?.message === 'string' && invokeErr.message.includes('without \'new\'')) {
            result = new (result as any)(threeExport);
          } else {
            throw invokeErr;
          }
        }
      }

      // e. Support async factories
      result = await Promise.resolve(result);

      // c. If a property is a function returning an instance of THREE.Object3D or THREE.Group, accept it
      if (result instanceof THREE.Object3D) {
        finalResult = result;
        break;
      }
    } catch (evalErr: any) {
      const formatted = formatScriptError(evalErr, filename, 'runtime', code);
      if (cand.isNamedFactory && cand.priority >= 85) {
        // High confidence factory function threw during execution: surface the error
        throw formatted;
      }
      factoryRuntimeError = formatted;
    }
  }

  // Check if no valid THREE.Object3D was returned
  if (!finalResult) {
    if (factoryRuntimeError) {
      throw factoryRuntimeError;
    }
    throw new Error(
      `Missing Object3D export in "${filename}": Script did not return or export a valid THREE.Object3D or THREE.Group. Ensure your script exports a model (e.g., "export function createKitchenModel(): THREE.Group", "export default createModel", or "export const scene = new THREE.Group()").`
    );
  }

  // Tag procedural script
  finalResult.userData.isScript = true;
  finalResult.userData.isProcedural = true;

  // 3. Material & Shadow Assurance:
  // Ensure every mesh has castShadow = true and receiveShadow = true,
  // and assign sensible PBR defaults (roughness: 0.5, metalness: 0.1) so meshes don't appear black or unlit.
  applyMaterialAndShadowAssurance(finalResult);

  // 2. Auto-centering & Ground Alignment:
  // Center horizontal axes (X, Z) and align base to Y=0 (grid floor)
  alignAndCenterProceduralModel(finalResult);

  return finalResult;
}

/**
 * Dynamically transpiles and executes a Three.js TypeScript or JavaScript script.
 */
export async function executeThreeScript(code: string, filename: string): Promise<THREE.Object3D> {
  const file = new File([code], filename, { type: 'application/typescript' });
  return loadThreeJsScript(file);
}

/**
 * Creates a sample TypeScript script file matching img2threejs procedural files
 * (such as kitchenModel.ts) with full PBR materials, shadows, and universal exports.
 */
export function createSampleScriptFile(): File {
  const sampleScript = `import * as THREE from 'three';

/**
 * Procedural Modern Luxury Kitchen Model
 * Generated dynamically via img2threejs procedural script format!
 */
export function createKitchenModel(): THREE.Group {
  const kitchen = new THREE.Group();
  kitchen.name = 'Luxury_Kitchen_Group';

  // 1. Lower Base Cabinets
  const baseCabinetGeo = new THREE.BoxGeometry(3.6, 0.9, 0.7);
  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.15,
  });
  const baseCabinets = new THREE.Mesh(baseCabinetGeo, cabinetMat);
  baseCabinets.position.set(0, 0.45, 0);
  baseCabinets.castShadow = true;
  baseCabinets.receiveShadow = true;
  kitchen.add(baseCabinets);

  // Cabinet Doors & Drawer Paneling Accents
  for (let i = 0; i < 4; i++) {
    const doorGeo = new THREE.BoxGeometry(0.82, 0.8, 0.03);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.1,
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(-1.35 + i * 0.9, 0.45, 0.365);
    door.castShadow = true;
    kitchen.add(door);

    // Brushed Brass Handles
    const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.25, 16);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.9,
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(-1.35 + i * 0.9, 0.72, 0.39);
    handle.rotation.z = Math.PI / 2;
    handle.castShadow = true;
    kitchen.add(handle);
  }

  // 2. Calacatta Gold Marble Countertop Slab
  const counterGeo = new THREE.BoxGeometry(3.8, 0.08, 0.85);
  const counterMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.15,
    metalness: 0.05,
  });
  const countertop = new THREE.Mesh(counterGeo, counterMat);
  countertop.position.set(0, 0.94, 0.04);
  countertop.castShadow = true;
  countertop.receiveShadow = true;
  kitchen.add(countertop);

  // 3. Stainless Steel Undermount Sink
  const sinkRimGeo = new THREE.BoxGeometry(0.9, 0.02, 0.55);
  const stainlessMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.92,
  });
  const sinkRim = new THREE.Mesh(sinkRimGeo, stainlessMat);
  sinkRim.position.set(-0.85, 0.985, 0.04);
  sinkRim.castShadow = true;
  kitchen.add(sinkRim);

  const sinkBasinGeo = new THREE.BoxGeometry(0.78, 0.25, 0.44);
  const sinkBasinMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.22,
    metalness: 0.88,
  });
  const sinkBasin = new THREE.Mesh(sinkBasinGeo, sinkBasinMat);
  sinkBasin.position.set(-0.85, 0.86, 0.04);
  kitchen.add(sinkBasin);

  // 4. Arched Chrome Commercial Gooseneck Faucet
  const faucetGroup = new THREE.Group();
  faucetGroup.position.set(-0.85, 0.98, -0.15);

  const faucetBaseGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.08, 16);
  const faucetMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.08,
    metalness: 0.95,
  });
  const faucetBase = new THREE.Mesh(faucetBaseGeo, faucetMat);
  faucetBase.position.y = 0.04;
  faucetBase.castShadow = true;
  faucetGroup.add(faucetBase);

  const faucetStemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.32, 16);
  const faucetStem = new THREE.Mesh(faucetStemGeo, faucetMat);
  faucetStem.position.y = 0.2;
  faucetStem.castShadow = true;
  faucetGroup.add(faucetStem);

  const faucetArcGeo = new THREE.TorusGeometry(0.09, 0.014, 16, 32, Math.PI);
  const faucetArc = new THREE.Mesh(faucetArcGeo, faucetMat);
  faucetArc.position.set(0, 0.36, 0.09);
  faucetArc.rotation.y = Math.PI / 2;
  faucetArc.castShadow = true;
  faucetGroup.add(faucetArc);

  kitchen.add(faucetGroup);

  // 5. Induction Glass Cooktop with Illuminated Burner Rings
  const cooktopGeo = new THREE.BoxGeometry(0.9, 0.015, 0.58);
  const cooktopMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.1,
    metalness: 0.8,
  });
  const cooktop = new THREE.Mesh(cooktopGeo, cooktopMat);
  cooktop.position.set(0.85, 0.985, 0.04);
  cooktop.castShadow = true;
  kitchen.add(cooktop);

  // 4 Burner Induction Rings
  const burnerCoords = [
    [-0.24, -0.14, 0.12],
    [-0.24, 0.14, 0.09],
    [0.24, -0.14, 0.1],
    [0.24, 0.14, 0.13],
  ];
  burnerCoords.forEach(([bx, bz, r]) => {
    const ringGeo = new THREE.RingGeometry(r - 0.015, r, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0.85 + bx, 0.995, 0.04 + bz);
    kitchen.add(ring);
  });

  // 6. Modern Wall-Mounted Range Hood
  const hoodGroup = new THREE.Group();
  hoodGroup.position.set(0.85, 1.85, 0.04);

  const hoodCanopyGeo = new THREE.CylinderGeometry(0.25, 0.52, 0.28, 4);
  const hoodMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.25,
    metalness: 0.85,
  });
  const hoodCanopy = new THREE.Mesh(hoodCanopyGeo, hoodMat);
  hoodCanopy.rotation.y = Math.PI / 4;
  hoodCanopy.castShadow = true;
  hoodGroup.add(hoodCanopy);

  const chimneyGeo = new THREE.BoxGeometry(0.35, 0.9, 0.3);
  const chimney = new THREE.Mesh(chimneyGeo, hoodMat);
  chimney.position.y = 0.55;
  chimney.castShadow = true;
  hoodGroup.add(chimney);

  kitchen.add(hoodGroup);

  // 7. Full-Height French-Door Refrigerator
  const fridgeGroup = new THREE.Group();
  fridgeGroup.position.set(2.4, 1.05, 0.08);

  const fridgeBodyGeo = new THREE.BoxGeometry(0.95, 2.1, 0.78);
  const fridgeMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.2,
    metalness: 0.9,
  });
  const fridgeBody = new THREE.Mesh(fridgeBodyGeo, fridgeMat);
  fridgeBody.castShadow = true;
  fridgeBody.receiveShadow = true;
  fridgeGroup.add(fridgeBody);

  // Refrigerator Handles
  const fridgeHandleGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.7, 16);
  const handleL = new THREE.Mesh(fridgeHandleGeo, handleMat);
  handleL.position.set(-0.06, 0.25, 0.42);
  handleL.castShadow = true;
  fridgeGroup.add(handleL);

  const handleR = new THREE.Mesh(fridgeHandleGeo, handleMat);
  handleR.position.set(0.06, 0.25, 0.42);
  handleR.castShadow = true;
  fridgeGroup.add(handleR);

  kitchen.add(fridgeGroup);

  return kitchen;
}

// Support multiple export patterns standard in img2threejs
export const createModel = createKitchenModel;
export const buildScene = createKitchenModel;
export default createKitchenModel;
`;

  return new File([sampleScript], 'kitchenModel.ts', {
    type: 'application/typescript',
  });
}

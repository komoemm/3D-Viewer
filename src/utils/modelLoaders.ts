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
      } else {
        throw new Error(`Unsupported file format: .${ext}`);
      }

      if (!object) {
        throw new Error(`Failed to parse 3D model geometry for ${filename}`);
      }

      optimizeMeshHierarchy(object);
      normalizeModelPosition(object, existingModels);
      const stats = calculateModelStats(object);

      const modelId = `model_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        id: modelId,
        name: filename,
        object,
        visible: true,
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
    // Dispose standard textures
    const textureProps = [
      'map',
      'lightMap',
      'bumpMap',
      'normalMap',
      'specularMap',
      'envMap',
      'alphaMap',
      'roughnessMap',
      'metalnessMap',
      'emissiveMap',
      'displacementMap',
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
    ];

    for (const prop of textureProps) {
      disposeTexture(matAny[prop]);
    }

    // Check custom shader uniforms if any
    if (matAny.uniforms) {
      for (const key of Object.keys(matAny.uniforms)) {
        const val = matAny.uniforms[key]?.value;
        if (val && (val.isTexture || val.isWebGLRenderTarget)) {
          disposeTexture(val);
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

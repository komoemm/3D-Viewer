import * as THREE from 'three';
import { LoadedModel } from '../types';
import { loadModelFile, disposeSceneHierarchy, disposeLoadedModel, loadIFCModel } from './modelLoaders';

export type TargetFormat = 'glb' | 'usdz' | 'ply' | 'obj' | 'stl';
export type InputFormat = 'glb' | 'gltf' | 'obj' | 'ply' | 'stl' | 'fbx' | 'spz' | 'ifc' | 'ts' | 'js' | 'unknown';

export interface ConversionOptions {
  binary?: boolean;
  filename?: string;
  applyTransforms?: boolean;
  includeNormals?: boolean;
  includeColors?: boolean;
  includeUVs?: boolean;
  onProgress?: (step: string, percent: number) => void;
}

export interface ConversionResult {
  blob: Blob;
  filename: string;
  size: number;
  durationMs: number;
  vertexCount: number;
  triangleCount: number;
  meshCount: number;
  targetFormat: TargetFormat;
  isBinary: boolean;
}

/**
 * Validates format support and provides user-friendly notices for unsupported formats (e.g., FBX).
 */
export function checkFormatSupport(format: string): { isSupported: boolean; notice?: string } {
  const lower = (format || '').toLowerCase().trim();
  if (lower === 'fbx') {
    return {
      isSupported: false,
      notice: 'FBX export requires server-side rendering, please use GLB or OBJ.',
    };
  }
  if (['glb', 'usdz', 'ply', 'obj', 'stl'].includes(lower)) {
    return { isSupported: true };
  }
  return {
    isSupported: false,
    notice: `Export to format "${format.toUpperCase()}" is not supported client-side. Please choose GLB, USDZ, OBJ, PLY, or STL.`,
  };
}

/**
 * On-demand lazy loaders for Three.js exporters.
 * Using dynamic import() guarantees zero impact on initial bundle size.
 */
export async function getGLTFExporter() {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  return new GLTFExporter();
}

export async function getUSDZExporter() {
  const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
  return new USDZExporter();
}

export async function getPLYExporter() {
  const { PLYExporter } = await import('three/examples/jsm/exporters/PLYExporter.js');
  return new PLYExporter();
}

export async function getOBJExporter() {
  const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js');
  return new OBJExporter();
}

export async function getSTLExporter() {
  const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
  return new STLExporter();
}

/**
 * Inspects a 3D Object hierarchy to collect geometry metrics:
 * vertices, triangles, and meshes.
 */
export function inspectObjectGeometry(object: THREE.Object3D): {
  vertexCount: number;
  triangleCount: number;
  meshCount: number;
  pointCount: number;
  hasMeshes: boolean;
  hasPoints: boolean;
} {
  let vertexCount = 0;
  let triangleCount = 0;
  let meshCount = 0;
  let pointCount = 0;

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount++;
      const geom = child.geometry;
      if (geom) {
        if (geom.index) {
          triangleCount += Math.round(geom.index.count / 3);
        } else if (geom.attributes.position) {
          triangleCount += Math.round(geom.attributes.position.count / 3);
        }
        if (geom.attributes.position) {
          vertexCount += geom.attributes.position.count;
        }
      }
    } else if (child instanceof THREE.Points) {
      pointCount++;
      const geom = child.geometry;
      if (geom && geom.attributes.position) {
        vertexCount += geom.attributes.position.count;
      }
    }
  });

  return {
    vertexCount,
    triangleCount,
    meshCount,
    pointCount,
    hasMeshes: meshCount > 0,
    hasPoints: pointCount > 0,
  };
}

/**
 * Detects the input format from filename or LoadedModel.
 */
export function detectFormatFromFilename(name: string): InputFormat {
  if (!name) return 'unknown';
  const clean = name.toLowerCase().split('?')[0].split('#')[0];
  const ext = clean.split('.').pop() || '';
  if (['glb', 'gltf', 'obj', 'ply', 'stl', 'fbx', 'spz', 'ifc', 'ts', 'js'].includes(ext)) {
    return ext as InputFormat;
  }
  return 'unknown';
}

/**
 * Converts a Three.js Object3D into the target format (PLY, OBJ, or STL)
 * on the client side using Three.js built-in exporters.
 * Yields to main thread before and after export to preserve low INP and prevent UI freeze.
 */
export async function convertObject3D(
  sourceObject: THREE.Object3D,
  targetFormat: TargetFormat,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const startTime = performance.now();

  // Defer heavy conversion parsing to next event loop tick using 50ms timeout
  // so the conversion spinner immediately renders on the UI without blocking main thread responsiveness (INP)
  await new Promise((resolve) => setTimeout(resolve, 50));

  const stats = inspectObjectGeometry(sourceObject);

  if ((targetFormat as string).toLowerCase() === 'fbx') {
    throw new Error('FBX export requires server-side rendering, please use GLB or OBJ.');
  }

  // Validate format requirements
  if (targetFormat === 'stl' || targetFormat === 'obj') {
    if (!stats.hasMeshes) {
      if (stats.hasPoints) {
        throw new Error(
          `Target format "${targetFormat.toUpperCase()}" requires polygonal surface meshes (faces). The selected model only contains point clouds. Please convert to PLY instead.`
        );
      }
      throw new Error(
        `The selected 3D model does not contain any exportable polygonal geometry.`
      );
    }
  } else if (targetFormat === 'usdz') {
    if (!stats.hasMeshes) {
      throw new Error(
        `USDZ export requires polygonal surface meshes. Please convert to PLY or GLB instead.`
      );
    }
  } else if (targetFormat === 'ply' || targetFormat === 'glb') {
    if (!stats.hasMeshes && !stats.hasPoints) {
      throw new Error(
        `The selected 3D model does not contain any exportable mesh or point geometry.`
      );
    }
  }

  // Clone or prepare export target
  // We apply matrix world updates so exported coordinates are accurate
  sourceObject.updateMatrixWorld(true);

  // Track any cloned geometries and materials to guarantee complete Three.js memory cleanup
  const clonedGeometries: THREE.BufferGeometry[] = [];
  const clonedMaterials: THREE.Material[] = [];
  let exportObject: THREE.Object3D = sourceObject;

  if (options.applyTransforms) {
    exportObject = sourceObject.clone(true);
    exportObject.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const clonedGeom = child.geometry.clone();
        clonedGeom.applyMatrix4(child.matrixWorld);
        child.geometry = clonedGeom;
        child.position.set(0, 0, 0);
        child.rotation.set(0, 0, 0);
        child.scale.set(1, 1, 1);
        child.updateMatrix();
        clonedGeometries.push(clonedGeom);
      }
      if ((child as any).material) {
        const mat = (child as any).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            const clonedMat = m.clone();
            clonedMaterials.push(clonedMat);
          });
        } else if (mat) {
          const clonedMat = mat.clone();
          clonedMaterials.push(clonedMat);
        }
      }
    });
  }

  let exportData: ArrayBuffer | string | DataView | null = null;
  let isBinary = options.binary !== false;
  let mimeType = 'application/octet-stream';

  try {
    if (targetFormat === 'ply') {
      // Dynamic import triggered only when PLY is selected
      const { PLYExporter } = await import('three/examples/jsm/exporters/PLYExporter.js');
      const exporter = new PLYExporter();
      isBinary = options.binary !== false;
      mimeType = isBinary ? 'application/octet-stream' : 'text/plain;charset=utf-8';

      const excludeAttrs: string[] = [];
      if (options.includeNormals === false) excludeAttrs.push('normal');
      if (options.includeColors === false) excludeAttrs.push('color');
      if (options.includeUVs === false) excludeAttrs.push('uv', 'uv2');

      exportData = await new Promise<ArrayBuffer | string>((resolve, reject) => {
        try {
          const res = exporter.parse(
            exportObject,
            (output) => {
              if (output) resolve(output);
            },
            {
              binary: isBinary,
              excludeAttributes: excludeAttrs,
            }
          );
          // If parse returned synchronously before callback
          if (res) {
            resolve(res);
          }
        } catch (err) {
          reject(err);
        }
      });
    } else if (targetFormat === 'glb') {
      // Dynamic import triggered only when GLB is selected
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
      const exporter = new GLTFExporter();
      isBinary = true;
      mimeType = 'model/gltf-binary';
      const glbOutput = await exporter.parseAsync(exportObject, {
        binary: true,
        embedImages: true,
        onlyVisible: true,
      });
      if (glbOutput instanceof ArrayBuffer) {
        exportData = glbOutput;
      } else if (glbOutput instanceof Uint8Array) {
        exportData = glbOutput.buffer;
      } else {
        exportData = glbOutput as any;
      }
    } else if (targetFormat === 'usdz') {
      // Dynamic import triggered only when USDZ is selected
      const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
      const exporter = new USDZExporter();
      isBinary = true;
      mimeType = 'model/vnd.usdz+zip';
      const usdzOutput = await exporter.parseAsync(exportObject);
      if (usdzOutput instanceof ArrayBuffer) {
        exportData = usdzOutput;
      } else if (usdzOutput instanceof Uint8Array) {
        exportData = usdzOutput.buffer;
      } else {
        exportData = usdzOutput as any;
      }
    } else if (targetFormat === 'obj') {
      // Dynamic import triggered only when OBJ is selected
      const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js');
      const exporter = new OBJExporter();
      isBinary = false;
      mimeType = 'text/plain;charset=utf-8';
      exportData = exporter.parse(exportObject);
    } else if (targetFormat === 'stl') {
      // Dynamic import triggered only when STL is selected
      const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
      const exporter = new STLExporter();
      isBinary = options.binary !== false;
      mimeType = isBinary ? 'application/octet-stream' : 'text/plain;charset=utf-8';
      const stlResult = exporter.parse(exportObject, { binary: isBinary });
      exportData = stlResult;
    } else if ((targetFormat as string).toLowerCase() === 'fbx') {
      throw new Error('FBX export requires server-side rendering, please use GLB or OBJ.');
    } else {
      throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  } catch (err: any) {
    throw new Error(
      `Failed to export 3D geometry to ${targetFormat.toUpperCase()}: ${err?.message || err}`
    );
  } finally {
    // Implement proper Three.js memory cleanup: dispose() cloned geometries & materials once export completes
    for (const geom of clonedGeometries) {
      try {
        if (geom.attributes) {
          for (const attrName of Object.keys(geom.attributes)) {
            const attr = geom.attributes[attrName];
            if (attr && typeof (attr as any).dispose === 'function') {
              (attr as any).dispose();
            }
          }
        }
        if (geom.index && typeof (geom.index as any).dispose === 'function') {
          (geom.index as any).dispose();
        }
        geom.dispose();
      } catch (e) {
        console.warn('Error disposing cloned geometry:', e);
      }
    }
    for (const mat of clonedMaterials) {
      try {
        mat.dispose();
      } catch (e) {
        console.warn('Error disposing cloned material:', e);
      }
    }
    clonedGeometries.length = 0;
    clonedMaterials.length = 0;
  }

  if (!exportData) {
    throw new Error(`Export generated empty data for format: ${targetFormat.toUpperCase()}`);
  }

  // Construct binary or text Blob
  let blob: Blob;
  if (exportData instanceof DataView) {
    blob = new Blob([exportData.buffer], { type: mimeType });
  } else if (exportData instanceof ArrayBuffer) {
    blob = new Blob([exportData], { type: mimeType });
  } else if (typeof exportData === 'string') {
    blob = new Blob([exportData], { type: mimeType });
  } else {
    blob = new Blob([exportData as any], { type: mimeType });
  }

  // Compute clean output filename
  const baseName = options.filename
    ? options.filename.replace(/\.[^/.]+$/, '')
    : 'converted_model';
  const finalFilename = `${baseName}.${targetFormat}`;

  const durationMs = Math.round(performance.now() - startTime);

  // Yield back to main thread after heavy blob generation before returning
  await new Promise((resolve) => setTimeout(resolve, 0));

  return {
    blob,
    filename: finalFilename,
    size: blob.size,
    durationMs,
    vertexCount: stats.vertexCount,
    triangleCount: stats.triangleCount,
    meshCount: stats.meshCount,
    targetFormat,
    isBinary,
  };
}

export type IFCConversionStep = 'Reading IFC' | 'Building Geometry' | 'Exporting GLB';

export interface IFCConversionStats {
  vertexCount: number;
  triangleCount: number;
  meshCount: number;
}

/**
 * Yields execution back to the browser's main thread to allow layout/paint ticks,
 * avoiding UI thread lockup and maintaining optimal Interaction to Next Paint (INP).
 */
const yieldToMain = (ms = 16): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strict memory management for temporary IFC objects.
 * Deeply traverses the hierarchy and disposes of all geometries, attributes,
 * index buffers, morph attributes, materials, and textures, as well as web-ifc manager models,
 * to guarantee complete cleanup of heap and GPU memory.
 */
export function disposeIFCTemporaryScene(root: THREE.Object3D | null | undefined): void {
  if (!root) return;

  const disposedGeometries = new Set<string>();
  const disposedMaterials = new Set<string>();
  const disposedTextures = new Set<string>();

  const disposeTexture = (tex: any) => {
    if (!tex || typeof tex !== 'object' || disposedTextures.has(tex.uuid)) return;
    disposedTextures.add(tex.uuid);
    try {
      if (typeof tex.dispose === 'function') tex.dispose();
      if (tex.image) {
        if (typeof (tex.image as ImageBitmap).close === 'function') {
          (tex.image as ImageBitmap).close();
        }
        tex.image = null;
      }
      if (tex.source) {
        if (tex.source.data && typeof (tex.source.data as ImageBitmap).close === 'function') {
          (tex.source.data as ImageBitmap).close();
        }
        tex.source.data = null;
      }
    } catch (_) {}
  };

  const disposeMaterial = (mat: THREE.Material) => {
    if (!mat || typeof mat !== 'object' || disposedMaterials.has(mat.uuid)) return;
    disposedMaterials.add(mat.uuid);

    const matAny = mat as any;
    const mapProps = [
      'map',
      'alphaMap',
      'aoMap',
      'bumpMap',
      'displacementMap',
      'emissiveMap',
      'envMap',
      'lightMap',
      'metalnessMap',
      'normalMap',
      'roughnessMap',
      'specularMap',
      'gradientMap',
    ];
    for (const prop of mapProps) {
      if (matAny[prop]) {
        disposeTexture(matAny[prop]);
        matAny[prop] = null;
      }
    }

    try {
      mat.dispose();
    } catch (_) {}
  };

  const disposeGeometry = (geom: THREE.BufferGeometry) => {
    if (!geom || typeof geom !== 'object' || disposedGeometries.has(geom.uuid)) return;
    disposedGeometries.add(geom.uuid);

    try {
      if (geom.attributes) {
        for (const key of Object.keys(geom.attributes)) {
          const attr = geom.attributes[key];
          if (attr && typeof (attr as any).dispose === 'function') {
            (attr as any).dispose();
          }
        }
      }
      if (geom.index && typeof (geom.index as any).dispose === 'function') {
        (geom.index as any).dispose();
      }
      if (geom.morphAttributes) {
        for (const key of Object.keys(geom.morphAttributes)) {
          const morphArr = geom.morphAttributes[key];
          if (Array.isArray(morphArr)) {
            morphArr.forEach((attr: any) => {
              if (attr && typeof attr.dispose === 'function') {
                attr.dispose();
              }
            });
          }
        }
      }
      geom.dispose();
    } catch (_) {}
  };

  // Traverse the hierarchy to dispose all meshes, points, lines, geometries, and materials
  root.traverse((child: any) => {
    // If it's a web-ifc model, close it via ifcManager if available
    if (child.modelID !== undefined && child.ifcManager) {
      try {
        child.ifcManager.close(child.modelID);
      } catch (_) {}
    }

    if (child.geometry) {
      disposeGeometry(child.geometry);
      child.geometry = null;
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m: THREE.Material) => disposeMaterial(m));
      } else {
        disposeMaterial(child.material);
      }
      child.material = null;
    }
  });

  // Call disposeSceneHierarchy for any remaining scene elements
  disposeSceneHierarchy(root);

  // Detach all child nodes
  while (root.children.length > 0) {
    const child = root.children[0];
    root.remove(child);
  }

  disposedGeometries.clear();
  disposedMaterials.clear();
  disposedTextures.clear();
}

/**
 * Converts raw IFC (Industry Foundation Classes) binary data into a binary GLB Blob.
 * Dynamically loads IFCLoader (via loadIFCModel) and GLTFExporter only when invoked,
 * protecting initial bundle size and Google Lighthouse metrics.
 *
 * 1. Parses the IFC model into a Three.js scene/group with coordinate centering
 * 2. Cleans up any unneeded helper objects, lights, cameras, or debug nodes
 * 3. Runs GLTFExporter.parse with binary: true
 * 4. Strictly traverses and disposes of all temporary meshes, geometries, and materials
 * 5. Returns the resulting binary GLB Blob.
 */
export async function convertIFCToGLB(
  ifcData: ArrayBuffer,
  onStepProgress?: (step: IFCConversionStep, percent: number) => void,
  onStatsGathered?: (stats: IFCConversionStats) => void
): Promise<Blob> {
  // Step 1: Reading IFC
  onStepProgress?.('Reading IFC', 10);
  await yieldToMain(25);

  if (!ifcData || ifcData.byteLength === 0) {
    throw new Error('IFC binary data is empty or invalid.');
  }

  onStepProgress?.('Reading IFC', 25);
  await yieldToMain(20);

  // Step 2: Building Geometry
  onStepProgress?.('Building Geometry', 35);
  await yieldToMain(20);

  let ifcScene: THREE.Object3D | null = null;
  try {
    ifcScene = await loadIFCModel(ifcData, (pct) => {
      const mappedPct = Math.round(35 + (pct / 100) * 35);
      onStepProgress?.('Building Geometry', Math.min(68, mappedPct));
    });

    onStepProgress?.('Building Geometry', 70);
    await yieldToMain(25);

    // Clean up any unneeded helper objects, cameras, lights, or debug gizmos
    const helpersToRemove: THREE.Object3D[] = [];
    ifcScene.traverse((child) => {
      if (
        child instanceof THREE.Camera ||
        child instanceof THREE.Light ||
        child.type.includes('Helper') ||
        child.type.includes('Gizmo') ||
        child.name.toLowerCase().includes('helper') ||
        child.name.toLowerCase().includes('grid')
      ) {
        helpersToRemove.push(child);
      }
    });

    for (const helper of helpersToRemove) {
      if (helper.parent) {
        helper.parent.remove(helper);
      }
    }

    ifcScene.updateMatrixWorld(true);

    // Extract geometry stats before export & cleanup
    const stats = inspectObjectGeometry(ifcScene);
    onStatsGathered?.({
      vertexCount: stats.vertexCount,
      triangleCount: stats.triangleCount,
      meshCount: Math.max(1, stats.meshCount),
    });

    // Step 3: Exporting GLB
    onStepProgress?.('Exporting GLB', 75);
    await yieldToMain(25);

    // 1. Dynamic import for GLTFExporter to eliminate upfront bundle overhead
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    const exporter = new GLTFExporter();

    onStepProgress?.('Exporting GLB', 85);
    await yieldToMain(20);

    // 2. Export options with { binary: true } to output .glb format
    const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      try {
        exporter.parse(
          ifcScene!,
          (result) => {
            if (result instanceof ArrayBuffer) {
              resolve(result);
            } else if (result instanceof Uint8Array) {
              resolve(result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength));
            } else {
              reject(new Error('GLTFExporter failed to return a binary ArrayBuffer for .glb export'));
            }
          },
          (error) => {
            reject(error instanceof Error ? error : new Error(String(error)));
          },
          {
            binary: true,
            embedImages: true,
            onlyVisible: true,
          }
        );
      } catch (err) {
        reject(err);
      }
    });

    onStepProgress?.('Exporting GLB', 98);
    await yieldToMain(16);

    const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
    onStepProgress?.('Exporting GLB', 100);

    return blob;
  } finally {
    // 3. Strict Memory Management: traverse and dispose of all temporary meshes,
    // geometries, and materials created during the IFC parsing phase once the GLB export completes
    if (ifcScene) {
      disposeIFCTemporaryScene(ifcScene);
      ifcScene = null;
    }
  }
}

/**
 * Converts a raw 3D File directly on the client side by loading it into an isolated
 * Three.js Object3D, exporting to target format, and thoroughly disposing of the
 * temporary geometry, materials, and textures to prevent memory leaks and VRAM spikes.
 */
export async function convertUploadedFile(
  file: File,
  targetFormat: TargetFormat,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  // Optimized direct path for IFC to GLB conversion
  if (ext === 'ifc' && targetFormat === 'glb') {
    const startTime = performance.now();
    options.onProgress?.('Reading IFC', 10);
    await yieldToMain(30);

    const arrayBuffer = await file.arrayBuffer();

    let ifcStats: IFCConversionStats = { vertexCount: 0, triangleCount: 0, meshCount: 1 };
    const blob = await convertIFCToGLB(
      arrayBuffer,
      (step, pct) => {
        options.onProgress?.(step, pct);
      },
      (stats) => {
        ifcStats = stats;
      }
    );

    const durationMs = Math.round(performance.now() - startTime);
    const baseName = options.filename || file.name.replace(/\.[^/.]+$/, '');
    return {
      blob,
      filename: `${baseName}.glb`,
      size: blob.size,
      durationMs,
      vertexCount: ifcStats.vertexCount,
      triangleCount: ifcStats.triangleCount,
      meshCount: ifcStats.meshCount,
      targetFormat: 'glb',
      isBinary: true,
    };
  }

  let loadedModel: LoadedModel | null = null;

  try {
    // 1. Load isolated model file
    loadedModel = await loadModelFile(file, []);

    // 2. Perform conversion
    const baseName = options.filename || file.name.replace(/\.[^/.]+$/, '');
    const result = await convertObject3D(loadedModel.object, targetFormat, {
      ...options,
      filename: baseName,
    });

    return result;
  } finally {
    // 3. Strict Memory Disposal: Free all temporary buffers and GPU context
    if (loadedModel) {
      disposeLoadedModel(loadedModel);
      disposeSceneHierarchy(loadedModel.object);
      loadedModel = null;
    }
  }
}

/**
 * Triggers a native browser file download for a generated Blob
 * and automatically revokes the created blob URL with URL.revokeObjectURL(url)
 * shortly after triggering the download to eliminate memory leaks.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // Automatically revoke the created blob URL shortly after triggering the download to eliminate memory leaks
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

/**
 * Formats byte size into human-readable string.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

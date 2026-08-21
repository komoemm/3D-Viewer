import * as THREE from 'three';
import * as fflate from 'fflate';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

export interface DecodedMeshGeometry {
  name: string;
  positions: Float32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  colors?: Float32Array;
  indices?: Uint32Array;
}

export interface WorkerDecodeRequest {
  id: string;
  type: 'spz' | 'obj' | 'stl' | 'ply';
  buffer?: ArrayBuffer;
  text?: string;
}

export interface WorkerDecodeResponse {
  id: string;
  success: boolean;
  type: 'spz' | 'obj' | 'stl' | 'ply';
  meshes?: DecodedMeshGeometry[];
  positions?: Float32Array;
  colors?: Float32Array;
  normals?: Float32Array;
  indices?: Uint32Array;
  isPoints?: boolean;
  error?: string;
}

const objLoader = new OBJLoader();
const stlLoader = new STLLoader();
const plyLoader = new PLYLoader();

/**
 * Decode SPZ compressed Gaussian Splat / Point Cloud
 */
function decodeSPZ(arrayBuffer: ArrayBuffer): { positions: Float32Array; colors: Float32Array } {
  let uncompressed: Uint8Array;
  try {
    uncompressed = fflate.decompressSync(new Uint8Array(arrayBuffer));
  } catch (err) {
    uncompressed = new Uint8Array(arrayBuffer);
  }

  const numPoints = Math.min(Math.floor(uncompressed.byteLength / 16), 150000);
  const dataView = new DataView(uncompressed.buffer, uncompressed.byteOffset, uncompressed.byteLength);

  const posList: number[] = [];
  const colList: number[] = [];

  const tempColor = new THREE.Color();

  for (let i = 0; i < numPoints; i++) {
    const offset = i * 16;
    if (offset + 12 <= uncompressed.byteLength) {
      const x = dataView.getFloat32(offset, true) || 0;
      const y = dataView.getFloat32(offset + 4, true) || 0;
      const z = dataView.getFloat32(offset + 8, true) || 0;

      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        posList.push(x, y, z);
        const hue = (y * 0.5 + 0.5) % 1;
        tempColor.setHSL(hue, 0.75, 0.6);
        colList.push(tempColor.r, tempColor.g, tempColor.b);
      }
    }
  }

  if (posList.length === 0) {
    posList.push(0, 0, 0);
    colList.push(0.3, 0.6, 1.0);
  }

  return {
    positions: new Float32Array(posList),
    colors: new Float32Array(colList),
  };
}

/**
 * Parse OBJ ASCII text
 */
function parseOBJ(text: string): { meshes: DecodedMeshGeometry[]; transferables: ArrayBuffer[] } {
  const group = objLoader.parse(text);
  const meshes: DecodedMeshGeometry[] = [];
  const transferables: ArrayBuffer[] = [];

  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geom = child.geometry;
      const posAttr = geom.getAttribute('position');
      if (posAttr && posAttr.array) {
        const positions = new Float32Array(posAttr.array);
        transferables.push(positions.buffer);

        let normals: Float32Array | undefined;
        const normAttr = geom.getAttribute('normal');
        if (normAttr && normAttr.array) {
          normals = new Float32Array(normAttr.array);
          transferables.push(normals.buffer);
        }

        let uvs: Float32Array | undefined;
        const uvAttr = geom.getAttribute('uv');
        if (uvAttr && uvAttr.array) {
          uvs = new Float32Array(uvAttr.array);
          transferables.push(uvs.buffer);
        }

        let colors: Float32Array | undefined;
        const colAttr = geom.getAttribute('color');
        if (colAttr && colAttr.array) {
          colors = new Float32Array(colAttr.array);
          transferables.push(colors.buffer);
        }

        let indices: Uint32Array | undefined;
        if (geom.index && geom.index.array) {
          indices = new Uint32Array(geom.index.array);
          transferables.push(indices.buffer);
        }

        meshes.push({
          name: child.name || `mesh_${meshes.length}`,
          positions,
          normals,
          uvs,
          colors,
          indices,
        });
      }
    }
  });

  return { meshes, transferables };
}

/**
 * Parse STL buffer
 */
function parseSTL(buffer: ArrayBuffer): {
  positions: Float32Array;
  normals?: Float32Array;
  transferables: ArrayBuffer[];
} {
  const geom = stlLoader.parse(buffer);
  const posAttr = geom.getAttribute('position');
  const positions = new Float32Array(posAttr.array);
  const transferables: ArrayBuffer[] = [positions.buffer];

  let normals: Float32Array | undefined;
  const normAttr = geom.getAttribute('normal');
  if (normAttr && normAttr.array) {
    normals = new Float32Array(normAttr.array);
    transferables.push(normals.buffer);
  }

  return { positions, normals, transferables };
}

/**
 * Parse PLY buffer
 */
function parsePLY(buffer: ArrayBuffer): {
  positions: Float32Array;
  normals?: Float32Array;
  colors?: Float32Array;
  indices?: Uint32Array;
  isPoints: boolean;
  transferables: ArrayBuffer[];
} {
  const geom = plyLoader.parse(buffer);
  geom.computeVertexNormals();

  const posAttr = geom.getAttribute('position');
  const positions = new Float32Array(posAttr.array);
  const transferables: ArrayBuffer[] = [positions.buffer];

  let normals: Float32Array | undefined;
  const normAttr = geom.getAttribute('normal');
  if (normAttr && normAttr.array) {
    normals = new Float32Array(normAttr.array);
    transferables.push(normals.buffer);
  }

  let colors: Float32Array | undefined;
  const colAttr = geom.getAttribute('color');
  if (colAttr && colAttr.array) {
    colors = new Float32Array(colAttr.array);
    transferables.push(colors.buffer);
  }

  let indices: Uint32Array | undefined;
  if (geom.index && geom.index.array) {
    indices = new Uint32Array(geom.index.array);
    transferables.push(indices.buffer);
  }

  const isPoints = !(geom.index || (geom.attributes.normal && posAttr.count > 500));

  return { positions, normals, colors, indices, isPoints, transferables };
}

self.onmessage = (event: MessageEvent<WorkerDecodeRequest>) => {
  const { id, type, buffer, text } = event.data;

  try {
    if (type === 'spz' && buffer) {
      const { positions, colors } = decodeSPZ(buffer);
      const response: WorkerDecodeResponse = {
        id,
        success: true,
        type: 'spz',
        positions,
        colors,
      };
      (self as any).postMessage(response, [positions.buffer, colors.buffer]);
    } else if (type === 'obj' && (text || buffer)) {
      const objText = text || (buffer ? new TextDecoder().decode(buffer) : '');
      const { meshes, transferables } = parseOBJ(objText);
      const response: WorkerDecodeResponse = {
        id,
        success: true,
        type: 'obj',
        meshes,
      };
      (self as any).postMessage(response, transferables);
    } else if (type === 'stl' && buffer) {
      const { positions, normals, transferables } = parseSTL(buffer);
      const response: WorkerDecodeResponse = {
        id,
        success: true,
        type: 'stl',
        positions,
        normals,
      };
      (self as any).postMessage(response, transferables);
    } else if (type === 'ply' && buffer) {
      const { positions, normals, colors, indices, isPoints, transferables } = parsePLY(buffer);
      const response: WorkerDecodeResponse = {
        id,
        success: true,
        type: 'ply',
        positions,
        normals,
        colors,
        indices,
        isPoints,
      };
      (self as any).postMessage(response, transferables);
    } else {
      throw new Error(`Unsupported worker decode type or missing data: ${type}`);
    }
  } catch (err: any) {
    const errorResponse: WorkerDecodeResponse = {
      id,
      success: false,
      type,
      error: err?.message || 'Worker decoding failed',
    };
    self.postMessage(errorResponse);
  }
};

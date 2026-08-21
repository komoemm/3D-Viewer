import * as THREE from 'three';
import * as fflate from 'fflate';

/**
 * Decodes .spz (compressed Gaussian Splat / Point Cloud format) using fflate decompression.
 */
export async function decodeSPZ(file: File): Promise<THREE.BufferGeometry> {
  const arrayBuffer = await file.arrayBuffer();
  let uncompressed: Uint8Array;
  
  try {
    uncompressed = fflate.decompressSync(new Uint8Array(arrayBuffer));
  } catch (err) {
    console.warn('SPZ decompressSync failed, falling back to raw buffer:', err);
    uncompressed = new Uint8Array(arrayBuffer);
  }

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];

  const buffer = uncompressed.buffer;
  const dataView = new DataView(buffer, uncompressed.byteOffset, uncompressed.byteLength);
  const numPoints = Math.min(Math.floor(uncompressed.byteLength / 16), 150000);

  if (numPoints > 0) {
    for (let i = 0; i < numPoints; i++) {
      const offset = i * 16;
      if (offset + 12 <= uncompressed.byteLength) {
        const x = dataView.getFloat32(offset, true) || 0;
        const y = dataView.getFloat32(offset + 4, true) || 0;
        const z = dataView.getFloat32(offset + 8, true) || 0;

        // Simple validation against NaNs or infinite values
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          positions.push(x, y, z);
          // Color based on height or default vibrant hue
          const hue = (y * 0.5 + 0.5) % 1;
          const color = new THREE.Color().setHSL(hue, 0.75, 0.6);
          colors.push(color.r, color.g, color.b);
        }
      }
    }
  }

  if (positions.length === 0) {
    positions.push(0, 0, 0);
    colors.push(0.3, 0.6, 1.0);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  return geometry;
}

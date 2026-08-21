import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { decodeSPZ } from './spzDecoder';
import { LoadedModel, ModelStats } from '../types';

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
 * Calculates statistics (triangles, vertices, mesh count, materials, size) for an Object3D.
 */
export function calculateModelStats(object: THREE.Object3D): ModelStats {
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  const materialSet = new Set<string>();

  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
      meshes++;
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
 */
export async function loadModelFile(file: File, existingModels: LoadedModel[]): Promise<LoadedModel> {
  const filename = file.name;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const url = URL.createObjectURL(file);

  let object: THREE.Object3D;
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
    } else if (ext === 'spz') {
      const geom = await decodeSPZ(file);
      const mat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
      });
      object = new THREE.Points(geom, mat);
    } else if (ext === 'obj') {
      object = await objLoader.loadAsync(url);
    } else if (ext === 'stl') {
      const geom = await stlLoader.loadAsync(url);
      geom.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.35,
        metalness: 0.2,
      });
      object = new THREE.Mesh(geom, mat);
    } else {
      throw new Error(`Unsupported file format: .${ext}`);
    }

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

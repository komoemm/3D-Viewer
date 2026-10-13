import * as THREE from 'three';

declare module 'web-ifc-three' {
  export class IFCManager {
    setWasmPath(path: string): Promise<void> | void;
    setupThreeMeshBVH?(...args: any[]): void;
    useJSONData?(use: boolean): void;
    close?(modelID: number): void;
    applyWebIfcConfig?(config: any): Promise<void> | void;
  }

  export class IFCModel extends THREE.Mesh {
    modelID: number;
    ifcManager: IFCManager;
    mesh: THREE.Mesh;
    setIFCManager(manager: IFCManager): void;
    setWasmPath(path: string): void;
  }

  export class IFCLoader extends THREE.Loader {
    ifcManager: IFCManager;
    constructor(manager?: THREE.LoadingManager);
    load(
      url: string,
      onLoad: (ifcModel: IFCModel) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: any) => void
    ): void;
    loadAsync(
      url: string,
      onProgress?: (event: ProgressEvent) => void
    ): Promise<IFCModel>;
    parse(buffer: ArrayBuffer): Promise<IFCModel>;
  }
}

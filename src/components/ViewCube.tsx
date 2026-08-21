import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { CameraView } from '../types';
import { Focus } from 'lucide-react';

interface ViewCubeProps {
  onSetCameraView: (view: CameraView) => void;
  onFocusSelected: () => void;
  hasSelection: boolean;
  cameraQuaternionRef: React.MutableRefObject<THREE.Quaternion>;
}

export const ViewCube: React.FC<ViewCubeProps> = ({
  onSetCameraView,
  onFocusSelected,
  hasSelection,
  cameraQuaternionRef,
}) => {
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    const invQ = new THREE.Quaternion();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');

    const updateRotation = () => {
      animId = requestAnimationFrame(updateRotation);
      if (!cubeRef.current) return;

      // Inverse of camera quaternion gives the relative orientation for the cube
      invQ.copy(cameraQuaternionRef.current).invert();
      euler.setFromQuaternion(invQ, 'YXZ');

      // Convert radians to degrees for CSS transform
      const rotX = THREE.MathUtils.radToDeg(euler.x);
      const rotY = THREE.MathUtils.radToDeg(euler.y);
      const rotZ = THREE.MathUtils.radToDeg(euler.z);

      cubeRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
    };

    updateRotation();
    return () => cancelAnimationFrame(animId);
  }, [cameraQuaternionRef]);

  const faces = [
    { label: 'TOP', view: 'top' as CameraView, transform: 'rotateX(90deg) translateZ(40px)', bg: 'bg-emerald-600/30 hover:bg-emerald-500/70 border-emerald-400/40' },
    { label: 'BOTTOM', view: 'bottom' as CameraView, transform: 'rotateX(-90deg) translateZ(40px)', bg: 'bg-slate-700/40 hover:bg-slate-500/70 border-slate-400/40' },
    { label: 'FRONT', view: 'front' as CameraView, transform: 'translateZ(40px)', bg: 'bg-blue-600/40 hover:bg-blue-500/70 border-blue-400/40' },
    { label: 'BACK', view: 'back' as CameraView, transform: 'rotateY(180deg) translateZ(40px)', bg: 'bg-indigo-600/30 hover:bg-indigo-500/70 border-indigo-400/40' },
    { label: 'LEFT', view: 'left' as CameraView, transform: 'rotateY(-90deg) translateZ(40px)', bg: 'bg-red-600/30 hover:bg-red-500/70 border-red-400/40' },
    { label: 'RIGHT', view: 'right' as CameraView, transform: 'rotateY(90deg) translateZ(40px)', bg: 'bg-amber-600/30 hover:bg-amber-500/70 border-amber-400/40' },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-30 flex flex-col items-center gap-2 select-none pointer-events-auto">
      {/* 3D ViewCube Container */}
      <div className="relative w-28 h-28 flex items-center justify-center [perspective:500px]">
        {/* Isometric shortcut corner button */}
        <button
          type="button"
          onClick={() => onSetCameraView('isometric')}
          className="absolute -top-1 -right-1 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-blue-400 border border-blue-500/40 hover:bg-blue-600 hover:text-white shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="Isometric Angle View"
        >
          ISO
        </button>

        {/* 3D Rotating Cube */}
        <div
          ref={cubeRef}
          className="w-20 h-20 relative [transform-style:preserve-3d] transition-transform duration-75"
        >
          {faces.map((face) => (
            <div
              key={face.view}
              onClick={(e) => {
                e.stopPropagation();
                onSetCameraView(face.view);
              }}
              style={{ transform: face.transform }}
              className={`absolute inset-0 flex items-center justify-center border text-[11px] font-bold text-white shadow-inner backdrop-blur-md cursor-pointer transition-colors duration-150 select-none ${face.bg}`}
            >
              {face.label}
            </div>
          ))}
        </div>
      </div>

      {/* Action shortcuts under ViewCube */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl glass-panel border border-slate-700/80 shadow-xl">
        <button
          type="button"
          onClick={onFocusSelected}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:text-white hover:bg-blue-600/80 transition-all flex items-center gap-1.5 cursor-pointer"
          title={hasSelection ? 'Focus on Selected Object (F)' : 'Focus / Frame All Objects (F)'}
        >
          <Focus className="w-3.5 h-3.5" />
          <span className="text-[11px]">{hasSelection ? 'Focus Model' : 'Frame Scene'}</span>
          <kbd className="px-1 py-0.2 text-[9px] bg-slate-900/80 rounded border border-slate-700 font-mono text-slate-400">
            F
          </kbd>
        </button>
      </div>
    </div>
  );
};

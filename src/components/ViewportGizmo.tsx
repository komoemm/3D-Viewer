import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CameraView } from '../types';
import { Focus, ZoomIn, Hand, Grid3X3, Eye } from 'lucide-react';

interface ViewportGizmoProps {
  onSetCameraView: (view: CameraView) => void;
  onFocusSelected: () => void;
  onOrbit: (deltaX: number, deltaY: number) => void;
  onDolly: (deltaY: number) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onToggleOrthographic: () => void;
  isOrthographic: boolean;
  hasSelection: boolean;
  cameraQuaternionRef: React.MutableRefObject<THREE.Quaternion>;
}

interface AxisDef {
  id: string;
  name: string;
  vector: THREE.Vector3;
  color: string;
  hoverColor: string;
  view: CameraView;
  isPositive: boolean;
  label: string;
}

const AXES: AxisDef[] = [
  {
    id: 'pos-x',
    name: '+X',
    vector: new THREE.Vector3(1, 0, 0),
    color: '#ea384c',
    hoverColor: '#ff6476',
    view: 'right',
    isPositive: true,
    label: 'X',
  },
  {
    id: 'neg-x',
    name: '-X',
    vector: new THREE.Vector3(-1, 0, 0),
    color: '#ea384c',
    hoverColor: '#ff6476',
    view: 'left',
    isPositive: false,
    label: '',
  },
  {
    id: 'pos-y',
    name: '+Y',
    vector: new THREE.Vector3(0, 1, 0),
    color: '#4ade80',
    hoverColor: '#86efac',
    view: 'top',
    isPositive: true,
    label: 'Y',
  },
  {
    id: 'neg-y',
    name: '-Y',
    vector: new THREE.Vector3(0, -1, 0),
    color: '#4ade80',
    hoverColor: '#86efac',
    view: 'bottom',
    isPositive: false,
    label: '',
  },
  {
    id: 'pos-z',
    name: '+Z',
    vector: new THREE.Vector3(0, 0, 1),
    color: '#38bdf8',
    hoverColor: '#7dd3fc',
    view: 'front',
    isPositive: true,
    label: 'Z',
  },
  {
    id: 'neg-z',
    name: '-Z',
    vector: new THREE.Vector3(0, 0, -1),
    color: '#38bdf8',
    hoverColor: '#7dd3fc',
    view: 'back',
    isPositive: false,
    label: '',
  },
];

export const ViewportGizmo: React.FC<ViewportGizmoProps> = ({
  onSetCameraView,
  onFocusSelected,
  onOrbit,
  onDolly,
  onPan,
  onToggleOrthographic,
  isOrthographic,
  hasSelection,
  cameraQuaternionRef,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);
  const isDraggingOrbit = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const hasMovedWhileDown = useRef(false);

  // Projected axis positions state
  const [projectedAxes, setProjectedAxes] = useState<
    Array<{
      axis: AxisDef;
      projX: number;
      projY: number;
      depth: number;
    }>
  >([]);

  const center = 56;
  const stalkRadius = 38;
  const trackballRadius = 40;

  // Real-time quaternion to 2D projection loop
  useEffect(() => {
    let animId: number;
    const qInv = new THREE.Quaternion();
    const tempVec = new THREE.Vector3();

    const updateProjection = () => {
      animId = requestAnimationFrame(updateProjection);
      if (!cameraQuaternionRef.current) return;

      qInv.copy(cameraQuaternionRef.current).invert();

      const projected = AXES.map((axis) => {
        tempVec.copy(axis.vector).applyQuaternion(qInv);
        return {
          axis,
          projX: center + tempVec.x * stalkRadius,
          projY: center - tempVec.y * stalkRadius, // Invert Y for screen coordinates
          depth: -tempVec.z, // In camera space -Z is forward
        };
      });

      // Sort by depth ascending (render furthest first)
      projected.sort((a, b) => a.depth - b.depth);
      setProjectedAxes(projected);
    };

    updateProjection();
    return () => cancelAnimationFrame(animId);
  }, [cameraQuaternionRef]);

  // Orbit dragging handlers on Gizmo
  const handleGizmoPointerDown = (e: React.PointerEvent) => {
    isDraggingOrbit.current = true;
    hasMovedWhileDown.current = false;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingOrbit.current) return;
      const deltaX = moveEvent.clientX - lastMousePos.current.x;
      const deltaY = moveEvent.clientY - lastMousePos.current.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        hasMovedWhileDown.current = true;
      }

      onOrbit(deltaX, deltaY);
      lastMousePos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
    };

    const handlePointerUp = () => {
      isDraggingOrbit.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Zoom / Dolly tool drag handler
  const handleDollyPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let prevY = e.clientY;

    const onMove = (moveEvt: PointerEvent) => {
      const deltaY = moveEvt.clientY - prevY;
      prevY = moveEvt.clientY;
      onDolly(deltaY);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'ns-resize';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Pan tool drag handler
  const handlePanPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let prevX = e.clientX;
    let prevY = e.clientY;

    const onMove = (moveEvt: PointerEvent) => {
      const deltaX = moveEvt.clientX - prevX;
      const deltaY = moveEvt.clientY - prevY;
      prevX = moveEvt.clientX;
      prevY = moveEvt.clientY;
      onPan(deltaX, deltaY);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'grabbing';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="fixed top-14 right-4 z-30 flex flex-col items-center gap-2 select-none pointer-events-auto">
      {/* 1. Blender-Style 3D Axis Orientation Gizmo */}
      <div
        className="relative w-28 h-28 flex items-center justify-center cursor-grab active:cursor-grabbing rounded-full bg-[#1c1c1c]/80 backdrop-blur-md border border-[#333333] shadow-2xl p-1 group"
        onPointerDown={handleGizmoPointerDown}
        title="Click axis to align view • Drag to orbit scene"
      >
        <svg
          ref={svgRef}
          width="112"
          height="112"
          viewBox="0 0 112 112"
          className="overflow-visible select-none"
        >
          <defs>
            {/* Ambient trackball gradient */}
            <radialGradient id="trackballGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#444444" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#222222" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#181818" stopOpacity="0.85" />
            </radialGradient>
          </defs>

          {/* Center Trackball Base Disk */}
          <circle
            cx={center}
            cy={center}
            r={trackballRadius}
            fill="url(#trackballGrad)"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1.2"
            className="transition-colors group-hover:stroke-white/20"
          />

          {/* Render All 6 Axes (Sorted by depth from back to front) */}
          {projectedAxes.map(({ axis, projX, projY, depth }) => {
            const isHovered = hoveredAxis === axis.id;
            const bubbleRadius = axis.isPositive ? 10 : 5.5;

            return (
              <g key={axis.id}>
                {/* Axis Connecting Stalk Line */}
                {axis.isPositive ? (
                  <line
                    x1={center}
                    y1={center}
                    x2={projX}
                    y2={projY}
                    stroke={isHovered ? axis.hoverColor : axis.color}
                    strokeWidth={isHovered ? 2.5 : 2}
                    strokeLinecap="round"
                    opacity={depth < -0.1 ? 0.45 : 0.95}
                  />
                ) : (
                  <line
                    x1={center}
                    y1={center}
                    x2={projX}
                    y2={projY}
                    stroke={axis.color}
                    strokeWidth={1.2}
                    strokeDasharray="2 2"
                    opacity={0.3}
                  />
                )}

                {/* Interactive Axis Bubble Tip */}
                <g
                  className="cursor-pointer transition-transform"
                  onPointerEnter={() => setHoveredAxis(axis.id)}
                  onPointerLeave={() => setHoveredAxis(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!hasMovedWhileDown.current) {
                      onSetCameraView(axis.view);
                    }
                  }}
                >
                  {axis.isPositive ? (
                    <>
                      {/* Positive Axis Solid Bubble */}
                      <circle
                        cx={projX}
                        cy={projY}
                        r={isHovered ? bubbleRadius + 1.5 : bubbleRadius}
                        fill={isHovered ? axis.hoverColor : axis.color}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 1.5 : 0.75}
                        className="transition-all duration-100 shadow-md"
                      />
                      <text
                        x={projX}
                        y={projY + 3.5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10px"
                        fontWeight="bold"
                        fontFamily="ui-monospace, monospace, sans-serif"
                        pointerEvents="none"
                      >
                        {axis.label}
                      </text>
                    </>
                  ) : (
                    /* Negative Axis Muted Ring Bubble */
                    <circle
                      cx={projX}
                      cy={projY}
                      r={isHovered ? bubbleRadius + 1 : bubbleRadius}
                      fill={isHovered ? axis.hoverColor : '#2a2a2a'}
                      stroke={axis.color}
                      strokeWidth={1.5}
                      opacity={isHovered ? 1 : 0.7}
                      className="transition-all duration-100"
                    />
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 2. Blender Viewport Navigation Tool Strip */}
      <div className="flex flex-col items-center gap-1.5 p-1 rounded-xl bg-[#202020]/90 border border-[#383838] shadow-xl backdrop-blur-md">
        {/* Zoom / Dolly View */}
        <button
          type="button"
          onPointerDown={handleDollyPointerDown}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2b2b2b] hover:bg-[#3a3a3a] text-[#cfcfcf] hover:text-white border border-[#3a3a3a] shadow transition-all active:scale-95 cursor-ns-resize"
          title="Zoom View (Click & Drag Up/Down)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Pan / Move View */}
        <button
          type="button"
          onPointerDown={handlePanPointerDown}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2b2b2b] hover:bg-[#3a3a3a] text-[#cfcfcf] hover:text-white border border-[#3a3a3a] shadow transition-all active:scale-95 cursor-grab active:cursor-grabbing"
          title="Move View / Pan (Click & Drag)"
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Perspective / Orthographic Toggle */}
        <button
          type="button"
          onClick={onToggleOrthographic}
          className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow transition-all active:scale-95 cursor-pointer ${
            isOrthographic
              ? 'bg-[#ea7600] text-white border-[#ffaa44] shadow-[#ea7600]/40'
              : 'bg-[#2b2b2b] hover:bg-[#3a3a3a] text-[#cfcfcf] hover:text-white border-[#3a3a3a]'
          }`}
          title={
            isOrthographic
              ? 'Orthographic View Active • Click for Perspective View (Num 5)'
              : 'Perspective View Active • Click for Orthographic View (Num 5)'
          }
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        {/* Frame / Focus Selected (F) */}
        <button
          type="button"
          onClick={onFocusSelected}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2b2b2b] hover:bg-[#ea7600] text-[#cfcfcf] hover:text-white border border-[#3a3a3a] shadow transition-all active:scale-95 cursor-pointer"
          title={hasSelection ? 'Frame Selected Object (F)' : 'Frame Scene (F)'}
        >
          <Focus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

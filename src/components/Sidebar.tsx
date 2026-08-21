import React, { useState } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Sun,
  Eye,
  EyeOff,
  Film,
  Info,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
  Focus,
  Check,
  Play,
  Pause,
  Square,
  Sparkles,
  Palette,
  Box,
} from 'lucide-react';
import {
  LoadedModel,
  TransformValues,
  LightingPreset,
  RenderMode,
  GizmoMode,
} from '../types';

interface SidebarProps {
  models: LoadedModel[];
  selectedModelId: string | null;
  transformValues: TransformValues;
  lightingPreset: LightingPreset;
  lightIntensity: number;
  bgColor: string;
  renderMode: RenderMode;
  showGrid: boolean;
  autoRotate: boolean;
  rotateSpeed: number;
  showBBox: boolean;
  animations: THREE.AnimationClip[];
  activeAnimIndex: number;
  isAnimPlaying: boolean;
  animSpeed: number;
  onSelectModel: (id: string) => void;
  onToggleModelVisibility: (id: string) => void;
  onDeleteModel: (id: string) => void;
  onClearAllModels: () => void;
  onUpdateTransform: (values: Partial<TransformValues>) => void;
  onResetTransform: () => void;
  onFocusModel: (id?: string) => void;
  onSetLightingPreset: (preset: LightingPreset) => void;
  onSetLightIntensity: (intensity: number) => void;
  onSetBgColor: (color: string) => void;
  onSetRenderMode: (mode: RenderMode) => void;
  onToggleGrid: (show: boolean) => void;
  onToggleAutoRotate: (rotate: boolean) => void;
  onSetRotateSpeed: (speed: number) => void;
  onToggleBBox: (show: boolean) => void;
  onSelectAnimTrack: (index: number) => void;
  onTogglePlayAnim: () => void;
  onStopAnim: () => void;
  onSetAnimSpeed: (speed: number) => void;
  onSetGizmoMode: (mode: GizmoMode) => void;
}

type TabType = 'models' | 'lighting' | 'display' | 'anim' | 'info';

export const Sidebar: React.FC<SidebarProps> = ({
  models,
  selectedModelId,
  transformValues,
  lightingPreset,
  lightIntensity,
  bgColor,
  renderMode,
  showGrid,
  autoRotate,
  rotateSpeed,
  showBBox,
  animations,
  activeAnimIndex,
  isAnimPlaying,
  animSpeed,
  onSelectModel,
  onToggleModelVisibility,
  onDeleteModel,
  onClearAllModels,
  onUpdateTransform,
  onResetTransform,
  onFocusModel,
  onSetLightingPreset,
  onSetLightIntensity,
  onSetBgColor,
  onSetRenderMode,
  onToggleGrid,
  onToggleAutoRotate,
  onSetRotateSpeed,
  onToggleBBox,
  onSelectAnimTrack,
  onTogglePlayAnim,
  onStopAnim,
  onSetAnimSpeed,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('models');

  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Aggregated stats
  const totalTriangles = models.reduce((sum, m) => sum + m.stats.triangles, 0);
  const totalVertices = models.reduce((sum, m) => sum + m.stats.vertices, 0);
  const totalMeshes = models.reduce((sum, m) => sum + m.stats.meshes, 0);
  const totalMaterials = models.reduce((sum, m) => sum + m.stats.materials, 0);

  // Combined bounds size
  let boundsX = 0,
    boundsY = 0,
    boundsZ = 0;
  if (models.length > 0) {
    boundsX = selectedModel?.stats.size.x ?? 0;
    boundsY = selectedModel?.stats.size.y ?? 0;
    boundsZ = selectedModel?.stats.size.z ?? 0;
  }

  return (
    <aside className="absolute top-20 left-4 sm:left-6 bottom-6 w-80 max-w-[calc(100vw-2rem)] glass-panel rounded-2xl z-30 flex flex-col overflow-hidden shadow-2xl border border-slate-800/80">
      {/* Top Tab Bar */}
      <div className="flex border-b border-slate-800/80 p-1 bg-slate-900/60 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('models')}
          className={`flex-1 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'models'
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Scene Models & Transforms"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Models</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lighting')}
          className={`flex-1 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'lighting'
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Lighting & Environment"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Lighting</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('display')}
          className={`flex-1 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'display'
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Display & Materials"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Display</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('anim')}
          className={`flex-1 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'anim'
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Animation Player"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Anim</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'info'
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Scene Stats & Info"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Info</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: MODELS OUTLINER & TRANSFORM INSPECTOR */}
        {activeTab === 'models' && (
          <div className="space-y-4">
            {/* Outliner Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-blue-400" />
                <span>Scene Outliner ({models.length})</span>
              </span>
              {models.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAllModels}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Model List */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {models.length === 0 ? (
                <div className="text-center py-6 text-slate-500 space-y-1">
                  <Box className="w-6 h-6 mx-auto opacity-40" />
                  <p>No models in scene</p>
                  <p className="text-[10px] text-slate-600">Open a 3D file or load Demo Object</p>
                </div>
              ) : (
                models.map((model) => {
                  const isSelected = model.id === selectedModelId;
                  return (
                    <div
                      key={model.id}
                      onClick={() => onSelectModel(model.id)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate mr-2 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleModelVisibility(model.id);
                          }}
                          className="text-slate-400 hover:text-white p-0.5 rounded transition"
                          title={model.visible ? 'Hide Model' : 'Show Model'}
                        >
                          {model.visible ? (
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>
                        <span className="font-medium truncate text-xs">{model.name}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteModel(model.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                        title="Delete Model"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* TRANSFORM INSPECTOR PANEL */}
            {selectedModel ? (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                {/* Header with Quick Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    <span className="text-slate-200 font-semibold text-[11px] truncate max-w-[130px]" title={selectedModel.name}>
                      {selectedModel.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onFocusModel(selectedModel.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px] font-medium flex items-center gap-1 transition"
                      title="Focus camera on this model"
                    >
                      <Focus className="w-3 h-3" />
                      <span>Focus</span>
                    </button>
                    <button
                      type="button"
                      onClick={onResetTransform}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition"
                      title="Reset Position, Rotation, Scale"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* 1. POSITION (X, Y, Z) */}
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold text-[11px]">Position (Move)</span>
                    <span className="text-[10px] text-slate-500 font-mono">XYZ (units)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-rose-500">
                      <span className="text-rose-400 font-bold mr-1.5 text-[10px]">X</span>
                      <input
                        type="number"
                        step="0.1"
                        value={Number(transformValues.posX.toFixed(2))}
                        onChange={(e) =>
                          onUpdateTransform({ posX: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-emerald-500">
                      <span className="text-emerald-400 font-bold mr-1.5 text-[10px]">Y</span>
                      <input
                        type="number"
                        step="0.1"
                        value={Number(transformValues.posY.toFixed(2))}
                        onChange={(e) =>
                          onUpdateTransform({ posY: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-blue-500">
                      <span className="text-blue-400 font-bold mr-1.5 text-[10px]">Z</span>
                      <input
                        type="number"
                        step="0.1"
                        value={Number(transformValues.posZ.toFixed(2))}
                        onChange={(e) =>
                          onUpdateTransform({ posZ: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. ROTATION (X, Y, Z in Degrees) */}
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold text-[11px]">Rotation</span>
                    <span className="text-[10px] text-slate-500 font-mono">Degrees (°)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-rose-500">
                      <span className="text-rose-400 font-bold mr-1 text-[10px]">X°</span>
                      <input
                        type="number"
                        step="5"
                        value={Math.round(transformValues.rotX)}
                        onChange={(e) =>
                          onUpdateTransform({ rotX: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-emerald-500">
                      <span className="text-emerald-400 font-bold mr-1 text-[10px]">Y°</span>
                      <input
                        type="number"
                        step="5"
                        value={Math.round(transformValues.rotY)}
                        onChange={(e) =>
                          onUpdateTransform({ rotY: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-blue-500">
                      <span className="text-blue-400 font-bold mr-1 text-[10px]">Z°</span>
                      <input
                        type="number"
                        step="5"
                        value={Math.round(transformValues.rotZ)}
                        onChange={(e) =>
                          onUpdateTransform({ rotZ: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. SCALE (X, Y, Z & UNIFORM LOCK) */}
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold text-[11px]">Scale</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTransform({ uniformScale: !transformValues.uniformScale })
                      }
                      className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition ${
                        transformValues.uniformScale
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                      title="Lock Uniform Proportional Scaling"
                    >
                      {transformValues.uniformScale ? (
                        <Lock className="w-2.5 h-2.5" />
                      ) : (
                        <Unlock className="w-2.5 h-2.5" />
                      )}
                      <span>Uniform</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-rose-500">
                      <span className="text-rose-400 font-bold mr-1 text-[10px]">X</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        value={Number(transformValues.scaleX.toFixed(2))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0.1;
                          if (transformValues.uniformScale) {
                            onUpdateTransform({ scaleX: val, scaleY: val, scaleZ: val });
                          } else {
                            onUpdateTransform({ scaleX: val });
                          }
                        }}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-emerald-500">
                      <span className="text-emerald-400 font-bold mr-1 text-[10px]">Y</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        value={Number(transformValues.scaleY.toFixed(2))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0.1;
                          if (transformValues.uniformScale) {
                            onUpdateTransform({ scaleX: val, scaleY: val, scaleZ: val });
                          } else {
                            onUpdateTransform({ scaleY: val });
                          }
                        }}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 focus-within:border-blue-500">
                      <span className="text-blue-400 font-bold mr-1 text-[10px]">Z</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        value={Number(transformValues.scaleZ.toFixed(2))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0.1;
                          if (transformValues.uniformScale) {
                            onUpdateTransform({ scaleX: val, scaleY: val, scaleZ: val });
                          } else {
                            onUpdateTransform({ scaleZ: val });
                          }
                        }}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 border-t border-slate-800 text-[11px]">
                Click a model in the viewport or outliner to transform
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIGHTING */}
        {activeTab === 'lighting' && (
          <div className="space-y-4">
            <div>
              <span className="text-slate-400 font-semibold block mb-2">Lighting Presets</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'studio', label: 'Studio', color: 'text-amber-400' },
                  { id: 'sunset', label: 'Sunset', color: 'text-orange-400' },
                  { id: 'night', label: 'Night', color: 'text-indigo-400' },
                  { id: 'outdoor', label: 'Outdoor', color: 'text-emerald-400' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSetLightingPreset(preset.id as LightingPreset)}
                    className={`p-2.5 rounded-xl text-left flex items-center gap-2 border transition-all ${
                      lightingPreset === preset.id
                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-sm'
                        : 'glass-button text-slate-300 hover:text-white'
                    }`}
                  >
                    <Sun className={`w-4 h-4 ${preset.color}`} />
                    <span className="font-medium text-xs">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Light Intensity</span>
                <span className="font-mono text-blue-400">{lightIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4"
                step="0.1"
                value={lightIntensity}
                onChange={(e) => onSetLightIntensity(parseFloat(e.target.value))}
                className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Background Color</span>
              <div className="flex items-center gap-2">
                {[
                  { hex: '#090d16', name: 'Dark Blue' },
                  { hex: '#000000', name: 'Pitch Black' },
                  { hex: '#1e293b', name: 'Slate Gray' },
                  { hex: '#e2e8f0', name: 'Light Gray' },
                ].map((bg) => (
                  <button
                    key={bg.hex}
                    type="button"
                    onClick={() => onSetBgColor(bg.hex)}
                    style={{ backgroundColor: bg.hex }}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      bgColor.toLowerCase() === bg.hex.toLowerCase()
                        ? 'border-blue-500 scale-110 shadow-md'
                        : 'border-slate-700'
                    }`}
                    title={bg.name}
                  />
                ))}
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => onSetBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  title="Custom Color"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DISPLAY & MATERIALS */}
        {activeTab === 'display' && (
          <div className="space-y-4">
            <div>
              <span className="text-slate-400 font-semibold block mb-2">Material / Render Mode</span>
              <div className="space-y-1.5">
                {[
                  { id: 'default', label: 'Standard Material', desc: 'Original textures & shaders' },
                  { id: 'wireframe', label: 'Wireframe Mode', desc: 'Polygon topology mesh' },
                  { id: 'normals', label: 'Surface Normals', desc: 'Surface orientation RGB' },
                  { id: 'xray', label: 'X-Ray / Transparent', desc: 'Ghosted semi-transparent' },
                ].map((mode) => {
                  const isActive = renderMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onSetRenderMode(mode.id as RenderMode)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition-all ${
                        isActive
                          ? 'bg-blue-600/30 border-blue-500 text-white'
                          : 'glass-button text-slate-300 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-white">{mode.label}</div>
                        <div className="text-[10px] text-slate-400">{mode.desc}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-800">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-slate-300 font-medium">Show Floor Grid</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => onToggleGrid(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-slate-300 font-medium">Auto-Rotate Scene</span>
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => onToggleAutoRotate(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-slate-300 font-medium">Bounding Box Overlay</span>
                <input
                  type="checkbox"
                  checked={showBBox}
                  onChange={(e) => onToggleBBox(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {autoRotate && (
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>Rotation Speed</span>
                  <span className="font-mono text-blue-400">{rotateSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="5"
                  step="0.2"
                  value={rotateSpeed}
                  onChange={(e) => onSetRotateSpeed(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANIMATION PLAYER */}
        {activeTab === 'anim' && (
          <div className="space-y-4">
            {animations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-1">
                <Film className="w-8 h-8 mx-auto opacity-30" />
                <p className="font-medium">No embedded animations</p>
                <p className="text-[11px]">Load a rigged GLB/FBX file with animations</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 font-semibold mb-1.5 block">
                    Animation Clip ({animations.length})
                  </label>
                  <select
                    value={activeAnimIndex}
                    onChange={(e) => onSelectAnimTrack(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                  >
                    {animations.map((anim, idx) => (
                      <option key={idx} value={idx}>
                        {anim.name || `Animation ${idx + 1}`} ({anim.duration.toFixed(1)}s)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={onTogglePlayAnim}
                    className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition active:scale-95"
                    title={isAnimPlaying ? 'Pause' : 'Play'}
                  >
                    {isAnimPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={onStopAnim}
                    className="w-11 h-11 rounded-full glass-button text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95"
                    title="Stop / Reset"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span>Playback Speed</span>
                    <span className="font-mono text-blue-400">{animSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.1"
                    value={animSpeed}
                    onChange={(e) => onSetAnimSpeed(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SCENE STATS & INFO */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            <div className="glass-panel p-3.5 rounded-xl space-y-2 border border-slate-800">
              <span className="text-slate-300 font-bold block mb-1">Scene Statistics</span>
              <div className="flex justify-between items-center text-slate-400">
                <span>Total Models:</span>
                <span className="text-white font-bold">{models.length}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Triangles:</span>
                <span className="text-blue-400 font-bold">{totalTriangles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Vertices:</span>
                <span className="text-indigo-400 font-bold">{totalVertices.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Meshes:</span>
                <span className="text-emerald-400 font-bold">{totalMeshes}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Materials:</span>
                <span className="text-amber-400 font-bold">{totalMaterials}</span>
              </div>
            </div>

            {selectedModel && (
              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold block">Selected Dimensions (Bounds)</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-semibold">WIDTH (X)</span>
                    <span className="font-mono text-slate-200 text-xs">{boundsX.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-semibold">HEIGHT (Y)</span>
                    <span className="font-mono text-slate-200 text-xs">{boundsY.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-semibold">DEPTH (Z)</span>
                    <span className="font-mono text-slate-200 text-xs">{boundsZ.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

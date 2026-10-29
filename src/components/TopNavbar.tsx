import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import {
  Box,
  Upload,
  Sparkles,
  Camera,
  Layers,
  Sun,
  Palette,
  Film,
  Activity,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
  Focus,
  Play,
  Pause,
  Square,
  Keyboard,
  Maximize,
  Minimize,
  Grid,
  Compass,
  ArrowRightLeft,
  Wrench,
  MoreHorizontal,
  X,
} from 'lucide-react';
import {
  LoadedModel,
  TransformValues,
  LightingPreset,
  RenderMode,
  GizmoMode,
} from '../types';

interface TopNavbarProps {
  models: LoadedModel[];
  selectedModelId: string | null;
  transformValues: TransformValues;
  lightingPreset: LightingPreset;
  lightIntensity: number;
  bgColor: string;
  renderMode: RenderMode;
  showGrid: boolean;
  showAxes: boolean;
  pointSize: number;
  autoRotate: boolean;
  rotateSpeed: number;
  showBBox: boolean;
  animations: THREE.AnimationClip[];
  activeAnimIndex: number;
  isAnimPlaying: boolean;
  animSpeed: number;
  fps: number;
  onFilesSelected: (files: FileList | File[]) => void;
  onGenerateDemo: () => void;
  onTakeScreenshot: () => void;
  onToggleShortcuts: () => void;
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
  onToggleAxes: (show: boolean) => void;
  onSetPointSize: (size: number) => void;
  onToggleAutoRotate: (rotate: boolean) => void;
  onSetRotateSpeed: (speed: number) => void;
  onToggleBBox: (show: boolean) => void;
  onSelectAnimTrack: (index: number) => void;
  onTogglePlayAnim: () => void;
  onStopAnim: () => void;
  onSetAnimSpeed: (speed: number) => void;
  onOpenConverter: () => void;
}

type OpenDropdown = 'models' | 'lighting' | 'display' | 'animation' | 'tools' | null;

export const TopNavbar: React.FC<TopNavbarProps> = ({
  models,
  selectedModelId,
  transformValues,
  lightingPreset,
  lightIntensity,
  bgColor,
  renderMode,
  showGrid,
  showAxes,
  pointSize,
  autoRotate,
  rotateSpeed,
  showBBox,
  animations,
  activeAnimIndex,
  isAnimPlaying,
  animSpeed,
  fps,
  onFilesSelected,
  onGenerateDemo,
  onTakeScreenshot,
  onToggleShortcuts,
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
  onToggleAxes,
  onSetPointSize,
  onToggleAutoRotate,
  onSetRotateSpeed,
  onToggleBBox,
  onSelectAnimTrack,
  onTogglePlayAnim,
  onStopAnim,
  onSetAnimSpeed,
  onOpenConverter,
}) => {
  const [openMenu, setOpenMenu] = useState<OpenDropdown>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = '';
      setOpenMenu(null);
    }
  };

  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Global scene stats totals
  const totalStats = models.reduce(
    (acc, m) => ({
      triangles: acc.triangles + m.stats.triangles,
      vertices: acc.vertices + m.stats.vertices,
      meshes: acc.meshes + m.stats.meshes,
    }),
    { triangles: 0, vertices: 0, meshes: 0 }
  );

  const toggleDropdown = (menu: OpenDropdown) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  return (
    <header
      ref={menuContainerRef}
      role="banner"
      className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 py-2 bg-[#242424]/95 border-b border-[#383838] backdrop-blur-xl select-none text-[#e0e0e0]"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        aria-label="Upload 3D model files or Three.js scripts"
        accept=".glb,.gltf,.fbx,.ply,.spz,.obj,.stl,.ifc,.ts,.js,text/javascript,application/typescript"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left Area: Brand & Dropdown Popovers */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-[#383838]">
          <div className="w-7 h-7 rounded-lg bg-[#ea7600] flex items-center justify-center shadow-md shadow-[#ea7600]/30 border border-white/20 shrink-0" aria-hidden="true">
            <Box className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold text-xs sm:text-sm tracking-wide text-white hidden md:inline" aria-label="3D Viewer">
            3D Viewer
          </h1>
        </div>

        {/* 1. Models / Outliner Dropdown */}
        <div className="relative">
          <button
            type="button"
            role="button"
            onClick={() => toggleDropdown('models')}
            aria-label={`Scene models outliner, ${models.length} model${models.length === 1 ? '' : 's'} in scene`}
            aria-haspopup="true"
            aria-expanded={openMenu === 'models'}
            title="Scene Models Outliner"
            className={`glass-button px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#242424] ${
              openMenu === 'models' ? 'glass-button-active' : 'text-slate-200 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
            <span>Models</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-mono font-bold" aria-hidden="true">
              {models.length}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-300" aria-hidden="true" />
          </button>

          {openMenu === 'models' && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl backdrop-blur-md bg-neutral-900/95 p-3 border border-neutral-700/60 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto" role="region" aria-label="Scene Outliner Panel">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                  <span>Scene Outliner</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {models.length > 0 && (
                    <button
                      type="button"
                      role="button"
                      onClick={onClearAllModels}
                      aria-label="Clear all models from scene"
                      title="Clear all models from scene"
                      className="text-[11px] text-red-300 hover:text-red-200 font-medium px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Clear Scene
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenMenu(null)}
                    aria-label="Close outliner"
                    title="Close"
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-neutral-800 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {models.length === 0 ? (
                <div className="py-6 text-center text-slate-300 text-xs space-y-2">
                  <p>No 3D models in scene. Drop files or import models.</p>
                  <div className="flex items-center justify-center pt-1">
                    <button
                      type="button"
                      role="button"
                      onClick={() => {
                        setOpenMenu(null);
                        fileInputRef.current?.click();
                      }}
                      aria-label="Open 3D files from local computer"
                      title="Open 3D files (.glb, .gltf, .obj, .fbx, .stl, .ply, .spz, .ifc, .ts, .js)"
                      className="px-3 py-1.5 rounded-lg bg-[#ea7600] text-white text-xs font-semibold hover:bg-[#d96d00] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 flex items-center gap-1.5 shadow-md shadow-[#ea7600]/25"
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Open Files</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1" role="list" aria-label="Loaded 3D models">
                  {models.map((model) => {
                    const isSelected = model.id === selectedModelId;
                    return (
                      <div
                        key={model.id}
                        role="listitem"
                        onClick={() => onSelectModel(model.id)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition border ${
                          isSelected
                            ? 'bg-blue-600/25 border-blue-500/70 text-white font-medium'
                            : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <Box className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} aria-hidden="true" />
                          <span className="truncate">{model.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            role="button"
                            onClick={() => onFocusModel(model.id)}
                            aria-label={`Focus camera on model ${model.name}`}
                            title={`Focus camera on ${model.name}`}
                            className="p-1 text-slate-300 hover:text-blue-400 rounded hover:bg-slate-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          >
                            <Focus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            role="button"
                            onClick={() => onToggleModelVisibility(model.id)}
                            aria-label={`${model.visible ? 'Hide' : 'Show'} model ${model.name}`}
                            title={`${model.visible ? 'Hide' : 'Show'} ${model.name}`}
                            className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          >
                            {model.visible ? <Eye className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
                          </button>
                          <button
                            type="button"
                            role="button"
                            onClick={() => onDeleteModel(model.id)}
                            aria-label={`Delete model ${model.name} from scene`}
                            title={`Delete ${model.name}`}
                            className="p-1 text-slate-300 hover:text-red-400 rounded hover:bg-slate-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected Model Numerical Transform Inspector */}
              {selectedModel && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5" role="group" aria-label={`Transform properties for ${selectedModel.name}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200">Transforms: {selectedModel.name}</span>
                    <button
                      type="button"
                      role="button"
                      onClick={onResetTransform}
                      aria-label={`Reset transforms for model ${selectedModel.name}`}
                      title="Reset position, rotation, and scale to default"
                      className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-1"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-300" aria-hidden="true" /> Reset
                    </button>
                  </div>

                  {/* Position */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-300">Position (X, Y, Z)</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['posX', 'posY', 'posZ'] as const).map((axis) => (
                        <div key={axis} className="flex items-center bg-slate-950/80 rounded-lg px-2 py-1 border border-slate-800">
                          <label htmlFor={`input-${axis}`} className="text-[10px] font-bold text-slate-300 mr-1 uppercase">{axis.replace('pos', '')}</label>
                          <input
                            id={`input-${axis}`}
                            type="number"
                            step="0.1"
                            aria-label={`Position ${axis.replace('pos', '').toUpperCase()}`}
                            value={Number(transformValues[axis].toFixed(2))}
                            onChange={(e) => onUpdateTransform({ [axis]: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-transparent text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-300">Rotation (Deg)</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['rotX', 'rotY', 'rotZ'] as const).map((axis) => (
                        <div key={axis} className="flex items-center bg-slate-950/80 rounded-lg px-2 py-1 border border-slate-800">
                          <label htmlFor={`input-${axis}`} className="text-[10px] font-bold text-slate-300 mr-1 uppercase">{axis.replace('rot', '')}°</label>
                          <input
                            id={`input-${axis}`}
                            type="number"
                            step="5"
                            aria-label={`Rotation ${axis.replace('rot', '').toUpperCase()} degrees`}
                            value={Math.round(transformValues[axis])}
                            onChange={(e) => onUpdateTransform({ [axis]: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-transparent text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scale */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-300">Scale</span>
                      <button
                        type="button"
                        role="button"
                        onClick={() => onUpdateTransform({ uniformScale: !transformValues.uniformScale })}
                        aria-label={`Toggle scale locking: currently ${transformValues.uniformScale ? 'Uniform' : 'Free'}`}
                        title={`Toggle scale mode: ${transformValues.uniformScale ? 'Uniform' : 'Free'}`}
                        className="text-[10px] text-blue-300 hover:text-blue-200 flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-1"
                      >
                        {transformValues.uniformScale ? <Lock className="w-2.5 h-2.5 text-blue-300" aria-hidden="true" /> : <Unlock className="w-2.5 h-2.5 text-slate-300" aria-hidden="true" />}
                        {transformValues.uniformScale ? 'Uniform' : 'Free'}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['scaleX', 'scaleY', 'scaleZ'] as const).map((axis) => (
                        <div key={axis} className="flex items-center bg-slate-950/80 rounded-lg px-2 py-1 border border-slate-800">
                          <label htmlFor={`input-${axis}`} className="text-[10px] font-bold text-slate-300 mr-1 uppercase">{axis.replace('scale', '')}</label>
                          <input
                            id={`input-${axis}`}
                            type="number"
                            step="0.1"
                            min="0.01"
                            aria-label={`Scale ${axis.replace('scale', '').toUpperCase()}`}
                            value={Number(transformValues[axis].toFixed(2))}
                            onChange={(e) => {
                              const val = Math.max(0.01, parseFloat(e.target.value) || 1);
                              if (transformValues.uniformScale) {
                                onUpdateTransform({ scaleX: val, scaleY: val, scaleZ: val });
                              } else {
                                onUpdateTransform({ [axis]: val });
                              }
                            }}
                            className="w-full bg-transparent text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Lighting Dropdown */}
        <div className="relative">
          <button
            type="button"
            role="button"
            onClick={() => toggleDropdown('lighting')}
            aria-label="Environment lighting presets and intensity"
            aria-haspopup="true"
            aria-expanded={openMenu === 'lighting'}
            title="Environment Lighting"
            className={`glass-button px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#242424] ${
              openMenu === 'lighting' ? 'glass-button-active' : 'text-slate-200 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="hidden sm:inline">Lighting</span>
            <ChevronDown className="w-3 h-3 text-slate-300" aria-hidden="true" />
          </button>

          {openMenu === 'lighting' && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl backdrop-blur-md bg-neutral-900/95 p-3 border border-neutral-700/60 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3" role="region" aria-label="Environment Lighting Panel">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Environment Lighting</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  aria-label="Close lighting menu"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-neutral-800 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-300 uppercase">Presets</span>
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Lighting Presets">
                  {[
                    { id: 'studio', label: 'Studio' },
                    { id: 'sunset', label: 'Sunset' },
                    { id: 'night', label: 'Night / Blue' },
                    { id: 'outdoor', label: 'Outdoor' },
                    { id: 'neon', label: 'Neon / Cyber' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      role="button"
                      onClick={() => onSetLightingPreset(preset.id as LightingPreset)}
                      aria-label={`Set lighting preset to ${preset.label}`}
                      aria-pressed={lightingPreset === preset.id}
                      title={`Lighting preset: ${preset.label}`}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        lightingPreset === preset.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px]">
                  <label htmlFor="light-intensity-slider" className="text-slate-300">Light Intensity</label>
                  <span className="font-mono text-amber-300 font-bold">{lightIntensity.toFixed(1)}x</span>
                </div>
                <input
                  id="light-intensity-slider"
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.1"
                  aria-label="Light Intensity"
                  value={lightIntensity}
                  onChange={(e) => onSetLightIntensity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Display & Shading Dropdown */}
        <div className="relative">
          <button
            type="button"
            role="button"
            onClick={() => toggleDropdown('display')}
            aria-label="Viewport shading modes and scene helpers"
            aria-haspopup="true"
            aria-expanded={openMenu === 'display'}
            title="Viewport Shading & Helpers"
            className={`glass-button px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#242424] ${
              openMenu === 'display' ? 'glass-button-active' : 'text-slate-200 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span className="hidden sm:inline">Display</span>
            <ChevronDown className="w-3 h-3 text-slate-300" aria-hidden="true" />
          </button>

          {openMenu === 'display' && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl backdrop-blur-md bg-neutral-900/95 p-3 border border-neutral-700/60 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3" role="region" aria-label="Viewport Shading Panel">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                  <span>Viewport Shading & Helpers</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  aria-label="Close display menu"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-neutral-800 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Shading Modes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-300 uppercase">Render Shading</span>
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Render Shading Modes">
                  {[
                    { id: 'default', label: 'Material' },
                    { id: 'wireframe', label: 'Wireframe' },
                    { id: 'normals', label: 'Normals' },
                    { id: 'xray', label: 'X-Ray' },
                    { id: 'points', label: 'Point Cloud' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      role="button"
                      onClick={() => onSetRenderMode(mode.id as RenderMode)}
                      aria-label={`Set render shading mode to ${mode.label}`}
                      aria-pressed={renderMode === mode.id}
                      title={`Render Shading: ${mode.label}`}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition border text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        renderMode === mode.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Helpers Toggles */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                <span className="text-[10px] font-semibold text-slate-300 uppercase">Scene Helpers</span>
                <div className="space-y-1">
                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer p-1 rounded hover:bg-slate-800/60">
                    <span className="flex items-center gap-2">
                      <Grid className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> Ground Grid
                    </span>
                    <input
                      type="checkbox"
                      aria-label="Toggle Ground Grid"
                      checked={showGrid}
                      onChange={(e) => onToggleGrid(e.target.checked)}
                      className="accent-blue-500 rounded focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer p-1 rounded hover:bg-slate-800/60">
                    <span className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> XYZ Axes Helper
                    </span>
                    <input
                      type="checkbox"
                      aria-label="Toggle XYZ Axes Helper"
                      checked={showAxes}
                      onChange={(e) => onToggleAxes(e.target.checked)}
                      className="accent-blue-500 rounded focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer p-1 rounded hover:bg-slate-800/60">
                    <span className="flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" /> Selection Bounds
                    </span>
                    <input
                      type="checkbox"
                      aria-label="Toggle Selection Bounding Box"
                      checked={showBBox}
                      onChange={(e) => onToggleBBox(e.target.checked)}
                      className="accent-blue-500 rounded focus:ring-2 focus:ring-blue-400"
                    />
                  </label>
                </div>
              </div>

              {/* Point Cloud Size (for PLY/SPZ) */}
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="flex justify-between text-[11px]">
                  <label htmlFor="point-size-slider" className="text-slate-300">Point Cloud Size</label>
                  <span className="font-mono text-cyan-300 font-bold">{pointSize.toFixed(2)}</span>
                </div>
                <input
                  id="point-size-slider"
                  type="range"
                  min="0.01"
                  max="0.25"
                  step="0.01"
                  aria-label="Point Cloud Size"
                  value={pointSize}
                  onChange={(e) => onSetPointSize(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>

              {/* Background Color Palette */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                <span className="text-[10px] font-semibold text-slate-300 uppercase">Background Color</span>
                <div className="flex items-center gap-2" role="group" aria-label="Background Color Swatches">
                  {[
                    { hex: '#f5f5f3', label: 'Light Studio (#f5f5f3)' },
                    { hex: '#ffffff', label: 'Pure White (#ffffff)' },
                    { hex: '#e5e7eb', label: 'Warm Light Gray (#e5e7eb)' },
                    { hex: '#303030', label: 'Blender Neutral (#303030)' },
                    { hex: '#242424', label: 'Deep Charcoal (#242424)' },
                    { hex: '#000000', label: 'Pure Black (#000000)' },
                  ].map(({ hex, label }) => (
                    <button
                      key={hex}
                      type="button"
                      role="button"
                      onClick={() => onSetBgColor(hex)}
                      style={{ backgroundColor: hex }}
                      aria-label={`Set background color to ${label}`}
                      title={label}
                      className={`w-6 h-6 rounded-md border-2 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        bgColor === hex ? 'border-[#ea7600] scale-110' : 'border-slate-600'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label="Custom background color picker"
                    value={bgColor}
                    onChange={(e) => onSetBgColor(e.target.value)}
                    className="w-6 h-6 rounded-md bg-transparent border-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    title="Custom Color Picker"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Animation Dropdown - Context-Aware: only shown if loaded model contains animation tracks */}
        {models.length > 0 && animations.length > 0 && (
          <div className="relative">
            <button
              type="button"
              role="button"
              onClick={() => toggleDropdown('animation')}
              aria-label={`Animation timeline: ${animations.length} track${animations.length === 1 ? '' : 's'} available`}
              aria-haspopup="true"
              aria-expanded={openMenu === 'animation'}
              title="Animation Timeline Controls"
              className={`glass-button px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#242424] ${
                openMenu === 'animation' ? 'glass-button-active' : 'text-slate-200 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
              <span className="hidden sm:inline">Animations</span>
              <span className="w-2 h-2 rounded-full bg-purple-400" aria-hidden="true"></span>
              <ChevronDown className="w-3 h-3 text-slate-300" aria-hidden="true" />
            </button>

            {openMenu === 'animation' && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl backdrop-blur-md bg-neutral-900/95 p-3 border border-neutral-700/60 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3" role="region" aria-label="Animation Controls Panel">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                    <span>Animation Timeline</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenMenu(null)}
                    aria-label="Close animation menu"
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-neutral-800 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Track selector */}
                <div className="space-y-1">
                  <label htmlFor="anim-track-select" className="text-[10px] font-semibold text-slate-300 uppercase">Select Track</label>
                  <select
                    id="anim-track-select"
                    aria-label="Select Animation Track"
                    value={activeAnimIndex}
                    onChange={(e) => onSelectAnimTrack(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {animations.map((clip, idx) => (
                      <option key={idx} value={idx}>
                        {clip.name || `Animation Clip ${idx + 1}`} ({clip.duration.toFixed(1)}s)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Play Controls */}
                <div className="flex items-center gap-2 pt-1" role="group" aria-label="Playback Controls">
                  <button
                    type="button"
                    role="button"
                    onClick={onTogglePlayAnim}
                    aria-label={isAnimPlaying ? 'Pause animation playback' : 'Play animation playback'}
                    title={isAnimPlaying ? 'Pause Animation' : 'Play Animation'}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      isAnimPlaying
                        ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-md shadow-amber-600/30'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30'
                    }`}
                  >
                    {isAnimPlaying ? <Pause className="w-3.5 h-3.5" aria-hidden="true" /> : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
                    <span>{isAnimPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <button
                    type="button"
                    role="button"
                    onClick={onStopAnim}
                    aria-label="Stop animation and reset timeline to start"
                    title="Stop Animation"
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <Square className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Speed slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <label htmlFor="playback-speed-slider" className="text-slate-300">Playback Speed</label>
                    <span className="font-mono text-purple-300 font-bold">{animSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    id="playback-speed-slider"
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    aria-label="Playback Speed"
                    value={animSpeed}
                    onChange={(e) => onSetAnimSpeed(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  />
                </div>

                {/* Turntable Auto-Rotate */}
                <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                    <span>Turntable Auto-Rotate</span>
                    <input
                      type="checkbox"
                      aria-label="Toggle Turntable Auto-Rotate"
                      checked={autoRotate}
                      onChange={(e) => onToggleAutoRotate(e.target.checked)}
                      className="accent-blue-500 rounded focus:ring-2 focus:ring-blue-400"
                    />
                  </label>
                  {autoRotate && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-300">
                        <label htmlFor="turntable-speed-slider">Turntable Speed</label>
                        <span className="font-mono text-blue-300 font-bold">{rotateSpeed.toFixed(1)}x</span>
                      </div>
                      <input
                        id="turntable-speed-slider"
                        type="range"
                        min="0.2"
                        max="4.0"
                        step="0.2"
                        aria-label="Turntable Speed"
                        value={rotateSpeed}
                        onChange={(e) => onSetRotateSpeed(parseFloat(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Area: Essential Action [Open Files] and Consolidated [Tools] Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2" role="toolbar" aria-label="Quick Actions">
        {/* Essential Primary Action: Open Files Button */}
        <button
          type="button"
          role="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Open 3D files from local computer (.glb, .gltf, .fbx, .ply, .spz, .obj, .stl, .ifc, .ts, .js)"
          title="Open .glb, .gltf, .fbx, .ply, .spz, .obj, .stl, .ifc files"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#ea7600] hover:bg-[#d96d00] shadow-md shadow-[#ea7600]/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#242424]"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Open Files</span>
        </button>

        {/* Consolidated Tools (⋯) Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            role="button"
            onClick={() => toggleDropdown('tools')}
            aria-label="Tools menu and utilities"
            aria-haspopup="true"
            aria-expanded={openMenu === 'tools'}
            title="Tools & More Options"
            className={`glass-button px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#242424] ${
              openMenu === 'tools' ? 'glass-button-active' : 'text-slate-200 hover:text-white'
            }`}
          >
            <MoreHorizontal className="w-4 h-4 text-slate-300" aria-hidden="true" />
            <span className="hidden sm:inline">Tools</span>
            <ChevronDown className="w-3 h-3 text-slate-400" aria-hidden="true" />
          </button>

          {openMenu === 'tools' && (
            <div
              className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl backdrop-blur-md bg-neutral-900/95 border border-neutral-700/60 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-2.5 text-xs text-[#e0e0e0]"
              role="region"
              aria-label="Tools Menu"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Tools & Utilities</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  aria-label="Close tools menu"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-neutral-800 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-1">
                {/* 1. 3D Converter */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onOpenConverter();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-neutral-800/80 transition cursor-pointer text-slate-200 hover:text-white group border border-transparent hover:border-neutral-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <ArrowRightLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white group-hover:text-amber-300 transition-colors">
                      Convert 3D Model
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Convert to GLB, USDZ, PLY, OBJ, STL
                    </div>
                  </div>
                </button>

                {/* 2. Demo Object */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onGenerateDemo();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-neutral-800/80 transition cursor-pointer text-slate-200 hover:text-white group border border-transparent hover:border-neutral-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#ea7600]/20 text-amber-400 flex items-center justify-center shrink-0 border border-[#ea7600]/30">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white group-hover:text-amber-400 transition-colors">
                      Sample 3D Object
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Generate procedural geometric test model
                    </div>
                  </div>
                </button>

                {/* 3. Screenshot Capture */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onTakeScreenshot();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-neutral-800/80 transition cursor-pointer text-slate-200 hover:text-white group border border-transparent hover:border-neutral-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">
                      Capture Screenshot
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Save high-res PNG image of the 3D scene
                    </div>
                  </div>
                </button>

                {/* 4. Keyboard Shortcuts */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onToggleShortcuts();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-neutral-800/80 transition cursor-pointer text-slate-200 hover:text-white group border border-transparent hover:border-neutral-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
                    <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white group-hover:text-purple-300 transition-colors">
                      Keyboard Shortcuts
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Hotkeys cheat sheet (W/E/R, 1/3/7, Space)
                    </div>
                  </div>
                </button>

                {/* 5. Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    handleFullscreen();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-neutral-800/80 transition cursor-pointer text-slate-200 hover:text-white group border border-transparent hover:border-neutral-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    {isFullscreen ? (
                      <Minimize className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Maximize className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
                      {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Toggle full window 3D viewport canvas
                    </div>
                  </div>
                </button>
              </div>

              {/* Scene Telemetry Summary Footer */}
              <div className="pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <Activity className="w-3 h-3 text-emerald-400" /> Scene Telemetry
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{fps} FPS</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300 bg-neutral-950/80 p-1.5 rounded-lg border border-neutral-800 text-center">
                  <div>
                    <span className="block text-slate-500 text-[9px]">MODELS</span>
                    <span className="font-bold text-white">{models.length}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[9px]">TRIS</span>
                    <span className="font-bold text-blue-400">{totalStats.triangles.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[9px]">VERTS</span>
                    <span className="font-bold text-indigo-400">{totalStats.vertices.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

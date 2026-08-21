import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  LoadedModel,
  TransformValues,
  GizmoMode,
  TransformSpace,
  LightingPreset,
  RenderMode,
  CameraView,
  ToastMessage,
} from './types';
import { TopNavbar } from './components/TopNavbar';
import { TransformHUD } from './components/TransformHUD';
import { ViewCube } from './components/ViewCube';
import { Viewport3D, ViewportHandle } from './components/Viewport3D';
import { DropzoneOverlay } from './components/DropzoneOverlay';
import { ToastContainer } from './components/Toast';
import { ShortcutsModal } from './components/ShortcutsModal';
import { loadModelFile, createDemoModel } from './utils/modelLoaders';

export default function App() {
  const viewportRef = useRef<ViewportHandle>(null);
  const cameraQuaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion());

  // Models State
  const [models, setModels] = useState<LoadedModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Transform Gizmo & Inspector State
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate');
  const [transformSpace, setTransformSpace] = useState<TransformSpace>('world');
  const [transformValues, setTransformValues] = useState<TransformValues>({
    posX: 0,
    posY: 0,
    posZ: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    uniformScale: true,
  });

  // Environment & Display State
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [lightIntensity, setLightIntensity] = useState<number>(1.5);
  const [bgColor, setBgColor] = useState<string>('#090d16');
  const [renderMode, setRenderMode] = useState<RenderMode>('default');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(false);
  const [pointSize, setPointSize] = useState<number>(0.05);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [rotateSpeed, setRotateSpeed] = useState<number>(1.0);
  const [showBBox, setShowBBox] = useState<boolean>(false);

  // Animation State
  const [activeAnimIndex, setActiveAnimIndex] = useState<number>(0);
  const [isAnimPlaying, setIsAnimPlaying] = useState<boolean>(false);
  const [animSpeed, setAnimSpeed] = useState<number>(1.0);

  // Performance Telemetry
  const [fps, setFps] = useState<number>(60);

  // UI State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Update transform inspector state when selecting a model
  const syncTransformStateWithModel = useCallback((model: LoadedModel) => {
    const obj = model.object;
    setTransformValues({
      posX: obj.position.x,
      posY: obj.position.y,
      posZ: obj.position.z,
      rotX: THREE.MathUtils.radToDeg(obj.rotation.x),
      rotY: THREE.MathUtils.radToDeg(obj.rotation.y),
      rotZ: THREE.MathUtils.radToDeg(obj.rotation.z),
      scaleX: obj.scale.x,
      scaleY: obj.scale.y,
      scaleZ: obj.scale.z,
      uniformScale: true,
    });
  }, []);

  // Select a model
  const handleSelectModel = useCallback(
    (id: string | null) => {
      setSelectedModelId(id);
      if (id) {
        const found = models.find((m) => m.id === id);
        if (found) {
          syncTransformStateWithModel(found);
          if (!gizmoMode) setGizmoMode('translate');
        }
      }
    },
    [models, syncTransformStateWithModel, gizmoMode]
  );

  // Batch Load Files
  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    addToast(`Loading ${fileList.length} 3D model(s)...`, 'info');

    const loadedList: LoadedModel[] = [];
    let currentModels = [...models];

    for (const file of fileList) {
      try {
        const loaded = await loadModelFile(file, currentModels);
        loadedList.push(loaded);
        currentModels.push(loaded);
        addToast(`Loaded ${file.name}`, 'success');
      } catch (err: any) {
        console.error(err);
        addToast(err.message || `Failed to load ${file.name}`, 'error');
      }
    }

    if (loadedList.length > 0) {
      setModels((prev) => [...prev, ...loadedList]);
      const lastLoaded = loadedList[loadedList.length - 1];
      setSelectedModelId(lastLoaded.id);
      syncTransformStateWithModel(lastLoaded);
      if (!gizmoMode) setGizmoMode('translate');

      setTimeout(() => {
        viewportRef.current?.focusAll();
      }, 100);
    }
  };

  // Generate Procedural Demo Model
  const handleGenerateDemo = () => {
    const demo = createDemoModel(models);
    setModels((prev) => [...prev, demo]);
    setSelectedModelId(demo.id);
    syncTransformStateWithModel(demo);
    if (!gizmoMode) setGizmoMode('translate');

    addToast(`Generated ${demo.name}`, 'success');
    setTimeout(() => {
      viewportRef.current?.focusModel(demo.id);
    }, 100);
  };

  // Visibility toggle
  const handleToggleModelVisibility = (id: string) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m))
    );
  };

  // Delete single model
  const handleDeleteModel = (id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
    if (selectedModelId === id) {
      const remaining = models.filter((m) => m.id !== id);
      if (remaining.length > 0) {
        setSelectedModelId(remaining[0].id);
        syncTransformStateWithModel(remaining[0]);
      } else {
        setSelectedModelId(null);
      }
    }
    addToast('Model removed from scene', 'info');
  };

  // Clear all models
  const handleClearAllModels = () => {
    setModels([]);
    setSelectedModelId(null);
    setIsAnimPlaying(false);
    addToast('All models cleared', 'info');
  };

  // Two-Way Transform Update from Inspector inputs
  const handleUpdateTransform = (newValues: Partial<TransformValues>) => {
    setTransformValues((prev) => ({ ...prev, ...newValues }));
  };

  // Two-Way Transform Update from 3D Gizmo dragging
  const handleTransformGizmoChange = (newValues: Partial<TransformValues>) => {
    setTransformValues((prev) => ({ ...prev, ...newValues }));
  };

  // Reset transforms for selected model
  const handleResetTransform = () => {
    if (!selectedModelId) return;
    const selected = models.find((m) => m.id === selectedModelId);
    if (!selected) return;

    selected.object.position.set(0, 0, 0);
    selected.object.rotation.set(0, 0, 0);
    selected.object.scale.set(1, 1, 1);

    setTransformValues({
      posX: 0,
      posY: 0,
      posZ: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      uniformScale: true,
    });
    addToast('Transforms reset', 'info');
  };

  // Screenshot capture
  const handleTakeScreenshot = () => {
    if (!viewportRef.current) return;
    const dataUrl = viewportRef.current.captureScreenshot();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `3D_Studio_Capture_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      addToast('Screenshot saved to downloads!', 'success');
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'w') {
        setGizmoMode('translate');
        addToast('Mode: Translate (Move)', 'info');
      } else if (key === 'e') {
        setGizmoMode('rotate');
        addToast('Mode: Rotate', 'info');
      } else if (key === 'r') {
        setGizmoMode('scale');
        addToast('Mode: Scale', 'info');
      } else if (key === 'x') {
        setTransformSpace((prev) => {
          const next = prev === 'world' ? 'local' : 'world';
          addToast(`Transform Space: ${next.toUpperCase()}`, 'info');
          return next;
        });
      } else if (key === 'q' || e.key === 'Escape') {
        setGizmoMode(null);
        setSelectedModelId(null);
        addToast('Deselected / Gizmo hidden', 'info');
      } else if (key === 'f') {
        if (selectedModelId) {
          viewportRef.current?.focusModel(selectedModelId);
          addToast('Focused on active model', 'info');
        } else {
          viewportRef.current?.focusAll();
          addToast('Framed scene', 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModelId, addToast]);

  // Drag and Drop files over window
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      setIsDragging(true);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [models]);

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const activeAnimations = selectedModel?.animations || [];

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Full-Viewport WebGL Three.js Canvas (100% width & height) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Viewport3D
          ref={viewportRef}
          models={models}
          selectedModelId={selectedModelId}
          transformValues={transformValues}
          gizmoMode={gizmoMode}
          transformSpace={transformSpace}
          lightingPreset={lightingPreset}
          lightIntensity={lightIntensity}
          bgColor={bgColor}
          renderMode={renderMode}
          showGrid={showGrid}
          showAxes={showAxes}
          pointSize={pointSize}
          autoRotate={autoRotate}
          rotateSpeed={rotateSpeed}
          showBBox={showBBox}
          activeAnimIndex={activeAnimIndex}
          isAnimPlaying={isAnimPlaying}
          animSpeed={animSpeed}
          onSelectModel={handleSelectModel}
          onTransformChange={handleTransformGizmoChange}
          onFpsUpdate={setFps}
          cameraQuaternionRef={cameraQuaternionRef}
        />
      </div>

      {/* 2. Top Taskbar & Dropdown Popovers */}
      <TopNavbar
        models={models}
        selectedModelId={selectedModelId}
        transformValues={transformValues}
        lightingPreset={lightingPreset}
        lightIntensity={lightIntensity}
        bgColor={bgColor}
        renderMode={renderMode}
        showGrid={showGrid}
        showAxes={showAxes}
        pointSize={pointSize}
        autoRotate={autoRotate}
        rotateSpeed={rotateSpeed}
        showBBox={showBBox}
        animations={activeAnimations}
        activeAnimIndex={activeAnimIndex}
        isAnimPlaying={isAnimPlaying}
        animSpeed={animSpeed}
        fps={fps}
        onFilesSelected={handleFilesSelected}
        onGenerateDemo={handleGenerateDemo}
        onTakeScreenshot={handleTakeScreenshot}
        onToggleShortcuts={() => setIsShortcutsOpen(true)}
        onSelectModel={handleSelectModel}
        onToggleModelVisibility={handleToggleModelVisibility}
        onDeleteModel={handleDeleteModel}
        onClearAllModels={handleClearAllModels}
        onUpdateTransform={handleUpdateTransform}
        onResetTransform={handleResetTransform}
        onFocusModel={(id) => viewportRef.current?.focusModel(id)}
        onSetLightingPreset={setLightingPreset}
        onSetLightIntensity={setLightIntensity}
        onSetBgColor={setBgColor}
        onSetRenderMode={setRenderMode}
        onToggleGrid={setShowGrid}
        onToggleAxes={setShowAxes}
        onSetPointSize={setPointSize}
        onToggleAutoRotate={setAutoRotate}
        onSetRotateSpeed={setRotateSpeed}
        onToggleBBox={setShowBBox}
        onSelectAnimTrack={setActiveAnimIndex}
        onTogglePlayAnim={() => setIsAnimPlaying((p) => !p)}
        onStopAnim={() => setIsAnimPlaying(false)}
        onSetAnimSpeed={setAnimSpeed}
      />

      {/* 3. Floating Transform HUD (Top-Center) */}
      <TransformHUD
        mode={gizmoMode}
        space={transformSpace}
        hasSelection={!!selectedModelId && !!selectedModel}
        selectedModelName={selectedModel?.name}
        onSetMode={(mode) => setGizmoMode(mode)}
        onToggleSpace={() =>
          setTransformSpace((prev) => (prev === 'world' ? 'local' : 'world'))
        }
        onDeselect={() => {
          setGizmoMode(null);
          setSelectedModelId(null);
        }}
      />

      {/* 4. Interactive 3D ViewCube Overlay (Bottom-Right Corner) */}
      <ViewCube
        onSetCameraView={(view: CameraView) => viewportRef.current?.setCameraView(view)}
        onFocusSelected={() => {
          if (selectedModelId) {
            viewportRef.current?.focusModel(selectedModelId);
          } else {
            viewportRef.current?.focusAll();
          }
        }}
        hasSelection={!!selectedModelId}
        cameraQuaternionRef={cameraQuaternionRef}
      />

      {/* 5. Drag & Drop Overlay & Empty State */}
      <DropzoneOverlay
        isDragging={isDragging}
        modelCount={models.length}
        onOpenFileInput={() => {
          const input = document.querySelector<HTMLInputElement>('input[type="file"]');
          input?.click();
        }}
        onLoadDemo={handleGenerateDemo}
      />

      {/* 6. Non-blocking Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* 7. Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

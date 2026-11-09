import * as THREE from 'three';

/**
 * Built-in Google Three-Live Torus Knot example.
 */
export const TORUS_KNOT_THREE_LIVE_EXAMPLE = `<three-live allow-client-scripts camera-controls ar>
  <script type="text/three">
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.6, 0.2, 128, 32),
      new THREE.MeshStandardMaterial({ color: 0x4285f4, metalness: 0.85, roughness: 0.15 })
    );
    scene.add(knot);
    scene.userData.animate = (t) => { knot.rotation.y = Math.sin(t * Math.PI) * 0.8; };
  </script>
</three-live>`;


/**
 * Built-in Samurai Avatar Three-Live example.
 * Built using Box, Sphere, Cylinder, Cone, Torus and MeshStandardMaterial only.
 * Features:
 * - Kabuto helmet with gold kuwagata horns, crescent maedate, and neck shikoro
 * - Red do armour with black/gold trim and kusazuri skirt
 * - Navy hakama with sandals
 * - Katana in right hand and wakizashi at waist
 * - Sashimono back banner flag
 * - Pedestal stand
 * - scene.userData.animate that bobs the samurai and turns it slowly
 */
export const SAMURAI_THREE_LIVE_EXAMPLE = `<three-live allow-client-scripts camera-controls ar>
  <script type="text/three">
    // 1. Pedestal Stand
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.35,
    });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.25, 32), pedestalMat);
    pedestal.position.y = 0.125;
    scene.add(pedestal);

    // 2. Samurai Group Container
    const samurai = new THREE.Group();
    samurai.name = 'Samurai_Avatar';
    samurai.position.y = 0.25;

    // Materials Palette
    const redArmourMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.35,
      metalness: 0.4,
    });
    const darkLacqueredMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.25,
      metalness: 0.6,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9,
    });
    const navyHakamaMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.1,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfed7aa,
      roughness: 0.6,
      metalness: 0.05,
    });
    const steelBladeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.1,
      metalness: 0.95,
    });
    const bannerWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.75,
      metalness: 0.05,
    });
    const crestRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.4,
      metalness: 0.1,
    });

    // 3. Hakama (Legs) & Sandals
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.9, 16), navyHakamaMat);
    leftLeg.position.set(-0.25, 0.45, 0);
    samurai.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.9, 16), navyHakamaMat);
    rightLeg.position.set(0.25, 0.45, 0);
    samurai.add(rightLeg);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), darkLacqueredMat);
    leftFoot.position.set(-0.25, 0.04, 0.04);
    samurai.add(leftFoot);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), darkLacqueredMat);
    rightFoot.position.set(0.25, 0.04, 0.04);
    samurai.add(rightFoot);

    // 4. Do Armour (Torso) & Kusazuri Skirt
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.42, 0.8, 16), redArmourMat);
    torso.position.set(0, 1.25, 0);
    samurai.add(torso);

    const goldTorsoTrim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.025, 8, 24), goldMat);
    goldTorsoTrim.rotation.x = Math.PI / 2;
    goldTorsoTrim.position.set(0, 1.25, 0);
    samurai.add(goldTorsoTrim);

    const obiBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.14, 16), darkLacqueredMat);
    obiBelt.position.set(0, 0.9, 0);
    samurai.add(obiBelt);

    // Kusazuri tassets (hanging armour skirt plates)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const tasset = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.04), redArmourMat);
      tasset.position.set(Math.sin(angle) * 0.45, 0.8, Math.cos(angle) * 0.45);
      tasset.rotation.y = angle;
      samurai.add(tasset);
    }

    // 5. Shoulders (Sode) & Arms
    const leftSode = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.36), redArmourMat);
    leftSode.position.set(-0.58, 1.48, 0);
    leftSode.rotation.z = 0.15;
    samurai.add(leftSode);

    const rightSode = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.36), redArmourMat);
    rightSode.position.set(0.58, 1.48, 0);
    rightSode.rotation.z = -0.15;
    samurai.add(rightSode);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.55, 12), darkLacqueredMat);
    leftArm.position.set(-0.48, 1.15, 0);
    samurai.add(leftArm);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), skinMat);
    leftHand.position.set(-0.48, 0.85, 0);
    samurai.add(leftHand);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.55, 12), darkLacqueredMat);
    rightArm.position.set(0.48, 1.18, 0.12);
    rightArm.rotation.x = -Math.PI / 6;
    samurai.add(rightArm);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), skinMat);
    rightHand.position.set(0.48, 0.94, 0.32);
    samurai.add(rightHand);

    // 6. Katana (in right hand)
    const katanaGroup = new THREE.Group();
    katanaGroup.position.set(0.48, 0.94, 0.32);
    katanaGroup.rotation.set(-Math.PI / 4, 0.2, -0.1);

    const tsukaHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 12), darkLacqueredMat);
    tsukaHandle.position.y = -0.175;
    katanaGroup.add(tsukaHandle);

    const tsubaGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), goldMat);
    katanaGroup.add(tsubaGuard);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.05, 0.07), steelBladeMat);
    blade.position.set(0, 0.525, 0);
    katanaGroup.add(blade);

    samurai.add(katanaGroup);

    // 7. Wakizashi (Short sword at waist)
    const wakizashi = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.55), darkLacqueredMat);
    wakizashi.position.set(-0.35, 0.92, 0.08);
    wakizashi.rotation.set(0.2, -0.4, 0);
    samurai.add(wakizashi);

    // 8. Head & Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 16), skinMat);
    neck.position.set(0, 1.7, 0);
    samurai.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), skinMat);
    head.position.set(0, 1.95, 0);
    samurai.add(head);

    // 9. Kabuto Helmet
    // Helmet bowl (hachi)
    const helmetBowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
      darkLacqueredMat
    );
    helmetBowl.position.set(0, 2.05, 0);
    samurai.add(helmetBowl);

    // Shikoro (neck guard rings around back)
    const shikoro = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.44, 0.18, 16, 1, true, -Math.PI * 0.85, Math.PI * 1.7),
      redArmourMat
    );
    shikoro.position.set(0, 1.88, -0.05);
    shikoro.material.side = THREE.DoubleSide;
    samurai.add(shikoro);

    // Front visor (mabisashi)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.16), darkLacqueredMat);
    visor.position.set(0, 2.08, 0.26);
    visor.rotation.x = -0.2;
    samurai.add(visor);

    // Kuwagata Horns (Gold antlers in V-shape)
    const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.55, 12), goldMat);
    leftHorn.position.set(-0.16, 2.45, 0.22);
    leftHorn.rotation.set(0.1, 0, 0.35);
    samurai.add(leftHorn);

    const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.55, 12), goldMat);
    rightHorn.position.set(0.16, 2.45, 0.22);
    rightHorn.rotation.set(0.1, 0, -0.35);
    samurai.add(rightHorn);

    // Crescent Maedate (Central crest)
    const maedate = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 24, Math.PI * 1.2), goldMat);
    maedate.position.set(0, 2.28, 0.28);
    maedate.rotation.set(0, 0, -Math.PI * 0.1);
    samurai.add(maedate);

    // 10. Sashimono Back Banner Flag
    const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 12), darkLacqueredMat);
    bannerPole.position.set(0, 1.75, -0.42);
    samurai.add(bannerPole);

    const bannerCrossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 12), darkLacqueredMat);
    bannerCrossbar.position.set(0.25, 2.65, -0.42);
    bannerCrossbar.rotation.z = Math.PI / 2;
    samurai.add(bannerCrossbar);

    const bannerFlag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.15, 0.02), bannerWhiteMat);
    bannerFlag.position.set(0.28, 2.05, -0.42);
    samurai.add(bannerFlag);

    const bannerEmblem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 24), crestRedMat);
    bannerEmblem.position.set(0.28, 2.25, -0.41);
    bannerEmblem.rotation.x = Math.PI / 2;
    samurai.add(bannerEmblem);

    scene.add(samurai);

    // 11. Three-Live Animation Hook: seamless looping bob and sway (identical at t=0 and t=2)
    scene.userData.animate = (t) => {
      samurai.position.y = 0.25 + Math.sin(t * Math.PI) * 0.05;
      samurai.rotation.y = Math.sin(t * Math.PI) * 0.4;
    };
  </script>
</three-live>`;

/**
 * Extracts the inner JavaScript/Three.js code from a Three-Live input string:
 * - If input contains <script type="text/three">...</script>, returns inner code.
 * - Else if it contains <script type="text/three-live">...</script>, returns inner code.
 * - Else treats the whole input as the code, stripping any surrounding HTML tags outside the script.
 */
export function extractThreeLiveScript(input: string): string {
  if (!input) return '';

  // 1. Check for <script type="text/three"...> or <script type="text/three-live"...>
  const threeScriptRegex = /<script\b[^>]*type=["']text\/(?:three|three-live)["'][^>]*>([\s\S]*?)<\/script>/i;
  const threeMatch = input.match(threeScriptRegex);
  if (threeMatch && threeMatch[1] !== undefined) {
    return threeMatch[1].trim();
  }

  // 2. Check for general <script>...</script>
  const generalScriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/i;
  const generalMatch = input.match(generalScriptRegex);
  if (generalMatch && generalMatch[1] !== undefined) {
    return generalMatch[1].trim();
  }

  // 3. If other HTML tags are present (like <three-live> ... </three-live>), strip tags
  if (/<[a-z][\s\S]*>/i.test(input)) {
    const stripped = input.replace(/<\/?[a-z0-9-]+(?:\s+[^>]*)?>/gi, '').trim();
    return stripped;
  }

  return input.trim();
}

export const THREE_LIVE_EXECUTION_TIMEOUT_MS = 3000;
export const THREE_LIVE_MAX_VERTICES = 500000;
export const THREE_LIVE_MAX_MESHES = 3000;

/**
 * Executes Three-Live JavaScript/TypeScript code in a sandboxed context:
 * - Runs with new Function('THREE', 'scene', transpiledCode)
 * - Prohibits forbidden network and DOM access (fetch, XMLHttpRequest, WebSocket, import(), eval, window., document., localStorage)
 * - Collects all Mesh / Group children into a new THREE.Group (ignoring Lights and Cameras)
 * - Captures scene.userData.animate or top-level function animate(t)
 * - Enforces 3-second safety execution timeout and mesh/vertex quota limits
 */
// This is regex + new Function on the main thread, not a real Web Worker sandbox - only paste code you trust.
export async function executeThreeLiveScript(

  inputCode: string,
  filename: string = 'three-live-code.html'
): Promise<{ object: THREE.Group; animate?: (t: number) => void }> {
  const startTime = performance.now();
  const rawCode = extractThreeLiveScript(inputCode);

  if (!rawCode.trim()) {
    throw new Error(
      `Three-Live error in "${filename}": No JavaScript/Three.js code found to execute.`
    );
  }

  // Safety checks: reject code containing network or DOM access
  const forbiddenPatterns: { pattern: RegExp; name: string }[] = [
    { pattern: /\bfetch\s*\(/i, name: 'fetch()' },
    { pattern: /\bXMLHttpRequest\b/i, name: 'XMLHttpRequest' },
    { pattern: /\bWebSocket\b/i, name: 'WebSocket' },
    { pattern: /\bimport\s*\(/i, name: 'dynamic import()' },
    { pattern: /\beval\s*\(/i, name: 'eval()' },
    { pattern: /\bwindow\s*\./i, name: 'window.' },
    { pattern: /\bdocument\s*\./i, name: 'document.' },
    { pattern: /\blocalStorage\b/i, name: 'localStorage' },
  ];

  for (const { pattern, name } of forbiddenPatterns) {
    if (pattern.test(rawCode)) {
      throw new Error(
        `Three-Live error in "${filename}": Three-Live code must not use network or DOM access. Forbidden: ${name}`
      );
    }
  }

  // Enforce 3-second safety execution timeout during code transpilation & execution
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Three-Live error in "${filename}": Execution timed out. Exceeded 3-second safety limit.`
        )
      );
    }, THREE_LIVE_EXECUTION_TIMEOUT_MS);
    // Allow process to exit cleanly if in node
    if (typeof (timer as any).unref === 'function') {
      (timer as any).unref();
    }
  });

  const executionPromise = (async () => {
    // Transpile TypeScript syntax if present using Sucrase
    const { transform } = await import('sucrase');
    let transpiledCode: string;
    try {
      transpiledCode = transform(rawCode, { transforms: ['typescript'] }).code;
    } catch (err: any) {
      const loc = err?.loc ? ` at line ${err.loc.line}, column ${err.loc.column}` : '';
      throw new Error(
        `Three-Live error in "${filename}": Syntax error${loc} - ${err?.message || err}`
      );
    }

    if (performance.now() - startTime > THREE_LIVE_EXECUTION_TIMEOUT_MS) {
      throw new Error(
        `Three-Live error in "${filename}": Execution timed out. Exceeded 3-second safety limit.`
      );
    }

    // Inject trailing capture check for top-level function animate(t) if present
    const wrappedCode = `
      ${transpiledCode}
      try {
        if (typeof animate === 'function') {
          if (!scene.userData) scene.userData = {};
          if (!scene.userData.animate) {
            scene.userData.animate = animate;
          }
        }
      } catch (_) {}
    `;

    const scene = new THREE.Scene();

    try {
      const runFn = new Function('THREE', 'scene', wrappedCode);
      runFn(THREE, scene);
    } catch (err: any) {
      let lineInfo = '';
      if (err?.stack) {
        const match = err.stack.match(/<anonymous>:(\d+):(\d+)/) || err.stack.match(/Function:(\d+):(\d+)/);
        if (match) {
          const line = Math.max(1, parseInt(match[1], 10) - 1);
          lineInfo = ` at line ${line}`;
        }
      }
      throw new Error(`Three-Live error in "${filename}": ${err?.message || err}${lineInfo}`);
    }

    if (performance.now() - startTime > THREE_LIVE_EXECUTION_TIMEOUT_MS) {
      throw new Error(
        `Three-Live error in "${filename}": Execution timed out. Exceeded 3-second safety limit.`
      );
    }

    // Collect all Mesh / Group children from scene into a new THREE.Group
    // Ignore Lights and Cameras added by the script (viewer has its own studio lighting)
    const rootGroup = new THREE.Group();
    rootGroup.name = filename.replace(/\.[^/.]+$/, '') || 'Three-Live Model';

    const sceneChildren = [...scene.children];
    for (const child of sceneChildren) {
      if (child instanceof THREE.Light || child instanceof THREE.Camera) {
        continue;
      }
      rootGroup.add(child);
    }

    if (rootGroup.children.length === 0) {
      throw new Error(
        `Three-Live error in "${filename}": No 3D objects were added to the scene. Make sure your script calls "scene.add(object)" to add meshes or groups.`
      );
    }

    // Mesh and vertex safety quota checks
    let totalMeshes = 0;
    let totalVertices = 0;

    rootGroup.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
        totalMeshes++;
        const geom = child.geometry;
        if (geom && geom.attributes && geom.attributes.position) {
          totalVertices += geom.attributes.position.count;
        }
      }
    });

    if (totalMeshes > THREE_LIVE_MAX_MESHES) {
      throw new Error(
        `Three-Live error in "${filename}": Mesh quota exceeded. Limit is ${THREE_LIVE_MAX_MESHES.toLocaleString()} meshes (found ${totalMeshes.toLocaleString()}).`
      );
    }

    if (totalVertices > THREE_LIVE_MAX_VERTICES) {
      throw new Error(
        `Three-Live error in "${filename}": Vertex quota exceeded. Limit is ${THREE_LIVE_MAX_VERTICES.toLocaleString()} vertices (found ${totalVertices.toLocaleString()}).`
      );
    }

    let animateFn: ((t: number) => void) | undefined = undefined;
    if (typeof scene.userData?.animate === 'function') {
      animateFn = scene.userData.animate;
    }

    return { object: rootGroup, animate: animateFn };
  })();

  return Promise.race([executionPromise, timeoutPromise]);
}

/**
 * Bakes a Three-Live animate(t) function into a THREE.AnimationClip by sampling
 * animate(t) at 30fps for 2 seconds (recording position/quaternion of root group and moving children).
 * Sets target names compatible with GLTFExporter (.position / .quaternion for root, ${child.name}.position for children).
 * Restores original object transforms at t=0 when baking is complete.
 *
 * NOTE: The baked clip only loops seamlessly if animate(0) equals animate(duration).
 */
export function bakeThreeLiveAnimation(
  rootObject: THREE.Object3D,
  animate: (t: number) => void,
  duration = 2.0,
  fps = 30
): THREE.AnimationClip {
  // Find all objects to observe: root + descendants
  const candidateObjects: THREE.Object3D[] = [rootObject];
  rootObject.traverse((obj) => {
    if (obj !== rootObject) {
      candidateObjects.push(obj);
    }
  });

  // Assign fallback names if missing
  candidateObjects.forEach((obj, idx) => {
    if (!obj.name) {
      obj.name = obj === rootObject ? 'RootModel' : `Node_${idx}`;
    }
  });

  // Seamless-loop check: sample at t=0 and t=duration, compare positions & quaternions
  try {
    animate(0);
    rootObject.updateMatrixWorld(true);
    const startTransforms = candidateObjects.map((obj) => ({
      pos: obj.position.clone(),
      quat: obj.quaternion.clone(),
    }));

    animate(duration);
    rootObject.updateMatrixWorld(true);
    let isSeamless = true;
    for (let j = 0; j < candidateObjects.length; j++) {
      const obj = candidateObjects[j];
      const start = startTransforms[j];
      if (
        Math.abs(obj.position.x - start.pos.x) > 0.001 ||
        Math.abs(obj.position.y - start.pos.y) > 0.001 ||
        Math.abs(obj.position.z - start.pos.z) > 0.001 ||
        Math.abs(obj.quaternion.x - start.quat.x) > 0.001 ||
        Math.abs(obj.quaternion.y - start.quat.y) > 0.001 ||
        Math.abs(obj.quaternion.z - start.quat.z) > 0.001 ||
        Math.abs(obj.quaternion.w - start.quat.w) > 0.001
      ) {
        isSeamless = false;
        break;
      }
    }
    if (!isSeamless) {
      console.warn('Animation is not seamless at 2s, loop will jump');
    }
  } catch (_) {}

  // Total frames: duration * fps
  const totalFrames = Math.round(duration * fps);
  const times = new Float32Array(totalFrames + 1);
  for (let i = 0; i <= totalFrames; i++) {
    times[i] = i / fps;
  }

  const positions = new Map<THREE.Object3D, Float32Array>();
  const quaternions = new Map<THREE.Object3D, Float32Array>();

  candidateObjects.forEach((obj) => {
    positions.set(obj, new Float32Array((totalFrames + 1) * 3));
    quaternions.set(obj, new Float32Array((totalFrames + 1) * 4));
  });

  // Sample frames 0 through totalFrames - 1
  for (let i = 0; i < totalFrames; i++) {
    const t = times[i];
    try {
      animate(t);
    } catch (_) {}
    rootObject.updateMatrixWorld(true);

    candidateObjects.forEach((obj) => {
      const posArr = positions.get(obj)!;
      posArr[i * 3 + 0] = obj.position.x;
      posArr[i * 3 + 1] = obj.position.y;
      posArr[i * 3 + 2] = obj.position.z;

      const quatArr = quaternions.get(obj)!;
      quatArr[i * 4 + 0] = obj.quaternion.x;
      quatArr[i * 4 + 1] = obj.quaternion.y;
      quatArr[i * 4 + 2] = obj.quaternion.z;
      quatArr[i * 4 + 3] = obj.quaternion.w;
    });
  }

  // Make the last keyframe at t=duration (index totalFrames) explicitly equal to t=0
  // to eliminate floating-point drift and guarantee a seamless loop boundary
  candidateObjects.forEach((obj) => {
    const posArr = positions.get(obj)!;
    posArr[totalFrames * 3 + 0] = posArr[0];
    posArr[totalFrames * 3 + 1] = posArr[1];
    posArr[totalFrames * 3 + 2] = posArr[2];

    const quatArr = quaternions.get(obj)!;
    quatArr[totalFrames * 4 + 0] = quatArr[0];
    quatArr[totalFrames * 4 + 1] = quatArr[1];
    quatArr[totalFrames * 4 + 2] = quatArr[2];
    quatArr[totalFrames * 4 + 3] = quatArr[3];
  });

  // Restore t=0 state
  try {
    animate(0);
  } catch (_) {}
  rootObject.updateMatrixWorld(true);

  const tracks: THREE.KeyframeTrack[] = [];

  const hasVariation = (arr: Float32Array, stride: number): boolean => {
    for (let i = stride; i < arr.length; i++) {
      if (Math.abs(arr[i] - arr[i % stride]) > 0.0001) return true;
    }
    return false;
  };

  candidateObjects.forEach((obj) => {
    const posArr = positions.get(obj)!;
    const quatArr = quaternions.get(obj)!;

    const posChanged = hasVariation(posArr, 3);
    const quatChanged = hasVariation(quatArr, 4);

    const isRoot = obj === rootObject;
    const targetPrefix = isRoot ? '.' : `${obj.name}.`;

    // When baking, do NOT bake a root .position track that would move the normalized model:
    // If animate() only moved children, posChanged for root is false, so no root .position track
    // is added at all. This preserves the root's normalized placement and multi-model offset.
    if (posChanged) {
      tracks.push(new THREE.VectorKeyframeTrack(`${targetPrefix}position`, times as any, posArr as any));
    }

    if (quatChanged) {
      tracks.push(new THREE.QuaternionKeyframeTrack(`${targetPrefix}quaternion`, times as any, quatArr as any));
    }
  });

  const clip = new THREE.AnimationClip('ThreeLiveAnimation', duration, tracks);
  (clip as any).loop = THREE.LoopRepeat;
  return clip;
}


import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

interface PenBookLoading3DProps {
  message?: string;
  subMessage?: string;
}

export const PenBookLoading3D: React.FC<PenBookLoading3DProps> = ({ 
  message = "Loading Campus Updates & Official Notices...",
  subMessage = "Synchronizing official feed from central.edu.gh"
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const darkColor = new THREE.Color(0x0f1115);
    const lightColor = new THREE.Color(0xf8fafc);
    scene.background = isDark ? darkColor.clone() : lightColor.clone();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 8.8);
    camera.lookAt(0, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(4, 10, 6);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    const pageW = 2.4;
    const pageH = 3.2;
    const pageThickness = 0.12;

    const coverMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.1 });
    const pageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.2 });

    // Left Page
    const leftPageGeo = new THREE.BoxGeometry(pageW, pageThickness, pageH);
    const leftPageMesh = new THREE.Mesh(leftPageGeo, pageMat);
    leftPageMesh.position.set(-pageW / 2, -0.06, 0);
    bookGroup.add(leftPageMesh);

    const leftCoverGeo = new THREE.BoxGeometry(pageW + 0.1, 0.04, pageH + 0.1);
    const leftCoverMesh = new THREE.Mesh(leftCoverGeo, coverMat);
    leftCoverMesh.position.set(-(pageW + 0.1) / 2, -0.14, 0);
    bookGroup.add(leftCoverMesh);

    // Right Page
    const rightPageMesh = new THREE.Mesh(leftPageGeo, pageMat);
    rightPageMesh.position.set(pageW / 2, -0.06, 0);
    bookGroup.add(rightPageMesh);

    const rightCoverMesh = new THREE.Mesh(leftCoverGeo, coverMat);
    rightCoverMesh.position.set((pageW + 0.1) / 2, -0.14, 0);
    bookGroup.add(rightCoverMesh);

    // Spine
    const spineGeo = new THREE.CylinderGeometry(0.12, 0.12, pageH + 0.1, 16);
    const spineMesh = new THREE.Mesh(spineGeo, spineMat);
    spineMesh.rotation.x = Math.PI / 2;
    spineMesh.position.set(0, -0.12, 0);
    bookGroup.add(spineMesh);

    // Flipper Pivot
    const flipperPivot = new THREE.Group();
    flipperPivot.position.set(0, 0, 0);
    bookGroup.add(flipperPivot);

    const flippingPageGeo = new THREE.PlaneGeometry(pageW, pageH);
    flippingPageGeo.translate(pageW / 2, 0, 0);
    const flippingPageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, side: THREE.DoubleSide, roughness: 0.9 });
    const flippingPageMesh = new THREE.Mesh(flippingPageGeo, flippingPageMat);
    flippingPageMesh.rotation.x = -Math.PI / 2;
    flipperPivot.add(flippingPageMesh);
    flipperPivot.visible = false;

    bookGroup.rotation.x = 0.28;

    const inkGroup = new THREE.Group();
    bookGroup.add(inkGroup);

    const lineCount = 3;
    const lineYOffset = 0.005;
    const lineZPositions = [-0.8, 0, 0.8];
    const startX = 0.4;
    const endX = 2.0;

    let lineMeshes: { mesh: THREE.Line; maxSegments: number; posArray: Float32Array }[] = [];

    for (let i = 0; i < lineCount; i++) {
      const maxSegments = 60;
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(maxSegments * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      geo.setDrawRange(0, 0);

      const mesh = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xCE1126, linewidth: 3 }));
      mesh.position.set(0, lineYOffset, lineZPositions[i]);
      inkGroup.add(mesh);
      lineMeshes.push({ mesh, maxSegments, posArray });
    }

    const penGroup = new THREE.Group();
    scene.add(penGroup);

    const penBodyMat = new THREE.MeshStandardMaterial({ color: 0xCE1126, roughness: 0.2, metalness: 0.8 });
    const penGoldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.9 });
    const penClipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });

    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 20);
    const barrelMesh = new THREE.Mesh(barrelGeo, penBodyMat);
    penGroup.add(barrelMesh);

    const ringGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.1, 20);
    const ringMesh = new THREE.Mesh(ringGeo, penGoldMat);
    ringMesh.position.y = -0.5;
    penGroup.add(ringMesh);

    const gripGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.6, 20);
    const gripMesh = new THREE.Mesh(gripGeo, penBodyMat);
    gripMesh.position.y = -0.8;
    penGroup.add(gripMesh);

    const nibGeo = new THREE.ConeGeometry(0.06, 0.3, 16);
    const nibMesh = new THREE.Mesh(nibGeo, penGoldMat);
    nibMesh.position.y = -1.25;
    penGroup.add(nibMesh);

    const tipGeo = new THREE.SphereGeometry(0.015, 8, 8);
    const tipMesh = new THREE.Mesh(tipGeo, penGoldMat);
    tipMesh.position.y = -1.4;
    penGroup.add(tipMesh);

    const clipGeo = new THREE.BoxGeometry(0.03, 0.7, 0.04);
    const clipMesh = new THREE.Mesh(clipGeo, penClipMat);
    clipMesh.position.set(0.09, 0.3, 0);
    penGroup.add(clipMesh);

    penGroup.rotation.z = -0.35;
    penGroup.rotation.x = 0.4;

    let clock = new THREE.Clock();
    let loopTime = 0;
    const lineDuration = 2.0;
    const totalWriteDuration = lineDuration * lineCount;
    const pageTurnDuration = 1.2;
    const loopCycleTotal = totalWriteDuration + pageTurnDuration;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      loopTime += delta;
      let currentCycleTime = loopTime % loopCycleTotal;

      if (currentCycleTime < totalWriteDuration) {
        flipperPivot.visible = false;
        flipperPivot.rotation.z = 0;

        let currentLineIdx = Math.floor(currentCycleTime / lineDuration);
        let lineProgress = (currentCycleTime % lineDuration) / lineDuration;

        let targetX = THREE.MathUtils.lerp(startX, endX, lineProgress);
        let targetZ = lineZPositions[currentLineIdx] + Math.sin(lineProgress * Math.PI * 18) * 0.03;
        let targetY = 0.25 + Math.sin(lineProgress * Math.PI * 12) * 0.015;

        let localTarget = new THREE.Vector3(targetX, targetY, targetZ);
        localTarget.applyMatrix4(bookGroup.matrixWorld);

        penGroup.position.copy(localTarget);
        penGroup.position.y += 0.55;
        penGroup.rotation.z = -0.38 + Math.sin(lineProgress * 30) * 0.02;

        let lineObj = lineMeshes[currentLineIdx];
        let segmentsToDraw = Math.floor(lineProgress * lineObj.maxSegments);

        for (let i = 0; i < segmentsToDraw; i++) {
          let segProgress = i / lineObj.maxSegments;
          let px = THREE.MathUtils.lerp(startX, endX, segProgress);
          let pz = Math.sin(segProgress * Math.PI * 18) * 0.03;
          lineObj.posArray[i * 3] = px;
          lineObj.posArray[i * 3 + 1] = 0;
          lineObj.posArray[i * 3 + 2] = pz;
        }
        lineObj.mesh.geometry.attributes.position.needsUpdate = true;
        lineObj.mesh.geometry.setDrawRange(0, segmentsToDraw);

        for (let k = 0; k < currentLineIdx; k++) {
          lineMeshes[k].mesh.geometry.setDrawRange(0, lineMeshes[k].maxSegments);
        }
        for (let k = currentLineIdx + 1; k < lineCount; k++) {
          lineMeshes[k].mesh.geometry.setDrawRange(0, 0);
        }
      } else {
        let turnProgress = (currentCycleTime - totalWriteDuration) / pageTurnDuration;

        let idleTarget = new THREE.Vector3(0, 1.4, 0);
        idleTarget.applyMatrix4(bookGroup.matrixWorld);
        penGroup.position.lerp(idleTarget, 0.1);
        penGroup.rotation.z = -0.2;

        flipperPivot.visible = true;
        flipperPivot.rotation.z = turnProgress * Math.PI;

        if (turnProgress > 0.5) {
          for (let k = 0; k < lineCount; k++) {
            lineMeshes[k].mesh.geometry.setDrawRange(0, 0);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <div className={`py-12 px-4 flex flex-col items-center justify-center text-center rounded-2xl border transition-all ${
      isDark ? 'bg-slate-800/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
    }`}>
      {/* 3D Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-72 h-64 md:w-80 md:h-72 rounded-2xl overflow-hidden mb-4 shadow-xl border border-red-500/20 bg-[#0a0c0f]"
      />
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126] animate-ping inline-block" />
        <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {message}
        </h4>
      </div>
      <p className={`text-xs max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {subMessage}
      </p>
    </div>
  );
};

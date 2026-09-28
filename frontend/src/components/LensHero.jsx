'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * LensHero - Heavy Circular Glass Refraction Lens Component
 * 
 * Only Dependency: 'three'
 */

const DEFAULT_SURFACE_TEXT = "THE SURFACE IS CALM";
const DEFAULT_HIDDEN_TEXT  = "THE CURRENT RUNS DEEP";

const SURFACE_IMAGE_URL = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop";
const HIDDEN_IMAGE_URL  = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2000&auto=format&fit=crop";

export default function LensHero({
  surfaceText = DEFAULT_SURFACE_TEXT,
  hiddenText = DEFAULT_HIDDEN_TEXT,
  isCard: initialIsCard = false,
  surfaceImage = SURFACE_IMAGE_URL,
  hiddenImage = HIDDEN_IMAGE_URL,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Physics & Animation state refs
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const lensPosRef = useRef({ x: 0.5, y: 0.5 });
  const velRef = useRef({ x: 0, y: 0 });
  const isPointerOverRef = useRef(false);

  // Texture refs for dynamic updates
  const surfaceTextureRef = useRef(null);
  const hiddenTextureRef = useRef(null);

  // Component UI State
  const [isCardMode, setIsCardMode] = useState(initialIsCard);
  const [lensRadius, setLensRadius] = useState(0.22);
  const [customSurfaceText, setCustomSurfaceText] = useState(surfaceText);
  const [customHiddenText, setCustomHiddenText] = useState(hiddenText);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  // Check URL query param for ?card
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('card')) {
        setIsCardMode(true);
      }
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Offscreen Canvases Setup
    const surfaceCanvas = document.createElement('canvas');
    const hiddenCanvas = document.createElement('canvas');
    const ctxSurface = surfaceCanvas.getContext('2d');
    const ctxHidden = hiddenCanvas.getContext('2d');

    let imgSurfaceLoaded = false;
    let imgHiddenLoaded = false;
    const imgSurface = new Image();
    const imgHidden = new Image();
    imgSurface.crossOrigin = 'anonymous';
    imgHidden.crossOrigin = 'anonymous';

    // Procedural Fallback Ocean Surface (Graphite / Cool)
    const drawProceduralSurface = (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0c1013');
      grad.addColorStop(0.4, '#12191d');
      grad.addColorStop(0.8, '#0b1114');
      grad.addColorStop(1, '#050709');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 12) {
        ctx.beginPath();
        for (let x = 0; x < w; x += 20) {
          const waveY = y + Math.sin(x * 0.02 + y * 0.01) * 4;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    // Procedural Fallback Hidden Layer (Vivid Turquoise / Sunbeams)
    const drawProceduralHidden = (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.1, w * 0.5, h * 0.5, w * 0.8);
      grad.addColorStop(0, '#00f2fe');
      grad.addColorStop(0.35, '#4facfe');
      grad.addColorStop(0.7, '#0052d4');
      grad.addColorStop(1, '#001a40');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const beamGrad = ctx.createLinearGradient(0, 0, w, h);
      beamGrad.addColorStop(0, 'rgba(255, 220, 150, 0.35)');
      beamGrad.addColorStop(0.5, 'rgba(0, 255, 220, 0.2)');
      beamGrad.addColorStop(1, 'rgba(0, 50, 120, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, 0);
      ctx.lineTo(w * 0.8, 0);
      ctx.lineTo(w * 0.9, h);
      ctx.lineTo(w * 0.1, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Headline Drawer (Identical metrics for word swap)
    const drawHeadline = (ctx, text, width, height, isHidden) => {
      ctx.save();
      const fontSize = Math.max(32, Math.min(110, width * 0.062));
      ctx.font = `800 ${fontSize}px "Bricolage Grotesque", "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const cx = width / 2;
      const cy = height / 2;

      if (isHidden) {
        ctx.shadowColor = 'rgba(0, 242, 254, 0.85)';
        ctx.shadowBlur = fontSize * 0.35;
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = fontSize * 0.25;
        ctx.fillStyle = '#e2e8f0';
      }

      ctx.fillText(text.toUpperCase(), cx, cy);
      ctx.shadowBlur = 0;
      ctx.fillText(text.toUpperCase(), cx, cy);
      ctx.restore();
    };

    const renderOffscreenCanvases = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      surfaceCanvas.width = Math.floor(w * dpr);
      surfaceCanvas.height = Math.floor(h * dpr);
      hiddenCanvas.width = Math.floor(w * dpr);
      hiddenCanvas.height = Math.floor(h * dpr);

      const sw = surfaceCanvas.width;
      const sh = surfaceCanvas.height;

      // --- SURFACE CANVAS ---
      ctxSurface.save();
      if (imgSurfaceLoaded) {
        const imgRatio = imgSurface.width / imgSurface.height;
        const canvasRatio = sw / sh;
        let dw = sw, dh = sh, dx = 0, dy = 0;
        if (canvasRatio > imgRatio) {
          dh = sw / imgRatio;
          dy = (sh - dh) / 2;
        } else {
          dw = sh * imgRatio;
          dx = (sw - dw) / 2;
        }
        ctxSurface.drawImage(imgSurface, dx, dy, dw, dh);
      } else {
        drawProceduralSurface(ctxSurface, sw, sh);
      }

      // Cool tone wash
      ctxSurface.save();
      ctxSurface.globalCompositeOperation = 'color';
      ctxSurface.fillStyle = '#4a5568';
      ctxSurface.fillRect(0, 0, sw, sh);
      ctxSurface.restore();

      // Graphite multiply wash
      ctxSurface.save();
      ctxSurface.globalCompositeOperation = 'multiply';
      ctxSurface.fillStyle = 'rgba(15, 20, 25, 0.65)';
      ctxSurface.fillRect(0, 0, sw, sh);
      ctxSurface.restore();

      // Scrim gradients
      const scrimGrad = ctxSurface.createLinearGradient(0, 0, 0, sh);
      scrimGrad.addColorStop(0, 'rgba(5, 8, 10, 0.7)');
      scrimGrad.addColorStop(0.18, 'rgba(5, 8, 10, 0.0)');
      scrimGrad.addColorStop(0.82, 'rgba(5, 8, 10, 0.0)');
      scrimGrad.addColorStop(1, 'rgba(5, 8, 10, 0.75)');
      ctxSurface.fillStyle = scrimGrad;
      ctxSurface.fillRect(0, 0, sw, sh);

      drawHeadline(ctxSurface, customSurfaceText, sw, sh, false);
      ctxSurface.restore();

      // --- HIDDEN CANVAS ---
      ctxHidden.save();
      if (imgHiddenLoaded) {
        const imgRatio = imgHidden.width / imgHidden.height;
        const canvasRatio = sw / sh;
        let dw = sw, dh = sh, dx = 0, dy = 0;
        if (canvasRatio > imgRatio) {
          dh = sw / imgRatio;
          dy = (sh - dh) / 2;
        } else {
          dw = sh * imgRatio;
          dx = (sw - dw) / 2;
        }
        ctxHidden.drawImage(imgHidden, dx, dy, dw, dh);
      } else {
        drawProceduralHidden(ctxHidden, sw, sh);
      }

      // Warm vivid overlay
      ctxHidden.save();
      ctxHidden.globalCompositeOperation = 'overlay';
      const warmGrad = ctxHidden.createLinearGradient(0, 0, sw, sh);
      warmGrad.addColorStop(0, 'rgba(255, 180, 80, 0.3)');
      warmGrad.addColorStop(1, 'rgba(0, 240, 255, 0.25)');
      ctxHidden.fillStyle = warmGrad;
      ctxHidden.fillRect(0, 0, sw, sh);
      ctxHidden.restore();

      drawHeadline(ctxHidden, customHiddenText, sw, sh, true);
      ctxHidden.restore();

      if (surfaceTextureRef.current) surfaceTextureRef.current.needsUpdate = true;
      if (hiddenTextureRef.current) hiddenTextureRef.current.needsUpdate = true;
    };

    // Image loading
    imgSurface.src = surfaceImage;
    imgSurface.onload = () => { imgSurfaceLoaded = true; renderOffscreenCanvases(); };
    imgHidden.src = hiddenImage;
    imgHidden.onload = () => { imgHiddenLoaded = true; renderOffscreenCanvases(); };

    if (document.fonts) {
      document.fonts.ready.then(() => renderOffscreenCanvases());
    }

    renderOffscreenCanvases();

    // 2. Three.js Scene Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    const surfaceTexture = new THREE.CanvasTexture(surfaceCanvas);
    const hiddenTexture = new THREE.CanvasTexture(hiddenCanvas);
    surfaceTexture.minFilter = THREE.LinearFilter;
    hiddenTexture.minFilter = THREE.LinearFilter;

    surfaceTextureRef.current = surfaceTexture;
    hiddenTextureRef.current = hiddenTexture;

    // GLSL Refraction Shader
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;

      uniform sampler2D uSurface;
      uniform sampler2D uHidden;
      uniform vec2 uLensPos;
      uniform float uLensRadius;
      uniform float uAspect;
      uniform float uTime;
      uniform float uFeather;
      uniform float uCaStrength;

      varying vec2 vUv;

      void main() {
        // Aspect corrected distance for round lens
        vec2 d = vUv - uLensPos;
        vec2 aspectD = vec2(d.x * uAspect, d.y);
        float dist = length(aspectD);

        // Radius breathing (+/- 1.2%)
        float r = uLensRadius * (1.0 + 0.012 * sin(uTime * 2.5));

        // Soft outer contact drop-shadow
        float shadowOuter = r + 0.08;
        float shadowMask = smoothstep(r, r + 0.01, dist) * (1.0 - smoothstep(r + 0.01, shadowOuter, dist));
        float shadow = 1.0 - shadowMask * 0.42;

        vec4 surfaceColor = texture2D(uSurface, vUv) * shadow;

        float mask = 1.0 - smoothstep(r - uFeather, r, dist);

        if (mask <= 0.0001) {
          gl_FragColor = surfaceColor;
          return;
        }

        // Spherical refraction math
        float t = clamp(dist / r, 0.0, 1.0);
        float z = sqrt(max(0.0, 1.0 - t * t));

        vec2 rel = d;
        vec2 sampUv = uLensPos + rel / (1.0 + 0.55 * z);
        sampUv += rel * (1.0 - z) * 0.16;
        sampUv = clamp(sampUv, vec2(0.001), vec2(0.999));

        // Chromatic Aberration near rim
        vec2 caDir = (dist > 0.0001) ? normalize(rel) : vec2(0.0);
        vec2 caOffset = caDir * pow(1.0 - z, 2.0) * uCaStrength;

        float rChan = texture2D(uHidden, clamp(sampUv + caOffset, 0.001, 0.999)).r;
        float gChan = texture2D(uHidden, sampUv).g;
        float bChan = texture2D(uHidden, clamp(sampUv - caOffset, 0.001, 0.999)).b;
        float aChan = texture2D(uHidden, sampUv).a;

        vec4 hiddenColor = vec4(rChan, gChan, bChan, aChan);

        // Specular Glint & Meniscus Ring
        vec2 glintDir = normalize(vec2(-0.707, 0.707));
        float glintAlign = max(0.0, dot(caDir, glintDir));
        float glint = pow(glintAlign, 3.5) * smoothstep(0.6, 0.98, t) * 0.55;

        float meniscus = smoothstep(0.92, 0.97, t) * (1.0 - smoothstep(0.97, 0.998, t)) * 0.45;

        vec3 rimHighlights = vec3(1.0) * (glint + meniscus);
        vec3 lensColor = hiddenColor.rgb + rimHighlights;

        vec3 finalColor = mix(surfaceColor.rgb, lensColor, mask);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSurface: { value: surfaceTexture },
        uHidden: { value: hiddenTexture },
        uLensPos: { value: new THREE.Vector2(0.5, 0.5) },
        uLensRadius: { value: lensRadius },
        uAspect: { value: width / height },
        uTime: { value: 0 },
        uFeather: { value: 0.008 },
        uCaStrength: { value: 0.014 },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    if (prefersReducedMotion) {
      lensPosRef.current = { x: 0.5, y: 0.35 };
      material.uniforms.uLensPos.value.set(0.5, 0.35);
      material.uniforms.uTime.value = 0;
      renderer.render(scene, camera);
    } else {
      let animationFrameId;
      const startTime = performance.now();

      const animate = () => {
        const now = performance.now();
        const elapsedTime = (now - startTime) * 0.001;

        if (isCardMode && !isPointerOverRef.current) {
          targetRef.current.x = 0.5 + 0.30 * Math.sin(elapsedTime * 0.8);
          targetRef.current.y = 0.5 + 0.18 * Math.sin(elapsedTime * 1.7 + 0.6);
        }

        // Spring Inertia: vel = (vel + (target - lens) * 0.16) * 0.74
        const dx = targetRef.current.x - lensPosRef.current.x;
        const dy = targetRef.current.y - lensPosRef.current.y;

        velRef.current.x = (velRef.current.x + dx * 0.16) * 0.74;
        velRef.current.y = (velRef.current.y + dy * 0.16) * 0.74;

        lensPosRef.current.x += velRef.current.x;
        lensPosRef.current.y += velRef.current.y;

        material.uniforms.uLensPos.value.set(lensPosRef.current.x, lensPosRef.current.y);
        material.uniforms.uLensRadius.value = lensRadius;
        material.uniforms.uTime.value = elapsedTime;

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);

      container._cleanupAnim = () => cancelAnimationFrame(animationFrameId);
    }

    // Pointer Events
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;

      targetRef.current.x = Math.max(0, Math.min(1, x));
      targetRef.current.y = Math.max(0, Math.min(1, y));
      isPointerOverRef.current = true;
    };

    const handlePointerLeave = () => {
      isPointerOverRef.current = false;
      if (!isCardMode) {
        targetRef.current.x = 0.5;
        targetRef.current.y = 0.38;
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      material.uniforms.uAspect.value = w / h;

      renderOffscreenCanvases();
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);
    container.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) handlePointerMove(e.touches[0]);
    }, { passive: true });
    container.addEventListener('touchend', handlePointerLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) {
        container.removeEventListener('mousemove', handlePointerMove);
        container.removeEventListener('mouseleave', handlePointerLeave);
        if (container._cleanupAnim) container._cleanupAnim();
      }
      geometry.dispose();
      material.dispose();
      surfaceTexture.dispose();
      hiddenTexture.dispose();
      renderer.dispose();
    };
  }, [isCardMode, lensRadius, customSurfaceText, customHiddenText, surfaceImage, hiddenImage]);

  return (
    <div className="lens-stage-root" ref={containerRef}>
      {/* Injected CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .lens-stage-root {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: #080a0c;
          cursor: none;
          user-select: none;
          -webkit-user-select: none;
          font-family: 'IBM Plex Mono', monospace;
        }

        .lens-webgl-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .lens-chrome-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.2rem 3rem;
          color: #ffffff;
          mix-blend-mode: difference;
          z-index: 10;
        }

        .lens-chrome-top,
        .lens-chrome-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
          opacity: 0.9;
        }

        .lens-brand-mark {
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.05em;
        }

        .lens-status-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
        }

        .lens-status-dot {
          width: 6px;
          height: 6px;
          background-color: #00f2fe;
          border-radius: 50%;
          box-shadow: 0 0 8px #00f2fe;
        }

        .lens-hint-text {
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.8);
        }

        .lens-control-pill {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          background: rgba(12, 16, 22, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 0.4rem 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lens-control-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.75);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.4rem 0.8rem;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .lens-control-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .lens-control-btn.active {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-weight: 600;
        }

        .lens-expanded-panel {
          position: absolute;
          bottom: 5.2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 25;
          width: 380px;
          max-width: 90vw;
          background: rgba(10, 14, 18, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          color: #e2e8f0;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .lens-panel-row {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .lens-panel-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.6);
        }

        .lens-panel-input {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          color: #ffffff;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .lens-panel-input:focus {
          border-color: #00f2fe;
        }

        .lens-panel-range {
          accent-color: #00f2fe;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .lens-chrome-overlay {
            padding: 1.5rem 1.5rem;
          }
          .lens-brand-mark {
            font-size: 0.95rem;
          }
          .lens-chrome-top, .lens-chrome-bottom {
            font-size: 0.75rem;
          }
        }
      `}</style>

      {/* Main WebGL Stage Canvas */}
      <canvas ref={canvasRef} className="lens-webgl-canvas" />

      {/* Editorial Overlay Chrome UI */}
      <div className="lens-chrome-overlay">
        <div className="lens-chrome-top">
          <span className="lens-brand-mark">Kexsio®</span>
          <div className="lens-status-tag">
            <span className="lens-status-dot"></span>
            <span>Lens · Refraction</span>
          </div>
        </div>

        <div className="lens-chrome-bottom">
          <span className="lens-hint-text">
            {isCardMode ? 'Lissajous Auto-Roam Active' : 'Drag the glass — read beneath'}
          </span>
          <span>Refraction / 04</span>
        </div>
      </div>

      {/* Floating Interactive Controls Drawer */}
      <div className="lens-control-pill">
        <button
          className={`lens-control-btn ${isCardMode ? 'active' : ''}`}
          onClick={() => setIsCardMode(!isCardMode)}
        >
          {isCardMode ? '● Auto-Roam' : '○ Manual Drag'}
        </button>

        <button
          className={`lens-control-btn ${isControlsOpen ? 'active' : ''}`}
          onClick={() => setIsControlsOpen(!isControlsOpen)}
        >
          ⚙ Settings
        </button>
      </div>

      {/* Settings Modal */}
      {isControlsOpen && (
        <div className="lens-expanded-panel">
          <div className="lens-panel-row">
            <label className="lens-panel-label">Surface Headline (Cool / Calm)</label>
            <input
              type="text"
              className="lens-panel-input"
              value={customSurfaceText}
              onChange={(e) => setCustomSurfaceText(e.target.value)}
            />
          </div>

          <div className="lens-panel-row">
            <label className="lens-panel-label">Hidden Headline (Vivid / Deep)</label>
            <input
              type="text"
              className="lens-panel-input"
              value={customHiddenText}
              onChange={(e) => setCustomHiddenText(e.target.value)}
            />
          </div>

          <div className="lens-panel-row">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="lens-panel-label">Lens Glass Size</label>
              <span style={{ fontSize: '0.75rem', color: '#00f2fe' }}>
                {Math.round(lensRadius * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.38"
              step="0.01"
              className="lens-panel-range"
              value={lensRadius}
              onChange={(e) => setLensRadius(parseFloat(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const TRACK_W = 300;
const TRACK_H = 92;
const KNOB = 122;
const OVERHANG = 15;
const KNOB_X_LIGHT = -OVERHANG;
const KNOB_X_DARK = TRACK_W - KNOB + OVERHANG;

const DWELL = 1900;
const SLIDE = 620;

const css = `
@property --p{
  syntax:"<number>";
  inherits:true;
  initial-value:0;
}

.gt-root{
  position:relative;
  width:100%;
  min-height:310px;
  border-radius:20px;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  font-family:'Inter', system-ui, sans-serif;
  isolation:isolate;
  transition:--p ${SLIDE}ms cubic-bezier(.66,0,.2,1);
}
.gt-root[data-dragging="true"]{transition:none;}

.gt-bg{position:absolute;inset:0;z-index:0;}
.gt-bg--dark{
  opacity:1;
  background:radial-gradient(125% 100% at 50% 38%,#28282e 0%,#19191d 44%,#101013 72%,#0a0a0c 100%);
}
.gt-bg--light{
  opacity:var(--p);
  background:radial-gradient(125% 100% at 50% 38%,#a0a0a4 0%,#909094 44%,#828287 72%,#787880 100%);
}

.gt-stage{
  position:relative;z-index:2;
  display:flex;flex-direction:column;align-items:center;
  gap:18px;
  padding:22px 16px 64px;
}
.gt-title{display:flex;flex-direction:column;align-items:center;text-align:center;}
.gt-kicker{
  font-weight:700;
  font-size:11px;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:rgba(255,255,255,.9);
  transition:color .55s ease;
}
.gt-headline{
  margin:2px 0 0;
  font-weight:800;
  font-size:clamp(22px,3.8vw,30px);
  line-height:1;
  letter-spacing:-.025em;
  color:rgba(255,255,255,.95);
  text-shadow:0 1px 1px rgba(0,0,0,.25),0 4px 25px rgba(255,255,255,.18);
  transition:color .55s ease,text-shadow .55s ease;
}
.gt-root[data-theme="light"] .gt-headline{
  color:rgba(255,255,255,.98);
  text-shadow:0 1px 2px rgba(0,0,0,.12),0 6px 30px rgba(255,255,255,.4);
}

.gt-toggle{
  position:relative;
  width:${TRACK_W}px;height:${TRACK_H}px;
  border:0;background:transparent;padding:0;margin:0;
  cursor:grab;
  touch-action:none;
  overflow:visible;
  transform:scale(0.85);
  transform-origin:center center;
  -webkit-tap-highlight-color:transparent;
}
.gt-root[data-dragging="true"] .gt-toggle{cursor:grabbing;}
.gt-toggle:focus-visible{outline:none;}
.gt-toggle:focus-visible .gt-track{
  box-shadow:0 0 0 3px rgba(255,255,255,.6),0 22px 45px rgba(0,0,0,.3);
}

.gt-track{
  position:absolute;inset:0;
  border-radius:999px;
  transition:filter .25s ease;
}
.gt-track-face{
  position:absolute;inset:0;border-radius:inherit;pointer-events:none;
}
.gt-track-face--dark{
  opacity:calc(1 - var(--p));
  background:linear-gradient(180deg,rgba(30,30,34,1) 0%,rgba(20,20,23,1) 100%);
  border:1.5px solid rgba(255,255,255,.06);
  box-shadow:
    0 20px 50px rgba(0,0,0,.55),
    0 6px 16px rgba(0,0,0,.35),
    inset 0 1px 1px rgba(255,255,255,.07),
    inset 0 -2px 6px rgba(0,0,0,.5);
}
.gt-track-face--light{
  opacity:var(--p);
  background:linear-gradient(180deg,rgba(185,185,190,.65) 0%,rgba(160,160,166,.7) 100%);
  border:1.5px solid rgba(255,255,255,.3);
  box-shadow:
    0 20px 50px rgba(0,0,0,.18),
    0 6px 16px rgba(0,0,0,.08),
    inset 0 1px 2px rgba(255,255,255,.55),
    inset 0 -2px 6px rgba(0,0,0,.08);
}

.gt-label{
  position:absolute;top:50%;transform:translateY(-50%);
  font-weight:700;
  font-size:30px;
  letter-spacing:-.01em;
  transition:filter .3s ease;
  pointer-events:none;
  text-shadow:0 1px 3px rgba(0,0,0,.15);
}
.gt-label--dark{left:42px;color:rgba(160,160,168,.9);opacity:calc(1 - var(--p));}
.gt-label--light{right:40px;color:rgba(255,255,255,.92);opacity:var(--p);}
.gt-root[data-morph="true"] .gt-label{filter:blur(3.6px);opacity:.55;}
.gt-root[data-morph="true"] .gt-track{filter:blur(1.5px);}

.gt-knob{
  position:absolute;left:0;top:50%;
  width:${KNOB}px;height:${KNOB}px;
  margin-top:${-KNOB / 2}px;
  transform:translateX(calc(${KNOB_X_DARK}px - ${KNOB_X_DARK - KNOB_X_LIGHT}px * var(--p)));
  will-change:transform;
}

.gt-knob-glass{
  position:absolute;inset:0;
  border-radius:50%;
  overflow:hidden;
  display:grid;place-items:center;
  background:transparent;
  -webkit-backdrop-filter:blur(8px) saturate(160%) brightness(1.04);
  backdrop-filter:blur(8px) saturate(160%) brightness(1.04);
  border:1px solid rgba(255,255,255,.18);
  transition:transform .4s ease,filter .3s ease,box-shadow .5s ease,border-color .5s ease;
}

.gt-knob-glass::before{
  content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:4;
  box-shadow:
    inset 0 2px 4px rgba(255,255,255,.18),
    inset 0 -3px 8px rgba(0,0,0,.12);
}

.gt-knob-bar{
  position:absolute;z-index:1;pointer-events:none;
  top:${(KNOB - TRACK_H) / 2}px;
  left:calc(${-KNOB_X_DARK}px + ${KNOB_X_DARK - KNOB_X_LIGHT}px * var(--p));
  width:${TRACK_W}px;height:${TRACK_H}px;
  border-radius:999px;
  box-shadow:
    inset 0 0 0 1.5px rgba(255,255,255,.5),
    inset 0 2px 3px rgba(255,255,255,.4),
    inset 0 -3px 6px rgba(0,0,0,.28);
}

.gt-knob-glass::after{
  content:"";position:absolute;left:10%;right:30%;top:6%;height:40%;
  border-radius:50%;
  filter:blur(4px);pointer-events:none;z-index:2;
  transition:background .55s ease;
}

.gt-root[data-theme="dark"] .gt-knob-glass{
  border-color:rgba(255,255,255,.1);
  box-shadow:
    0 16px 40px rgba(0,0,0,.5),
    0 5px 12px rgba(0,0,0,.35),
    inset 0 0 16px rgba(255,255,255,.03);
}
.gt-root[data-theme="dark"] .gt-knob-glass::after{
  background:radial-gradient(100% 100% at 35% 0%,rgba(255,255,255,.18),rgba(255,255,255,0) 65%);
}

.gt-root[data-theme="light"] .gt-knob-glass{
  border-color:rgba(255,255,255,.28);
  box-shadow:
    0 16px 40px rgba(0,0,0,.12),
    0 5px 12px rgba(0,0,0,.06),
    inset 0 0 20px rgba(255,255,255,.08);
}
.gt-root[data-theme="light"] .gt-knob-glass::after{
  background:radial-gradient(100% 100% at 35% 0%,rgba(255,255,255,.45),rgba(255,255,255,0) 65%);
}

.gt-root[data-morph="true"] .gt-knob-glass{transform:scale(1.06);filter:blur(1px);}

.gt-icons{position:absolute;inset:0;display:grid;place-items:center;z-index:2;}
.gt-icon{position:absolute;width:40px;height:40px;color:#fff;}
.gt-sun{opacity:var(--p);}
.gt-moon{opacity:calc(1 - var(--p));filter:drop-shadow(0 0 7px rgba(255,255,255,.45));}

.gt-footer{
  position:absolute;left:50%;bottom:12px;z-index:3;
  transform:translateX(-50%);
  width:min(440px,92%);height:38px;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 12px 0 6px;
  border-radius:999px;
  -webkit-backdrop-filter:blur(10px);
  backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.1);
  transition:background .55s ease,border-color .55s ease,color .55s ease;
  font-size:11px;font-weight:500;
}
.gt-root[data-theme="dark"] .gt-footer{background:rgba(255,255,255,.06);color:rgba(255,255,255,.82);}
.gt-root[data-theme="light"] .gt-footer{background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.5);color:rgba(255,255,255,.96);}
.gt-footer-left{display:flex;align-items:center;gap:8px;}
.gt-footer-badge{
  display:grid;place-items:center;
  width:26px;height:26px;border-radius:999px;
  background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.18);
}
.gt-root[data-theme="light"] .gt-footer-badge{background:rgba(255,255,255,.35);border-color:rgba(255,255,255,.6);}
.gt-footer-right{opacity:.92;font-size:10px;}

@media (max-width:560px){
  .gt-toggle{transform:scale(.76); transform-origin: center right;}
  .gt-footer{font-size:10px;height:34px; width: 100%;}
  .gt-footer-right{font-size:9px;}
}

@media (prefers-reduced-motion: reduce){
  .gt-root,.gt-root *{transition-duration:.001ms !important;}
}
`;

function SunIcon() {
  return (
    <svg className="gt-icon gt-sun" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="12" y1="1.5" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.5" />
        <line x1="1.5" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22.5" y2="12" />
        <line x1="4.4" y1="4.4" x2="6.2" y2="6.2" />
        <line x1="17.8" y1="17.8" x2="19.6" y2="19.6" />
        <line x1="4.4" y1="19.6" x2="6.2" y2="17.8" />
        <line x1="17.8" y1="6.2" x2="19.6" y2="4.4" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="gt-icon gt-moon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

const CENTER_DARK = (KNOB_X_DARK + KNOB / 2) / TRACK_W;
const CENTER_LIGHT = (KNOB_X_LIGHT + KNOB / 2) / TRACK_W;

export default function GlassToggleLoop() {
  const { theme, p: globalP, setP: setGlobalP, setTheme } = useTheme();

  // Local state for animation interpolation
  const [p, setP] = useState(globalP);
  const [morph, setMorph] = useState(false);

  const rootRef = useRef(null);
  const pRef = useRef(globalP);
  const morphTimer = useRef(null);
  const drag = useRef(null);

  // Sync with global theme updates
  useEffect(() => {
    setP(globalP);
    pRef.current = globalP;
    const el = rootRef.current;
    if (el) {
      el.style.setProperty("--p", String(globalP));
      el.setAttribute("data-theme", globalP < 0.5 ? "dark" : "light");
    }
  }, [globalP]);

  const setProgress = useCallback((value, commit) => {
    const v = value < 0 ? 0 : value > 1 ? 1 : value;
    pRef.current = v;
    const el = rootRef.current;
    if (el) {
      el.style.setProperty("--p", String(v));
      el.setAttribute("data-theme", v < 0.5 ? "dark" : "light");
    }
    
    // Broadcast to global theme
    setGlobalP(v, commit);
    if (commit) {
      setP(v);
    }
  }, [setGlobalP]);

  const animateTo = useCallback((target) => {
      setMorph(true);
      if (morphTimer.current) clearTimeout(morphTimer.current);
      morphTimer.current = setTimeout(() => setMorph(false), SLIDE / 2);
      
      setProgress(target, true);
    },
    [setProgress]
  );

  useEffect(() => {
    return () => {
      if (morphTimer.current) clearTimeout(morphTimer.current);
    };
  }, []);

  const progressFromClientX = (clientX, offset) => {
    const track = rootRef.current?.querySelector(".gt-track");
    if (!track) return pRef.current;
    const rect = track.getBoundingClientRect();
    const knobCenter = (clientX - rect.left) / rect.width - offset;
    return (CENTER_DARK - knobCenter) / (CENTER_DARK - CENTER_LIGHT);
  };

  const onPointerDown = (e) => {
    rootRef.current?.setAttribute("data-dragging", "true");

    const track = rootRef.current?.querySelector(".gt-track");
    const rect = track?.getBoundingClientRect();
    const relFrac = rect ? (e.clientX - rect.left) / rect.width : 0;
    const knobCenter = CENTER_DARK + (CENTER_LIGHT - CENTER_DARK) * pRef.current;
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      offset: relFrac - knobCenter,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { }
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (Math.abs(e.clientX - d.startX) > 3) d.moved = true;
    setProgress(progressFromClientX(e.clientX, d.offset), false);
  };

  const endDrag = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    rootRef.current?.setAttribute("data-dragging", "false");
    
    if (d.moved) {
      // Snap to closest position
      const snap = pRef.current >= 0.5 ? 1 : 0;
      animateTo(snap);
    } else {
      // Tap toggle = flip to opposite
      animateTo(pRef.current < 0.5 ? 1 : 0);
    }
  };

  const onKeyDown = (e) => {
    let next = pRef.current;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = 1;
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") next = 0;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 1;
    else return;
    e.preventDefault();
    animateTo(next);
  };

  const valueNow = Math.round(p * 100);

  return (
    <section
      ref={rootRef}
      className="gt-root"
      data-theme={p < 0.5 ? "dark" : "light"}
      data-morph={morph ? "true" : "false"}
      style={{ "--p": p }}
      aria-label="Liquid Glass Theme Toggle"
    >
      <style>{css}</style>

      <div className="gt-bg gt-bg--dark" aria-hidden="true" />
      <div className="gt-bg gt-bg--light" aria-hidden="true" />

      <div className="gt-stage">
        <div className="gt-title">
          <span className="gt-kicker">Interactive System Appearance</span>
          <h2 className="gt-headline">Theme Preferences</h2>
        </div>

        <button
          type="button"
          className="gt-toggle"
          role="slider"
          aria-label="Drag or click to switch between Dark and Light mode across FlowLink"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={valueNow}
          aria-valuetext={`${valueNow}% light`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        >
          <span className="gt-track">
            <span className="gt-track-face gt-track-face--dark" aria-hidden="true" />
            <span className="gt-track-face gt-track-face--light" aria-hidden="true" />
            <span className="gt-label gt-label--dark">Dark</span>
            <span className="gt-label gt-label--light">Light</span>
          </span>

          <span className="gt-knob">
            <span className="gt-knob-glass">
              <span className="gt-knob-bar" aria-hidden="true" />
              <span className="gt-icons">
                <SunIcon />
                <MoonIcon />
              </span>
            </span>
          </span>
        </button>
      </div>

      <div className="gt-footer">
        <span className="gt-footer-left">
          <span className="gt-footer-badge">
            <LinkIcon />
          </span>
          FlowLink
        </span>
        <span className="gt-footer-right">Logistics Platform Theme</span>
      </div>
    </section>
  );
}

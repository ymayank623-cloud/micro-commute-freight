import React, {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";

function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 4.5,
  delay = 0,
  pathColor = "rgba(255,255,255,0.14)",
  pathWidth = 2,
  pathOpacity = 1,
  gradientStartColor = "#00F0FF",
  gradientStopColor = "#8A2BE2",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) {
  const rawId = useId();
  const gradientId = rawId.replace(/:/g, "");

  const [path, setPath] = useState("");
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updatePath = () => {
      const container = containerRef.current;
      const from = fromRef.current;
      const to = toRef.current;

      if (!container || !from || !to) return;

      const containerRect = container.getBoundingClientRect();
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();

      const width = containerRect.width;
      const height = containerRect.height;

      const startX =
        fromRect.left -
        containerRect.left +
        fromRect.width / 2 +
        startXOffset;

      const startY =
        fromRect.top -
        containerRect.top +
        fromRect.height / 2 +
        startYOffset;

      const endX =
        toRect.left -
        containerRect.left +
        toRect.width / 2 +
        endXOffset;

      const endY =
        toRect.top -
        containerRect.top +
        toRect.height / 2 +
        endYOffset;

      const controlX = (startX + endX) / 2;
      const controlY = startY - curvature;

      setDimensions({ width, height });

      setPath(
        `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`,
      );
    };

    const observer = new ResizeObserver(updatePath);

    const elements = [
      containerRef.current,
      fromRef.current,
      toRef.current,
    ];

    elements.forEach((element) => {
      if (element) observer.observe(element);
    });

    updatePath();
    window.addEventListener("resize", updatePath);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePath);
    };
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ]);

  const animationCoordinates = reverse
    ? {
        x1: ["110%", "-20%"],
        x2: ["120%", "-10%"],
      }
    : {
        x1: ["-20%", "110%"],
        x2: ["-10%", "120%"],
      };

  return (
    <svg
      aria-hidden="true"
      className="kb-beam"
      width={dimensions.width}
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      fill="none"
    >
      <path
        d={path}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />

      <path
        d={path}
        stroke={`url(#${gradientId})`}
        strokeWidth={pathWidth + 0.8}
        strokeLinecap="round"
      />

      <defs>
        <motion.linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: animationCoordinates.x1,
            x2: animationCoordinates.x2,
            y1: ["0%", "0%"],
            y2: ["0%", "0%"],
          }}
          transition={{
            delay,
            duration,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop
            offset="28%"
            stopColor={gradientStartColor}
            stopOpacity="1"
          />
          <stop
            offset="55%"
            stopColor={gradientStopColor}
            stopOpacity="1"
          />
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}

const IntegrationNode = forwardRef(
  ({ icon, name, large = false }, ref) => {
    return (
      <div className="kb-node-wrap">
        <motion.div
          ref={ref}
          className={`kb-node ${large ? "kb-node-large" : ""}`}
          whileHover={{
            scale: 1.09,
            y: -4,
          }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 18,
          }}
        >
          <span className="kb-node-shine" />
          <div className="kb-icon">{icon}</div>
        </motion.div>

        <span className="kb-node-name">{name}</span>
      </div>
    );
  },
);

IntegrationNode.displayName = "IntegrationNode";

function MapsIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <defs>
        <linearGradient id="maps-pin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EA4335" />
          <stop offset="100%" stopColor="#FBBC04" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="rgba(234, 67, 53, 0.15)" />
      <path
        d="M32 10C22.06 10 14 18.06 14 28c0 13.25 18 26 18 26s18-12.75 18-26c0-9.94-8.06-18-18-18z"
        fill="url(#maps-pin-grad)"
      />
      <circle cx="32" cy="27" r="7" fill="#FFFFFF" />
    </svg>
  );
}

function ShopifyIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <defs>
        <linearGradient id="shop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#95BF47" />
          <stop offset="100%" stopColor="#5E8E3E" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#shop-grad)" />
      <path
        d="M40 22h-4c0-4.42-3.58-8-8-8s-8 3.58-8 8h-4c-2.2 0-4 1.8-4 4l3 22c.28 2.05 2.03 3.6 4.1 3.6h21.8c2.07 0 3.82-1.55 4.1-3.6l3-22c0-2.2-1.8-4-4-4zm-12-4c2.21 0 4 1.79 4 4h-8c0-2.21 1.79-4 4-4z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="#25d366" />
      <path
        d="M19 49l3-9a18 18 0 1 1 7 6z"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 23c1-1 3 0 4 3l1 3c0 1-1 2-2 3 2 4 5 7 9 9 1-1 2-3 3-3l4 2c2 1 2 3 1 5-2 3-5 4-8 3-8-2-17-11-20-19-1-3 0-5 2-7 2-1 4-1 6 1z"
        fill="#fff"
      />
    </svg>
  );
}

function StripeIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <defs>
        <linearGradient id="stripe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#635BFF" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#stripe-grad)" />
      <path
        d="M28 26.5c0-1.8 1.5-2.5 4-2.5 3.5 0 8 1.1 11.5 3V17c-4-1.6-8.2-2.2-12-2.2-9.6 0-16 5-16 13.5 0 13.2 18.2 11 18.2 16.7 0 2.2-1.9 3-4.6 3-4.1 0-9.3-1.7-13.4-3.9v10.1c4.5 2 9.2 2.9 13.7 2.9 10 0 16.8-4.9 16.8-13.7 0-14.3-18.2-11.9-18.2-16.9z"
        fill="#fff"
      />
    </svg>
  );
}

function DispatchAIIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <defs>
        <linearGradient id="ai-chip-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#8A2BE2" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="44" height="44" rx="12" fill="url(#ai-chip-grad)" />
      <circle cx="32" cy="32" r="10" fill="#FFFFFF" opacity="0.9" />
      <path d="M32 6v6M32 52v6M6 32h6M52 32h6M14 14l5 5M45 45l5 5M14 50l5-5M45 19l5-5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function TelemetryIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <defs>
        <linearGradient id="tele-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#tele-grad)" />
      <path
        d="M20 44l8-14 8 8 10-16M46 22h-8M46 22v8"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowLinkCenterIcon() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '32px', filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.8))' }}>🚚</span>
      <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', color: '#FFFFFF', marginTop: '2px', textShadow: '0 0 8px rgba(0,240,255,0.6)' }}>FLOWLINK</span>
    </div>
  );
}

export default function FlowLinkNetwork({
  titlePrefix = "Everything connects to",
  titleGradient = "one intelligent logistics core.",
  subtitle = "Information, real-time telemetry, and micro-commute freight move smoothly across your supply network.",
  statusText = "All supply chain networks synchronized",
  compact = false,
}) {
  const containerRef = useRef(null);

  const mapsRef = useRef(null);
  const shopifyRef = useRef(null);
  const whatsappRef = useRef(null);

  const centerRef = useRef(null);

  const stripeRef = useRef(null);
  const dispatchRef = useRef(null);
  const telemetryRef = useRef(null);

  return (
    <div className={`kb-page-wrapper ${compact ? 'kb-compact' : ''}`}>
      <style>{`
        .kb-page-wrapper {
          position: relative;
          width: 100%;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          background: transparent;
          user-select: none;
        }

        .kb-card-canvas {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .kb-orb {
          position: absolute;
          width: min(44vw, 440px);
          aspect-ratio: 1;
          left: 50%;
          top: 56%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          pointer-events: none;
          filter: blur(28px);
          background: radial-gradient(
            circle,
            rgba(0, 240, 255, 0.18),
            rgba(138, 43, 226, 0.08) 45%,
            transparent 72%
          );
          animation: kb-pulse 5s ease-in-out infinite;
        }

        .kb-header {
          position: relative;
          z-index: 5;
          width: min(680px, calc(100% - 30px));
          margin: 0 auto;
          text-align: center;
          padding-top: 10px;
        }

        .kb-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .kb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00F0FF;
          box-shadow: 0 0 12px #00F0FF;
        }

        .kb-title {
          margin: 12px 0 6px;
          font-size: clamp(22px, 3.2vw, 36px);
          line-height: 1.15;
          letter-spacing: -0.04em;
          font-weight: 800;
          color: #FFFFFF !important;
        }

        [data-theme="light"] .kb-title {
          color: #0F172A !important;
        }

        .kb-title span {
          color: transparent;
          background: linear-gradient(
            90deg,
            #ffffff 0%,
            #00F0FF 45%,
            #d6c9ff 80%,
            #ffce9e 100%
          );
          background-clip: text;
          -webkit-background-clip: text;
        }

        [data-theme="light"] .kb-title span {
          background: linear-gradient(
            90deg,
            #0284C7 0%,
            #2563EB 50%,
            #7C3AED 100%
          ) !important;
          background-clip: text !important;
          -webkit-background-clip: text !important;
          color: transparent !important;
        }

        .kb-description {
          max-width: 480px;
          margin: 0 auto;
          color: rgba(255, 255, 255, 0.75) !important;
          font-size: clamp(11px, 1.1vw, 13px);
          line-height: 1.5;
        }

        [data-theme="light"] .kb-description {
          color: #475569 !important;
          font-weight: 500 !important;
        }

        .kb-network {
          position: relative;
          z-index: 3;
          width: min(780px, calc(100% - 30px));
          height: clamp(260px, 42vh, 340px);
          margin: 14px auto 0;
          display: grid;
          grid-template-columns: 1fr 1.1fr 1fr;
          align-items: center;
        }

        .kb-column {
          position: relative;
          z-index: 4;
          height: clamp(200px, 34vh, 280px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .kb-left {
          align-items: flex-start;
        }

        .kb-right {
          align-items: flex-end;
        }

        .kb-center {
          position: relative;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kb-node-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .kb-node {
          position: relative;
          width: clamp(48px, 4.6vw, 60px);
          height: clamp(48px, 4.6vw, 60px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: clamp(14px, 1.5vw, 18px);
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.12),
              rgba(255, 255, 255, 0.03)
            ),
            #0B0E17;
          box-shadow:
            0 16px 35px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          cursor: pointer;
        }

        .kb-node-large {
          width: clamp(74px, 7vw, 92px);
          height: clamp(74px, 7vw, 92px);
          border-radius: clamp(20px, 2vw, 26px);
          background:
            linear-gradient(
              145deg,
              rgba(0, 240, 255, 0.15),
              rgba(138, 43, 226, 0.15)
            ),
            #0D111F;
          box-shadow:
            0 24px 65px rgba(0, 240, 255, 0.35),
            0 0 0 8px rgba(0, 240, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border: 1.5px solid rgba(0, 240, 255, 0.4);
        }

        .kb-node-shine {
          position: absolute;
          width: 90%;
          height: 45%;
          left: 5%;
          top: -18%;
          border-radius: 50%;
          opacity: 0.7;
          filter: blur(12px);
          background: rgba(255, 255, 255, 0.2);
        }

        .kb-icon {
          position: relative;
          z-index: 2;
          width: 58%;
          height: 58%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kb-node-large .kb-icon {
          width: 75%;
          height: 75%;
        }

        .kb-icon svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .kb-node-name {
          color: rgba(255, 255, 255, 0.7);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition:
            color 0.3s ease,
            transform 0.3s ease;
        }

        [data-theme="light"] .kb-node-name {
          color: #334155 !important;
          font-weight: 800 !important;
        }

        [data-theme="light"] .kb-node {
          background: #FFFFFF !important;
          border: 1.5px solid #FFFFFF !important;
          box-shadow: 4px 4px 14px rgba(166, 180, 200, 0.4) !important;
        }

        [data-theme="light"] .kb-node-large {
          background: linear-gradient(145deg, #E0F2FE, #EDE9FE) !important;
          border: 2px solid #38BDF8 !important;
          box-shadow: 6px 6px 20px rgba(56, 189, 248, 0.35) !important;
        }

        .kb-node-wrap:hover .kb-node-name {
          color: #00F0FF;
          transform: translateY(1px);
        }

        [data-theme="light"] .kb-node-wrap:hover .kb-node-name {
          color: #0284C7 !important;
        }

        .kb-beam {
          position: absolute;
          z-index: 1;
          inset: 0;
          overflow: visible;
          pointer-events: none;
          filter: drop-shadow(
            0 0 6px rgba(0, 240, 255, 0.45)
          );
        }

        .kb-status {
          position: relative;
          z-index: 6;
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
          font-weight: 600;
        }

        [data-theme="light"] .kb-status {
          color: #334155 !important;
          font-weight: 700 !important;
        }
          color: rgba(255, 255, 255, 0.55);
          font-size: 11px;
          font-weight: 500;
        }

        .kb-status-light {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 12px #10B981;
          animation: kb-status-pulse 2s ease-in-out infinite;
        }

        @keyframes kb-pulse {
          0%, 100% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(0.95);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }

        @keyframes kb-status-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }

        @media (max-width: 680px) {
          .kb-network {
            grid-template-columns: 1fr 0.9fr 1fr;
          }
          .kb-node-name {
            display: none;
          }
          .kb-title {
            font-size: 22px;
          }
        }
      `}</style>

      <section className="kb-card-canvas">
        <div className="kb-orb" />

        <header className="kb-header">
          <div className="kb-eyebrow">
            <span className="kb-dot" />
            Live Logistics Network
          </div>

          <h2 className="kb-title">
            {titlePrefix}{" "}
            <span>{titleGradient}</span>
          </h2>

          <p className="kb-description">
            {subtitle}
          </p>
        </header>

        <div ref={containerRef} className="kb-network">
          <div className="kb-column kb-left">
            <IntegrationNode
              ref={mapsRef}
              name="Google Maps"
              icon={<MapsIcon />}
            />

            <IntegrationNode
              ref={shopifyRef}
              name="E-Commerce"
              icon={<ShopifyIcon />}
            />

            <IntegrationNode
              ref={whatsappRef}
              name="WhatsApp"
              icon={<WhatsAppIcon />}
            />
          </div>

          <div className="kb-center">
            <IntegrationNode
              ref={centerRef}
              name="FlowLink Hub"
              icon={<FlowLinkCenterIcon />}
              large
            />
          </div>

          <div className="kb-column kb-right">
            <IntegrationNode
              ref={stripeRef}
              name="Payouts"
              icon={<StripeIcon />}
            />

            <IntegrationNode
              ref={dispatchRef}
              name="AI Dispatch"
              icon={<DispatchAIIcon />}
            />

            <IntegrationNode
              ref={telemetryRef}
              name="Live Radar"
              icon={<TelemetryIcon />}
            />
          </div>

          {/* Left-side Beams traveling INWARD to FlowLink Center */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={mapsRef}
            toRef={centerRef}
            curvature={-75}
            endYOffset={-8}
            duration={4.6}
            delay={0}
            gradientStartColor="#EA4335"
            gradientStopColor="#00F0FF"
          />

          <AnimatedBeam
            containerRef={containerRef}
            fromRef={shopifyRef}
            toRef={centerRef}
            duration={3.8}
            delay={0.3}
            gradientStartColor="#95BF47"
            gradientStopColor="#8A2BE2"
          />

          <AnimatedBeam
            containerRef={containerRef}
            fromRef={whatsappRef}
            toRef={centerRef}
            curvature={75}
            endYOffset={8}
            duration={5.0}
            delay={0.6}
            gradientStartColor="#25D366"
            gradientStopColor="#00F0FF"
          />

          {/* Right-side Beams traveling OUTWARD / bidirectional */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={stripeRef}
            toRef={centerRef}
            curvature={-75}
            endYOffset={-8}
            reverse
            duration={4.8}
            delay={0.2}
            gradientStartColor="#635BFF"
            gradientStopColor="#8A2BE2"
          />

          <AnimatedBeam
            containerRef={containerRef}
            fromRef={dispatchRef}
            toRef={centerRef}
            reverse
            duration={4.2}
            delay={0.5}
            gradientStartColor="#00F0FF"
            gradientStopColor="#8A2BE2"
          />

          <AnimatedBeam
            containerRef={containerRef}
            fromRef={telemetryRef}
            toRef={centerRef}
            curvature={75}
            endYOffset={8}
            reverse
            duration={5.2}
            delay={0.8}
            gradientStartColor="#F59E0B"
            gradientStopColor="#00F0FF"
          />
        </div>

        <div className="kb-status">
          <span className="kb-status-light" />
          {statusText}
        </div>
      </section>
    </div>
  );
}

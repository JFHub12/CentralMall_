import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimatedLoaderProps {
  onFinish?: () => void;
  duration?: number; // Duration in ms (default 3200ms)
}

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  onFinish,
  duration = 3200,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) {
        setTimeout(onFinish, 600); // Allow fade-out animation to complete
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#d61428] text-white overflow-hidden select-none"
        >
          {/* Internal CSS for SVG Stroke Animations */}
          <style>{`
            .shopping-loader-svg {
              width: 240px;
              height: 240px;
              filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.75));
            }

            @media (min-width: 768px) {
              .shopping-loader-svg {
                width: 280px;
                height: 280px;
              }
            }

            /* 1. Bag Handle Arc */
            .path-handle {
              stroke-dasharray: 260;
              stroke-dashoffset: 260;
              animation: drawHandle 3.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
            }

            /* 2. Bag Body Rectangle */
            .path-body {
              stroke-dasharray: 720;
              stroke-dashoffset: 720;
              animation: drawBody 3.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
            }

            /* 3. White Inner Arch */
            .path-arch {
              stroke-dasharray: 220;
              stroke-dashoffset: 220;
              animation: drawArch 3.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
            }

            /* 4. Large Sparkle Right */
            .path-sparkle-lg {
              stroke-dasharray: 200;
              stroke-dashoffset: 200;
              animation: drawSparkleLg 3.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
            }

            /* 5. Small Sparkle Left */
            .path-sparkle-sm {
              stroke-dasharray: 120;
              stroke-dashoffset: 120;
              animation: drawSparkleSm 3.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
            }

            /* Keyframes for Seamless Smooth Infinite Loop */
            @keyframes drawHandle {
              0%, 5% { stroke-dashoffset: 260; }
              40% { stroke-dashoffset: 0; }
              65% { stroke-dashoffset: 0; opacity: 1; }
              90% { stroke-dashoffset: -260; opacity: 0.9; }
              100% { stroke-dashoffset: -260; opacity: 0; }
            }

            @keyframes drawBody {
              0%, 12% { stroke-dashoffset: 720; }
              48% { stroke-dashoffset: 0; }
              65% { stroke-dashoffset: 0; opacity: 1; }
              90% { stroke-dashoffset: -720; opacity: 0.9; }
              100% { stroke-dashoffset: -720; opacity: 0; }
            }

            @keyframes drawArch {
              0%, 20% { stroke-dashoffset: 220; }
              55% { stroke-dashoffset: 0; }
              65% { stroke-dashoffset: 0; opacity: 1; }
              90% { stroke-dashoffset: -220; opacity: 0.9; }
              100% { stroke-dashoffset: -220; opacity: 0; }
            }

            @keyframes drawSparkleLg {
              0%, 25% { stroke-dashoffset: 200; transform: scale(0.8); transform-origin: 380px 180px; }
              58% { stroke-dashoffset: 0; transform: scale(1); transform-origin: 380px 180px; }
              65% { stroke-dashoffset: 0; opacity: 1; }
              90% { stroke-dashoffset: -200; opacity: 0.9; }
              100% { stroke-dashoffset: -200; opacity: 0; }
            }

            @keyframes drawSparkleSm {
              0%, 30% { stroke-dashoffset: 120; transform: scale(0.8); transform-origin: 140px 350px; }
              62% { stroke-dashoffset: 0; transform: scale(1); transform-origin: 140px 350px; }
              65% { stroke-dashoffset: 0; opacity: 1; }
              90% { stroke-dashoffset: -120; opacity: 0.9; }
              100% { stroke-dashoffset: -120; opacity: 0; }
            }
          `}</style>

          {/* Animated Background Glow Blobs */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/20 rounded-full blur-3xl pointer-events-none" />

          {/* Main Loader Container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center relative z-10 p-6 text-center"
          >
            {/* SVG Animated Shopping Bag Loader Icon */}
            <div className="relative mb-4 flex items-center justify-center">
              <svg
                className="shopping-loader-svg"
                viewBox="0 0 512 512"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Shopping Bag Handle Arc */}
                <path
                  className="path-handle"
                  d="M 206 206 C 206 100, 306 100, 306 206"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="20"
                  strokeLinecap="round"
                />

                {/* Shopping Bag Main Rectangular Body */}
                <rect
                  className="path-body"
                  x="160"
                  y="204"
                  width="192"
                  height="200"
                  rx="20"
                  ry="20"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="20"
                  strokeLinejoin="round"
                />

                {/* Inner Arch / Door Cutout */}
                <path
                  className="path-arch"
                  d="M 216 404 L 216 312 C 216 296, 296 296, 296 312 L 296 404"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Large Sparkle (Right Side) */}
                <path
                  className="path-sparkle-lg"
                  d="M 380 135 Q 380 180 425 180 Q 380 180 380 225 Q 380 180 335 180 Q 380 180 380 135 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="14"
                  strokeLinejoin="round"
                />

                {/* Small Sparkle (Bottom Left Side) */}
                <path
                  className="path-sparkle-sm"
                  d="M 140 325 Q 140 350 165 350 Q 140 350 140 375 Q 140 350 115 350 Q 140 350 140 325 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="12"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Brand Title & Tagline */}
            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1.5 font-sans uppercase"
            >
              CENTRAL MALL
            </motion.h1>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-xs md:text-sm font-extrabold text-rose-100 tracking-widest uppercase mb-6"
            >
              Central University • Miotso Campus
            </motion.p>

            {/* Animated Progress Bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '160px' }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
                className="w-full h-full bg-white rounded-full"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedLoader;

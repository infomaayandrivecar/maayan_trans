"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function BackgroundOrbs() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className="bg-transport-container" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: -1, 
        overflow: 'hidden', 
        pointerEvents: 'none',
        backgroundColor: 'var(--surface)',
        backgroundImage: 'radial-gradient(circle at 10% 20%, var(--surface-tint-5) 0%, transparent 40%)',
        transition: 'background-color 0.3s ease'
      }}
    >

      {/* 1. ORIGINAL BLURRED GLOWING ORBS FOR COLOR DEPTH */}
      <motion.div
        animate={{
          x: [0, 40, -40, 0],
          y: [0, 30, -30, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-15%',
          width: '55vw',
          height: '55vw',
          minWidth: '350px',
          minHeight: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-container) 0%, transparent 65%)',
          opacity: 0.08,
          filter: 'blur(80px)',
        }}
      />
      <motion.div
        animate={{
          x: [0, -60, 60, 0],
          y: [0, -40, 40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-15%',
          width: '65vw',
          height: '65vw',
          minWidth: '450px',
          minHeight: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 65%)',
          opacity: 0.05,
          filter: 'blur(100px)',
        }}
      />

      {/* 2. VECTOR ROAD NETWORK / GPS ROUTE LAYERS */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Subtle grid pattern for map/tech feel */}
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="var(--outline-variant)" strokeWidth="0.5" opacity="0.12" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* --- ROAD NETWORKS (Thin background routes) --- */}
        {/* Route A */}
        <path
          d="M -100 200 C 300 150, 500 600, 800 450 C 1100 300, 1300 800, 1600 650 C 1800 550, 1900 900, 2020 850"
          fill="none"
          stroke="var(--outline-variant)"
          strokeWidth="1.5"
          opacity="0.25"
        />
        {/* Route B */}
        <path
          d="M -100 800 C 250 850, 600 400, 900 550 C 1200 700, 1400 300, 1700 250 C 1850 220, 1950 400, 2020 380"
          fill="none"
          stroke="var(--outline-variant)"
          strokeWidth="1.5"
          opacity="0.25"
        />
        {/* Route C */}
        <path
          d="M 300 -100 C 350 200, 700 300, 800 500 C 900 700, 1300 750, 1400 1180"
          fill="none"
          stroke="var(--outline-variant)"
          strokeWidth="1.5"
          opacity="0.25"
        />

        {/* --- FLOWING TRAFFIC / GPS DOT PULSES --- */}
        {/* Pulse A */}
        <motion.path
          d="M -100 200 C 300 150, 500 600, 800 450 C 1100 300, 1300 800, 1600 650 C 1800 550, 1900 900, 2020 850"
          fill="none"
          stroke="var(--primary-container)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="30 300"
          animate={{
            strokeDashoffset: [0, -1320]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          opacity="0.45"
          style={{ filter: 'drop-shadow(0px 0px 4px var(--primary-container))' }}
        />
        {/* Secondary dot trailing A */}
        <motion.path
          d="M -100 200 C 300 150, 500 600, 800 450 C 1100 300, 1300 800, 1600 650 C 1800 550, 1900 900, 2020 850"
          fill="none"
          stroke="var(--primary-container)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 450"
          animate={{
            strokeDashoffset: [150, -1170]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          opacity="0.3"
        />

        {/* Pulse B (Opposite direction flow) */}
        <motion.path
          d="M -100 800 C 250 850, 600 400, 900 550 C 1200 700, 1400 300, 1700 250 C 1850 220, 1950 400, 2020 380"
          fill="none"
          stroke="var(--primary-container)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="25 350"
          animate={{
            strokeDashoffset: [0, 1500]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          opacity="0.4"
          style={{ filter: 'drop-shadow(0px 0px 4px var(--primary-container))' }}
        />

        {/* Pulse C */}
        <motion.path
          d="M 300 -100 C 350 200, 700 300, 800 500 C 900 700, 1300 750, 1400 1180"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="20 400"
          animate={{
            strokeDashoffset: [0, -1600]
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "linear"
          }}
          opacity="0.25"
        />

        {/* --- GPS INTERSECTION NODES (Pulsing waypoints) --- */}
        {/* Node 1 (765, 465) */}
        <g>
          <circle cx="765" cy="465" r="4.5" fill="var(--primary-container)" opacity="0.6" />
          <motion.circle
            cx="765"
            cy="465"
            r="16"
            stroke="var(--primary-container)"
            strokeWidth="1.5"
            fill="none"
            animate={{
              scale: [1, 2.2],
              opacity: [0.4, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </g>

        {/* Node 2 (1050, 620) */}
        <g>
          <circle cx="1050" cy="620" r="4.5" fill="var(--primary)" opacity="0.5" />
          <motion.circle
            cx="1050"
            cy="620"
            r="16"
            stroke="var(--primary)"
            strokeWidth="1.5"
            fill="none"
            animate={{
              scale: [1, 2.2],
              opacity: [0.4, 0]
            }}
            transition={{
              duration: 3,
              delay: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </g>

        {/* Node 4 (500, 650) */}
        <g>
          <circle cx="500" cy="650" r="4.5" fill="var(--primary)" opacity="0.5" />
          <motion.circle
            cx="500"
            cy="650"
            r="16"
            stroke="var(--primary)"
            strokeWidth="1.5"
            fill="none"
            animate={{
              scale: [1, 2.2],
              opacity: [0.4, 0]
            }}
            transition={{
              duration: 4,
              delay: 0.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </g>

        {/* Node 3 (1320, 360) with FLOATING PREMIUM GPS PIN */}
        <g>
          <circle cx="1320" cy="360" r="5" fill="var(--primary-container)" opacity="0.8" />
          <motion.circle
            cx="1320"
            cy="360"
            r="20"
            stroke="var(--primary-container)"
            strokeWidth="1.5"
            fill="none"
            animate={{
              scale: [1, 2.5],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          {/* Floating location pin icon */}
          <motion.g
            transform="translate(1308, 318)"
            animate={{
              y: [0, -8, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              fill="var(--primary-container)"
              stroke="var(--primary)"
              strokeWidth="1"
              opacity="0.85"
            />
          </motion.g>
        </g>
      </svg>
    </div>
  );
}

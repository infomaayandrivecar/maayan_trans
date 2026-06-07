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
      {/* India Map Background with highlighted cities */}
      {isHome && (
        <motion.div
          animate={{
            x: [0, 15, -15, 0],
            y: [0, 10, -10, 0],
            scale: [1, 1.01, 0.99, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="bg-map-element"
          style={{
            position: 'absolute',
            left: '2%',
            bottom: '5%',
            width: '45vw',
            height: '55vw',
            maxWidth: '600px',
            maxHeight: '720px',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          <svg
            viewBox="0 0 500 600"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="cityGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="homeGlow">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* India outline path */}
            <path
              d="M220,28 L235,25 L250,30 L265,22 L280,28 L295,20 L310,25 L325,18 L335,28
                 L345,35 L355,30 L365,38 L372,48 L368,60 L375,72 L380,85 L385,98
                 L378,110 L382,125 L390,135 L395,148 L400,162 L408,175 L415,190
                 L420,205 L425,218 L418,232 L412,248 L405,260 L398,275 L390,290
                 L382,305 L375,318 L368,332 L362,345 L355,358 L350,372
                 L345,385 L338,398 L330,410 L325,422 L318,435 L312,448
                 L305,460 L298,472 L290,482 L282,490 L275,498 L268,505
                 L260,510 L252,515 L245,522 L238,530 L230,535 L222,528
                 L215,520 L210,510 L205,500 L198,488 L192,475 L185,462
                 L178,448 L172,435 L168,422 L162,408 L155,395 L150,380
                 L145,365 L140,350 L135,338 L128,325 L122,310 L118,295
                 L115,280 L110,265 L105,250 L100,238 L95,225 L92,210
                 L88,195 L85,180 L82,165 L80,150 L78,135 L82,120
                 L88,108 L95,95 L102,82 L110,72 L118,62 L128,55
                 L138,48 L148,42 L158,38 L170,35 L182,32 L195,30
                 L208,28 Z"
              fill="none"
              stroke="var(--outline-variant)"
              strokeWidth="1.2"
              opacity="0.35"
            />

            {/* Kashmir region */}
            <path
              d="M220,28 L210,15 L200,8 L195,18 L208,28"
              fill="none"
              stroke="var(--outline-variant)"
              strokeWidth="1.2"
              opacity="0.35"
            />

            {/* Northeast region */}
            <path
              d="M375,72 L388,65 L400,60 L412,58 L420,65 L428,72 L435,80 L430,90 L420,95 L408,92 L398,88 L390,85 L385,98"
              fill="none"
              stroke="var(--outline-variant)"
              strokeWidth="1.2"
              opacity="0.35"
            />

            {/* Gujarat/West coast detail */}
            <path
              d="M82,165 L72,170 L65,180 L60,195 L58,210 L62,225 L68,238 L75,248 L82,255 L88,260 L95,268 L100,275 L105,265"
              fill="none"
              stroke="var(--outline-variant)"
              strokeWidth="1.2"
              opacity="0.35"
            />

            {/* Sri Lanka */}
            <path
              d="M268,510 L275,520 L280,530 L278,542 L272,550 L265,545 L260,535 L258,525 L260,515"
              fill="none"
              stroke="var(--outline-variant)"
              strokeWidth="1"
              opacity="0.2"
            />

            {/* Internal state-like lines for texture */}
            <path d="M150,150 L250,140 L350,160" fill="none" stroke="var(--outline-variant)" strokeWidth="0.6" opacity="0.15" />
            <path d="M120,250 L220,240 L320,260 L380,280" fill="none" stroke="var(--outline-variant)" strokeWidth="0.6" opacity="0.15" />
            <path d="M130,340 L230,330 L310,360" fill="none" stroke="var(--outline-variant)" strokeWidth="0.6" opacity="0.15" />
            <path d="M200,200 L200,400" fill="none" stroke="var(--outline-variant)" strokeWidth="0.5" opacity="0.1" />
            <path d="M300,100 L280,450" fill="none" stroke="var(--outline-variant)" strokeWidth="0.5" opacity="0.1" />

            {/* === CITY DOTS WITH PULSING ANIMATIONS === */}

            {/* Delhi - Capital */}
            <g filter="url(#cityGlow)">
              <circle cx="228" cy="128" r="3.5" fill="var(--primary-container)" opacity="0.9" />
              <motion.circle cx="228" cy="128" r="10" stroke="var(--primary-container)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="238" y="132" fontSize="8" fill="var(--outline-variant)" opacity="0.5" fontFamily="var(--font-body)">Delhi</text>
            </g>

            {/* Jaipur */}
            <g filter="url(#cityGlow)">
              <circle cx="192" cy="155" r="2.5" fill="var(--primary)" opacity="0.7" />
              <motion.circle cx="192" cy="155" r="8" stroke="var(--primary)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 3, delay: 0.8, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="200" y="159" fontSize="7" fill="var(--outline-variant)" opacity="0.4" fontFamily="var(--font-body)">Jaipur</text>
            </g>

            {/* Lucknow */}
            <g filter="url(#cityGlow)">
              <circle cx="290" cy="142" r="2.5" fill="var(--primary)" opacity="0.7" />
              <motion.circle cx="290" cy="142" r="8" stroke="var(--primary)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="298" y="146" fontSize="7" fill="var(--outline-variant)" opacity="0.4" fontFamily="var(--font-body)">Lucknow</text>
            </g>

            {/* Kolkata */}
            <g filter="url(#cityGlow)">
              <circle cx="365" cy="218" r="3" fill="var(--primary-container)" opacity="0.8" />
              <motion.circle cx="365" cy="218" r="9" stroke="var(--primary-container)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.3], opacity: [0.45, 0] }}
                transition={{ duration: 2.8, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="375" y="222" fontSize="7" fill="var(--outline-variant)" opacity="0.4" fontFamily="var(--font-body)">Kolkata</text>
            </g>

            {/* Ahmedabad */}
            <g filter="url(#cityGlow)">
              <circle cx="115" cy="215" r="2.5" fill="var(--primary)" opacity="0.7" />
              <motion.circle cx="115" cy="215" r="8" stroke="var(--primary)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 3.2, delay: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="96" y="210" fontSize="7" fill="var(--outline-variant)" opacity="0.4" fontFamily="var(--font-body)">Ahmedabad</text>
            </g>

            {/* Mumbai */}
            <g filter="url(#cityGlow)">
              <circle cx="128" cy="290" r="3.5" fill="var(--primary-container)" opacity="0.9" />
              <motion.circle cx="128" cy="290" r="10" stroke="var(--primary-container)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                transition={{ duration: 2.5, delay: 1, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="106" y="286" fontSize="8" fill="var(--outline-variant)" opacity="0.5" fontFamily="var(--font-body)">Mumbai</text>
            </g>

            {/* Pune */}
            <g filter="url(#cityGlow)">
              <circle cx="148" cy="312" r="2.5" fill="var(--primary)" opacity="0.7" />
              <motion.circle cx="148" cy="312" r="8" stroke="var(--primary)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 3, delay: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="155" y="316" fontSize="7" fill="var(--outline-variant)" opacity="0.4" fontFamily="var(--font-body)">Pune</text>
            </g>

            {/* Hyderabad */}
            <g filter="url(#cityGlow)">
              <circle cx="230" cy="340" r="3" fill="var(--primary-container)" opacity="0.8" />
              <motion.circle cx="230" cy="340" r="9" stroke="var(--primary-container)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.3], opacity: [0.45, 0] }}
                transition={{ duration: 2.8, delay: 0.3, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="240" y="344" fontSize="7" fill="var(--outline-variant)" opacity="0.45" fontFamily="var(--font-body)">Hyderabad</text>
            </g>

            {/* Bangalore */}
            <g filter="url(#cityGlow)">
              <circle cx="220" cy="405" r="3" fill="var(--primary-container)" opacity="0.8" />
              <motion.circle cx="220" cy="405" r="9" stroke="var(--primary-container)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.3], opacity: [0.45, 0] }}
                transition={{ duration: 2.8, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="230" y="409" fontSize="7" fill="var(--outline-variant)" opacity="0.45" fontFamily="var(--font-body)">Bangalore</text>
            </g>

            {/* Chennai */}
            <g filter="url(#cityGlow)">
              <circle cx="272" cy="400" r="3" fill="var(--primary-container)" opacity="0.8" />
              <motion.circle cx="272" cy="400" r="9" stroke="var(--primary-container)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.3], opacity: [0.45, 0] }}
                transition={{ duration: 2.8, delay: 0.7, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="282" y="404" fontSize="7" fill="var(--outline-variant)" opacity="0.45" fontFamily="var(--font-body)">Chennai</text>
            </g>

            {/* ★ COIMBATORE - Home base (special highlight) */}
            <g filter="url(#homeGlow)">
              <circle cx="218" cy="445" r="5" fill="var(--primary)" opacity="1" />
              <motion.circle cx="218" cy="445" r="14" stroke="var(--primary)" strokeWidth="1.5" fill="none"
                animate={{ scale: [1, 2.8], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.circle cx="218" cy="445" r="14" stroke="var(--primary-container)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="228" y="449" fontSize="8" fill="var(--primary)" opacity="0.7" fontWeight="700" fontFamily="var(--font-body)">Coimbatore</text>
            </g>

            {/* Kochi */}
            <g filter="url(#cityGlow)">
              <circle cx="195" cy="465" r="2.5" fill="var(--primary)" opacity="0.7" />
              <motion.circle cx="195" cy="465" r="8" stroke="var(--primary)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 3, delay: 2.5, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="175" y="462" fontSize="7" fill="var(--outline-variant)" opacity="0.4" fontFamily="var(--font-body)">Kochi</text>
            </g>

            {/* Madurai */}
            <g filter="url(#cityGlow)">
              <circle cx="242" cy="475" r="2.5" fill="var(--primary)" opacity="0.7" />
              <motion.circle cx="242" cy="475" r="8" stroke="var(--primary)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 3, delay: 1.3, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="250" y="479" fontSize="7" fill="var(--outline-variant)" opacity="0.4" fontFamily="var(--font-body)">Madurai</text>
            </g>

            {/* Bhopal */}
            <g filter="url(#cityGlow)">
              <circle cx="220" cy="240" r="2.5" fill="var(--primary)" opacity="0.7" />
              <motion.circle cx="220" cy="240" r="8" stroke="var(--primary)" strokeWidth="1" fill="none"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 3.5, delay: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
              <text x="228" y="244" fontSize="7" fill="var(--outline-variant)" opacity="0.4" fontFamily="var(--font-body)">Bhopal</text>
            </g>

            {/* Animated route lines connecting cities */}
            <motion.path
              d="M228,128 Q260,200 230,340 Q225,380 218,445"
              fill="none"
              stroke="var(--primary-container)"
              strokeWidth="1"
              strokeDasharray="6 12"
              animate={{ strokeDashoffset: [0, -72] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              opacity="0.2"
            />
            <motion.path
              d="M128,290 Q180,330 220,405 Q219,425 218,445"
              fill="none"
              stroke="var(--primary-container)"
              strokeWidth="1"
              strokeDasharray="6 12"
              animate={{ strokeDashoffset: [0, -72] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              opacity="0.2"
            />
            <motion.path
              d="M365,218 Q300,280 272,400"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1"
              strokeDasharray="4 10"
              animate={{ strokeDashoffset: [0, -56] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
              opacity="0.15"
            />
          </svg>
        </motion.div>
      )}

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

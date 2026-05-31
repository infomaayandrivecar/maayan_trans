"use client";
import React from "react";
import { motion } from "framer-motion";

export default function BackgroundOrbs() {
  return (
    <div 
      className="bg-orbs-container" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: -1, 
        overflow: 'hidden', 
        pointerEvents: 'none' 
      }}
    >
      <motion.div
        animate={{
          x: [0, 80, -80, 0],
          y: [0, 50, -50, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          minWidth: '400px',
          minHeight: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-container) 0%, transparent 60%)',
          opacity: 0.15,
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        animate={{
          x: [0, -100, 100, 0],
          y: [0, -80, 80, 0],
          scale: [1, 0.8, 1.2, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          minWidth: '500px',
          minHeight: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 60%)',
          opacity: 0.1,
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
}

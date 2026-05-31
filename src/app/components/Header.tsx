"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Moon, Sun } from "lucide-react";
import { useBooking } from "../context/BookingContext";

export default function Header() {
  const [theme, setTheme] = useState("light");
  const { resetBooking } = useBooking();

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("maayan_theme") || "light";
    setTheme(savedTheme);
  }, []);

  // Apply theme to document on theme change
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("maayan_theme", nextTheme);
    }
  };

  return (
    <header className="sticky-header">
      <div className="header-container">
        <Link href="/" className="logo-section" onClick={resetBooking}>
          <div className="logo-icon" style={{ background: 'transparent' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Premium automotive shield badge with monogram 'M' and sports car silhouette */}
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="var(--primary)" opacity="0.05" />
              <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.5" />
              <path d="M8 12.5L9.8 9.5H14.2L16 12.5" stroke="var(--on-surface)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 13C5 13 6.5 12.2 12 12.2C17.5 12.2 19 13 19 13C19.5 13 20 13.5 20 14.2V16.8C20 17.5 19.5 18 19 18H5C4.5 18 4 17.5 4 16.8V14.2C4 13.5 4.5 13 5 13Z" fill="var(--primary)" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M6 14.5L7.8 14.8" stroke="var(--primary-container)" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 14.5L16.2 14.8" stroke="var(--primary-container)" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 14.8L11 16.8L12 15.5L13 16.8L14 14.8" stroke="var(--primary-container)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="brand-text">Maayan Trans</span>
        </Link>

        <div className="header-actions">
          {/* Theme Toggler */}
          <button 
            onClick={toggleTheme} 
            className="icon-btn theme-toggle" 
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>

          {/* Quick Call */}
          <a href="tel:+919894221664" className="btn-call">
            <Phone size={14} fill="currentColor" />
            <span>+91 98942 21664</span>
          </a>
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Moon, Sun } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { usePathname } from "next/navigation";
import BrandLogo from "./BrandLogo";

export default function Header() {
  const [theme, setTheme] = useState("light");
  const { state, resetBooking } = useBooking();
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Separators between items are drawn in CSS, so the copy itself stays clean.
  const defaultMarquee = `Premium inter-city travel, airport transfers, and local rides at honest rates | Call ${state.settings?.company?.phone || "+91 98942 21664"} to book your ride today | Safe, vetted, and professional drivers on every journey | Transparent fares — no hidden charges, no surge pricing`;
  const marqueeItems = (state.settings?.company?.marqueeText || defaultMarquee).split("|");

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
        <Link href="/" className="logo-section" onClick={resetBooking} aria-label="Maayan Trans — Home">
          <BrandLogo size={42} priority />
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
          <a href={`tel:${state.settings?.company?.phone?.replace(/\s+/g, "") || "+919894221664"}`} className="btn-call">
            <Phone size={14} />
            <span>{state.settings?.company?.phone || "+91 98942 21664"}</span>
          </a>
        </div>
      </div>
      {isHome && (
        <div className="scrolling-banner">
          <div className="scrolling-banner-track">
            <div className="scrolling-banner-content">
              {marqueeItems.map((item, idx) => (
                <span key={idx}>{item.trim()}</span>
              ))}
            </div>
            {/* Duplicate for seamless looping marquee */}
            <div className="scrolling-banner-content" aria-hidden="true">
              {marqueeItems.map((item, idx) => (
                <span key={idx}>{item.trim()}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

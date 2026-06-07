"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Moon, Sun } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { usePathname } from "next/navigation";

export default function Header() {
  const [theme, setTheme] = useState("light");
  const { state, resetBooking } = useBooking();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const defaultMarquee = `✨ Welcome to Maayan Trans & Services! Premium Inter-City Travel, Airport Transfers, and Local Rides at Affordable Rates. ✨ | 📞 Call us at ${state.settings?.company?.phone || "+91 98942 21664"} to book your ride today! 📞 | ⭐ Safe, Vetted, and Professional Drivers for a Premium Experience. ⭐`;
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
        <Link href="/" className="logo-section" onClick={resetBooking}>
          <div className="logo-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={theme === "dark" ? "/logo_dark.png?v=3" : "/logo_original.png?v=3"} alt="Maayan Trans Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          </div>
          <img
            src={theme === "dark" ? "/brand_text_dark.png" : "/brand_text_light.png"}
            alt="Maayan Trans"
            className="brand-text-img"
          />
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

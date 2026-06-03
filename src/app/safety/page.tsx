"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ShieldAlert, ArrowLeft, Heart, PhoneCall, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SafetyPage() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("maayan_theme") || "light";
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="landing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main className="main-content" style={{ flex: 1, padding: "8rem 1.5rem 4rem 1.5rem", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}
        >
          {/* Back Nav */}
          <div>
            <Link href="/" className="back-link-nav" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--on-surface-variant)", textDecoration: "none" }}>
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Page Title */}
          <div>
            <span className="hero-badge label-sm">Safety First</span>
            <h1 className="headline-md" style={{ marginTop: "0.5rem", fontWeight: 800 }}>Safety Standards & Guidelines</h1>
            <p className="body-md text-muted" style={{ fontSize: "1.1rem", marginTop: "0.5rem", maxWidth: "700px" }}>
              We prioritize customer safety above all. Learn about our 5-star safety checks and vehicle maintenance protocols.
            </p>
          </div>

          {/* Safety Protocols */}
          <div className="card-container" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 className="title-md" style={{ color: "var(--brand-gold)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldAlert size={22} style={{ color: "var(--brand-gold)" }} />
              <span>Our Trust & Safety Commitment</span>
            </h2>
            <p className="body-md">
              At <strong>Maayan Trans</strong>, safety is not an afterthought; it is our foundation. Whether you are catching an early morning airport flight or taking a late-night outstation transfer, we carry out comprehensive checks so you can sit back and relax.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckCircle size={18} style={{ color: "#22c55e", flexShrink: 0, marginTop: "0.2rem" }} />
                <div>
                  <h4 className="title-sm" style={{ fontWeight: 600 }}>Strict Driver Vetting & Screening</h4>
                  <p className="body-md text-muted" style={{ fontSize: "0.9rem" }}>Every driver undergoes rigorous background verification, commercial license validation, and safety training before joining our team.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckCircle size={18} style={{ color: "#22c55e", flexShrink: 0, marginTop: "0.2rem" }} />
                <div>
                  <h4 className="title-sm" style={{ fontWeight: 600 }}>Frequent Fleet Inspection</h4>
                  <p className="body-md text-muted" style={{ fontSize: "0.9rem" }}>Vehicles are routinely inspected for tire tread depth, brake checks, fluid levels, and regular dynamic safety systems checks.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckCircle size={18} style={{ color: "#22c55e", flexShrink: 0, marginTop: "0.2rem" }} />
                <div>
                  <h4 className="title-sm" style={{ fontWeight: 600 }}>Sanitization & Cleanliness</h4>
                  <p className="body-md text-muted" style={{ fontSize: "0.9rem" }}>Every vehicle is thoroughly cleaned and sanitized after completing a journey to ensure premium hygiene standards.</p>
                </div>
              </div>
            </div>
          </div>

          {/* SOS and Help line */}
          <div className="feature-card card-lowest" style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <PhoneCall size={22} />
              </div>
              <div>
                <h3 className="title-md" style={{ margin: 0 }}>Need Immediate Support?</h3>
                <p className="body-md text-muted" style={{ fontSize: "0.9rem" }}>Our emergency safety response desk is available 24/7 during active trips.</p>
              </div>
            </div>

            <a
              href="tel:+919894221664"
              className="btn-primary"
              style={{
                padding: "0.75rem 1.5rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                boxShadow: "none",
                background: theme === "dark" ? "rgba(239, 68, 68, 0.15)" : "#ef4444",
                color: theme === "dark" ? "#f87171" : "#ffffff",
                border: theme === "dark" ? "1px solid rgba(239, 68, 68, 0.35)" : "none"
              }}
            >
              Call Safety Helpline
            </a>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

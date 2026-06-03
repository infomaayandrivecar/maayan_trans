"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Award, ShieldCheck, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
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
            <span className="hero-badge label-sm">Who We Are</span>
            <h1 className="headline-md" style={{ marginTop: "0.5rem", fontWeight: 800 }}>About Maayan Trans & Services</h1>
            <p className="body-md text-muted" style={{ fontSize: "1.1rem", marginTop: "0.5rem", maxWidth: "700px" }}>
              Redefining inter-city mobility with a focus on punctuality, safety, and a premium travel experience.
            </p>
          </div>

          {/* Detailed Description */}
          <div className="card-container" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 className="title-md" style={{ color: "var(--brand-gold)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.75rem" }}>
              Our Story
            </h2>
            <p className="body-md">
              Founded in Coimbatore, Tamil Nadu, <strong>Maayan Trans & Services</strong> was established with a singular mission: to provide comfortable, safe, and professional inter-city transportation services. We recognized the need for a premium, hassle-free cab booking system with transparent fare structures, vetted professional drivers, and top-tier customer care.
            </p>
            <p className="body-md">
              Today, we serve a wide range of corporate clients, families, and solo travellers across South India. By incorporating a dynamic pricing engine, advanced route estimations, and certified chauffeurs, we deliver a travel experience that sets a new benchmark in premium executive travel.
            </p>
          </div>

          {/* Pillars of Excellence */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <div className="feature-card card-lowest" style={{ padding: "2rem" }}>
              <div className="feature-icon-wrap" style={{ background: "rgba(217, 119, 6, 0.1)", border: "1px solid rgba(217, 119, 6, 0.2)", color: "#d97706", width: "44px", height: "44px", marginBottom: "1rem" }}>
                <ShieldCheck size={20} />
              </div>
              <h3 className="title-md" style={{ marginBottom: "0.5rem" }}>Certified Safety</h3>
              <p className="body-md text-muted">
                Every vehicle in our fleet is fully vetted for mechanical excellence, and every trip is backed by professional drivers trained in safe driving protocols.
              </p>
            </div>

            <div className="feature-card card-lowest" style={{ padding: "2rem" }}>
              <div className="feature-icon-wrap" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#22c55e", width: "44px", height: "44px", marginBottom: "1rem" }}>
                <Award size={20} />
              </div>
              <h3 className="title-md" style={{ marginBottom: "0.5rem" }}>Transparent Pricing</h3>
              <p className="body-md text-muted">
                Say goodbye to surge pricing and hidden convenience charges. Our system calculates distances and tolls transparently so you know exactly what you are paying upfront.
              </p>
            </div>

            <div className="feature-card card-lowest" style={{ padding: "2rem" }}>
              <div className="feature-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", color: "#3b82f6", width: "44px", height: "44px", marginBottom: "1rem" }}>
                <Heart size={20} />
              </div>
              <h3 className="title-md" style={{ marginBottom: "0.5rem" }}>Passenger Centric</h3>
              <p className="body-md text-muted">
                Your comfort is our top priority. We offer custom schedules, stops on demand during outstation trips, and 24/7 client booking coordination support.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

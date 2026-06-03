"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
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
            <span className="hero-badge label-sm">Legal & Policies</span>
            <h1 className="headline-md" style={{ marginTop: "0.5rem", fontWeight: 800 }}>Terms of Service</h1>
            <p className="body-md text-muted" style={{ fontSize: "1.1rem", marginTop: "0.5rem", maxWidth: "700px" }}>
              Please review our ride policies, fare calculation guidelines, and service agreements before booking.
            </p>
          </div>

          {/* Terms content card */}
          <div className="card-container" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 className="title-md" style={{ color: "var(--brand-gold)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Scale size={22} style={{ color: "var(--brand-gold)" }} />
              <span>Service Agreement & Fare Rules</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontSize: "0.95rem" }}>
              <div>
                <h4 className="title-sm" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>1. Booking Scope</h4>
                <p className="body-md text-muted">All bookings initiated on our website are requests subject to confirmation by dispatch. The contract of travel is finalized only after a driver and vehicle details sheet is shared with the customer.</p>
              </div>

              <div>
                <h4 className="title-sm" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>2. Fare Estimations & Billing</h4>
                <p className="body-md text-muted">The distance and duration calculations are estimates based on standard routes. The final fare is calculated using the actual kilometers traveled from start to end points. State tolls, parking, and driver allowances are defined separately and are applicable as outlined in your fare summary sheet.</p>
              </div>

              <div>
                <h4 className="title-sm" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>3. Driver Allowance & Bata</h4>
                <p className="body-md text-muted">A mandatory driver allowance (or Driver Bata) is charged per calendar day for outstation trips. This covers driver lodging and food expenses. If travel extends beyond midnight, a new day allowance is applicable.</p>
              </div>

              <div>
                <h4 className="title-sm" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>4. Cancellation Policy</h4>
                <p className="body-md text-muted">Bookings can be cancelled free of charge up to 12 hours before the scheduled pickup time. Cancellations within 12 hours may attract a nominal dispatch fee to compensate the driver assigned to the duty.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import Link from "next/link";

export default function Footer() {
  const { state } = useBooking();
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand-col">
          <div className="footer-logo">
            <div className="logo-icon-wrap" style={{ background: 'transparent' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Premium automotive shield badge with monogram 'M' and sports car silhouette (Forced Dark Mode Colors for Footer) */}
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#ffb300" opacity="0.05" />
                <circle cx="12" cy="12" r="10" stroke="#ffb300" strokeWidth="1.5" />
                <path d="M8 12.5L9.8 9.5H14.2L16 12.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 13C5 13 6.5 12.2 12 12.2C17.5 12.2 19 13 19 13C19.5 13 20 13.5 20 14.2V16.8C20 17.5 19.5 18 19 18H5C4.5 18 4 17.5 4 16.8V14.2C4 13.5 4.5 13 5 13Z" fill="#ffb300" stroke="#ffb300" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M6 14.5L7.8 14.8" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 14.5L16.2 14.8" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 14.8L11 16.8L12 15.5L13 16.8L14 14.8" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="logo-text">Maayan Trans</span>
          </div>
          <p className="brand-description">
            Connecting cities, one ride at a time. Professional, reliable, and always on time.
          </p>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Company</h4>
          <ul className="footer-links-list">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/safety">Safety First</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
          </ul>
        </div>

        <div id="support" className="footer-contact-col">
          <h4 className="footer-title">Contact Us</h4>
          <ul className="footer-contact-list">
            <li>
              <Mail size={16} className="contact-icon" />
              <a href={`mailto:${state.settings?.company?.email || "maayantransporters@gmail.com"}`} className="contact-link">
                {state.settings?.company?.email || "maayantransporters@gmail.com"}
              </a>
            </li>
            <li>
              <Phone size={16} className="contact-icon" />
              <a href={`tel:${state.settings?.company?.phone?.replace(/\s+/g, "") || "+919894221664"}`} className="contact-link">
                {state.settings?.company?.phone || "+91 98942 21664"}
              </a>
            </li>
            <li>
              <MapPin size={16} className="contact-icon address-icon" />
              <span className="contact-address">
                {state.settings?.company?.address ? (
                  <>
                    {state.settings.company.address.split(",").slice(0, 3).join(",")},<br />
                    {state.settings.company.address.split(",").slice(3).join(",")}
                  </>
                ) : (
                  <>
                    11-E, RKK Nagar, Singanallur,<br />
                    Coimbatore, Tamil Nadu, India
                  </>
                )}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright-text">
          © {new Date().getFullYear()} Maayan Trans & Services. All rights reserved.
        </p>
      </div>

      
    </footer>
  );
}

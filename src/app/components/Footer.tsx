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
            <div className="logo-icon-wrap" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo_dark.png?v=3" alt="Maayan Trans Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
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

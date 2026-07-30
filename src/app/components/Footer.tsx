"use client";

import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import Link from "next/link";

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const YouTubeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.37z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

export default function Footer() {
  const { state } = useBooking();

  const instagramUrl = state.settings?.company?.instagramUrl?.trim();
  const facebookUrl = state.settings?.company?.facebookUrl?.trim();
  const twitterUrl = state.settings?.company?.twitterUrl?.trim();
  const youtubeUrl = state.settings?.company?.youtubeUrl?.trim();
  const hasSocials = Boolean(instagramUrl || facebookUrl || twitterUrl || youtubeUrl);

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

          {hasSocials && (
            <div className="footer-social-links">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Instagram"
                  className="social-icon-btn"
                >
                  <InstagramIcon size={18} />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Facebook"
                  className="social-icon-btn"
                >
                  <FacebookIcon size={18} />
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Twitter (X)"
                  className="social-icon-btn"
                >
                  <TwitterIcon size={18} />
                </a>
              )}
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Subscribe on YouTube"
                  className="social-icon-btn"
                >
                  <YouTubeIcon size={18} />
                </a>
              )}
            </div>
          )}
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

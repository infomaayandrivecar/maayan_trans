"use client";

import React from "react";
import Image from "next/image";

type BrandLogoVariant = "header" | "footer";

interface BrandLogoProps {
  /** Rendered size of the emblem in px. The wordmark scales alongside it. */
  size?: number;
  /** "footer" locks the wordmark to light-on-dark, since the footer is always dark. */
  variant?: BrandLogoVariant;
  /** Hide the wordmark and show the emblem alone. */
  markOnly?: boolean;
  priority?: boolean;
  className?: string;
}

/**
 * The single source of truth for the Maayan Trans lockup: emblem + wordmark.
 *
 * The emblem is a deep royal-blue mark, so on the dark theme it is given a soft
 * cool halo (.brand-mark) to keep its outer contour from dissolving into the
 * near-black surface. Both halves of the wordmark pick their colour from brand
 * tokens that flip with the theme.
 */
export default function BrandLogo({
  size = 40,
  variant = "header",
  markOnly = false,
  priority = false,
  className = "",
}: BrandLogoProps) {
  return (
    <span
      className={`brand-lockup ${variant === "footer" ? "brand-lockup-footer" : ""} ${className}`}
      style={{ ["--brand-mark-size" as string]: `${size}px` }}
    >
      <span className="brand-mark">
        <Image
          src="/logo.png"
          alt=""
          aria-hidden="true"
          width={size * 3}
          height={size * 3}
          priority={priority}
          className="brand-mark-img"
// Ask Next for a source wide enough for 3x displays at this render size.
          sizes={`${size * 3}px`}
        />
      </span>

      {!markOnly && (
        <span className="brand-wordmark">
          <span className="brand-wordmark-primary">Maayan</span>
          <span className="brand-wordmark-accent">Trans</span>
        </span>
      )}
    </span>
  );
}

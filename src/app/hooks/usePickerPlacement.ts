"use client";

import { useState, useEffect, RefObject } from "react";

export function usePickerPlacement(
  isOpen: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  popoverHeight = 320
): boolean {
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const calculatePlacement = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setOpenUpward(spaceBelow < popoverHeight && spaceAbove > spaceBelow);
      }
    };

    calculatePlacement();

    window.addEventListener("scroll", calculatePlacement, true);
    window.addEventListener("resize", calculatePlacement);

    return () => {
      window.removeEventListener("scroll", calculatePlacement, true);
      window.removeEventListener("resize", calculatePlacement);
    };
  }, [isOpen, triggerRef, popoverHeight]);

  return openUpward;
}

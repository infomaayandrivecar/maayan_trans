"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Clock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePickerPlacement } from "../hooks/usePickerPlacement";

interface TimePickerProps {
  time: string; // HH:MM (24h)
  setTime: (time: string) => void;
  label?: string;
  placeholder?: string;
}

export default function TimePicker({
  time,
  setTime,
  label,
  placeholder = "Select Time",
}: TimePickerProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const timePopoverRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth <= 576);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const timeOpenUpward = usePickerPlacement(showTimePicker, timePickerRef, 310);

  // Time Picker State (Temporary state until "Confirm" is clicked)
  const [tempHour, setTempHour] = useState<number>(12);
  const [tempMinute, setTempMinute] = useState<number>(0);
  const [tempPeriod, setTempPeriod] = useState<"AM" | "PM">("AM");

  // Convert 12h parameters to 24h string "HH:MM"
  const to24hString = (h12: number, min: number, period: "AM" | "PM") => {
    let h24 = h12;
    if (period === "PM" && h12 !== 12) h24 += 12;
    if (period === "AM" && h12 === 12) h24 = 0;
    return `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };

  // Parse "HH:MM" into 12-hour parameters
  const parse24h = (time24: string) => {
    if (!time24) return { h12: 12, min: 0, period: "AM" as const };
    const [hStr, mStr] = time24.split(":");
    const h24 = parseInt(hStr, 10);
    const min = parseInt(mStr, 10);
    
    if (isNaN(h24) || isNaN(min)) return { h12: 12, min: 0, period: "AM" as const };

    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    h12 = h12 === 0 ? 12 : h12;
    return { h12, min, period };
  };

  // Sync temp pickers state when opening Time Picker
  useEffect(() => {
    if (showTimePicker) {
      const { h12, min, period } = parse24h(time);
      setTempHour(h12);
      setTempMinute(min);
      setTempPeriod(period);
    }
  }, [showTimePicker, time]);

  // Click outside detection to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        timePickerRef.current &&
        !timePickerRef.current.contains(target) &&
        (!timePopoverRef.current || !timePopoverRef.current.contains(target))
      ) {
        setShowTimePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key handler to close picker
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowTimePicker(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock background scroll when picker is open on mobile
  useEffect(() => {
    if (isMobile && showTimePicker) {
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [showTimePicker, isMobile]);

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return placeholder;
    const { h12, min, period } = parse24h(timeStr);
    return `${h12}:${String(min).padStart(2, "0")} ${period}`;
  };

  const hoursOptions = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesOptions = Array.from({ length: 12 }, (_, i) => i * 5);
  const periodOptions: ("AM" | "PM")[] = ["AM", "PM"];

  const handleConfirmTime = () => {
    setTime(to24hString(tempHour, tempMinute, tempPeriod));
    setShowTimePicker(false);
  };

  const renderTimePickerPopover = () => {
    if (!showTimePicker) return null;

    const content = (
      <AnimatePresence key="timepicker-presence">
        {showTimePicker && (
          <div className={isMobile ? "mobile-picker-modal-overlay" : undefined}>
            <motion.div
              key="timepicker-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="picker-backdrop"
              onClick={() => setShowTimePicker(false)}
              onTouchMove={(e) => isMobile && e.preventDefault()}
            />
            <motion.div
              key="timepicker-popover"
              ref={timePopoverRef}
              initial={
                isMobile
                  ? { opacity: 0, scale: 0.92 }
                  : { opacity: 0, y: timeOpenUpward ? -10 : 10, scale: 0.95 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                isMobile
                  ? { opacity: 0, scale: 0.92 }
                  : { opacity: 0, y: timeOpenUpward ? -10 : 10, scale: 0.95 }
              }
              transition={{ duration: 0.15 }}
              className={`picker-popover time-popover card-lowest ${!isMobile && timeOpenUpward ? "popover-above" : ""}`}
              style={
                isMobile
                  ? {}
                  : {
                      left: 0,
                      right: "auto",
                      width: "260px",
                      top: timeOpenUpward ? "auto" : "calc(100% + 6px)",
                      bottom: timeOpenUpward ? "calc(100% + 6px)" : "auto",
                    }
              }
              onTouchMove={(e) => isMobile && e.stopPropagation()}
            >
              <div className="time-picker-title">Select {label || "Time"}</div>
              
              <div className="time-columns-container">
                {/* Hours Column */}
                <div className="time-column">
                  <span className="column-header">Hour</span>
                  <div className="column-scroll-area">
                    {hoursOptions.map(h => {
                      const isSelected = tempHour === h;
                      return (
                        <button
                          key={`hour-${h}`}
                          type="button"
                          className={`time-cell ${isSelected ? "selected" : ""}`}
                          onClick={() => setTempHour(h)}
                        >
                          {String(h).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minutes Column */}
                <div className="time-column">
                  <span className="column-header">Min</span>
                  <div className="column-scroll-area">
                    {minutesOptions.map(m => {
                      const isSelected = tempMinute === m;
                      return (
                        <button
                          key={`min-${m}`}
                          type="button"
                          className={`time-cell ${isSelected ? "selected" : ""}`}
                          onClick={() => setTempMinute(m)}
                        >
                          {String(m).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AM/PM Column */}
                <div className="time-column">
                  <span className="column-header">Period</span>
                  <div className="column-scroll-area">
                    {periodOptions.map(p => {
                      const isSelected = tempPeriod === p;
                      return (
                        <button
                          key={`period-${p}`}
                          type="button"
                          className={`time-cell ${isSelected ? "selected" : ""}`}
                          onClick={() => setTempPeriod(p)}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="time-picker-actions">
                <button
                  type="button"
                  className="btn-confirm-time"
                  onClick={handleConfirmTime}
                >
                  <Check size={14} />
                  <span>Set Time</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );

    if (isMobile && isMounted) {
      return createPortal(content, document.body);
    }
    return content;
  };

  return (
    <div className="picker-wrapper" ref={timePickerRef} style={{ zIndex: showTimePicker && !isMobile ? 500 : undefined }}>
      {label && (
        <label className="input-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
          {label}
        </label>
      )}
      <div 
        className={`custom-picker-trigger ${showTimePicker ? "active" : ""}`}
        onClick={() => setShowTimePicker(!showTimePicker)}
      >
        <Clock size={18} className="trigger-icon" />
        <div className="trigger-text-wrapper">
          <span className="trigger-value">{formatDisplayTime(time)}</span>
        </div>
      </div>

      {renderTimePickerPopover()}
    </div>
  );
}

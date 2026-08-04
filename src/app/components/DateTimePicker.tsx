"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePickerPlacement } from "../hooks/usePickerPlacement";

interface DateTimePickerProps {
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:MM (24h)
  setPickupDate: (date: string) => void;
  setPickupTime: (time: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  minDateTime?: string;
  showDate?: boolean;
}

export default function DateTimePicker({
  pickupDate,
  pickupTime,
  setPickupDate,
  setPickupTime,
  dateLabel,
  timeLabel,
  minDateTime,
  showDate = true,
}: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);
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

  const dateOpenUpward = usePickerPlacement(showDatePicker, datePickerRef, 340);
  const timeOpenUpward = usePickerPlacement(showTimePicker, timePickerRef, 310);

  const minValid = minDateTime ? new Date(minDateTime) : new Date(Date.now() + 30 * 60 * 1000);
  const todayDateString = `${minValid.getFullYear()}-${String(minValid.getMonth() + 1).padStart(2, "0")}-${String(minValid.getDate()).padStart(2, "0")}`;

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(minValid.getMonth());
  const [currentYear, setCurrentYear] = useState(minValid.getFullYear());

  // Time Picker State (Temporary state until "Confirm" is clicked)
  const [tempHour, setTempHour] = useState<number>(12);
  const [tempMinute, setTempMinute] = useState<number>(0);
  const [tempPeriod, setTempPeriod] = useState<"AM" | "PM">("AM");

  // Helper: Format ISO date string (YYYY-MM-DD)
  const formatDateISO = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

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

  // Validate a specific hour/minute/period combination for today
  const isValidTime = (h12: number, min: number, period: "AM" | "PM") => {
    if (pickupDate !== todayDateString) return true;

    let h24 = h12;
    if (period === "PM" && h12 !== 12) h24 += 12;
    if (period === "AM" && h12 === 12) h24 = 0;

    const testDate = new Date(minValid.getFullYear(), minValid.getMonth(), minValid.getDate(), h24, min, 0, 0);

    return testDate.getTime() >= minValid.getTime();
  };

  // Get nearest valid date and time (at least 30 mins in future, rounded up to 5 mins)
  const getNearestValidDateTime = (
    dateStr: string,
    timeStr: string
  ): { date: string; time: string } => {
    const minValidDateStr = `${minValid.getFullYear()}-${String(minValid.getMonth() + 1).padStart(2, "0")}-${String(minValid.getDate()).padStart(2, "0")}`;
    
    let targetDateStr = dateStr;
    if (!targetDateStr || targetDateStr < minValidDateStr) {
      targetDateStr = minValidDateStr;
    }
    
    const { h12, min, period } = parse24h(timeStr || "12:00");
    let h24 = h12;
    if (period === "PM" && h12 !== 12) h24 += 12;
    if (period === "AM" && h12 === 12) h24 = 0;
    
    const [y, m, d] = targetDateStr.split("-").map(Number);
    const targetDateTime = new Date(y, m - 1, d, h24, min, 0, 0);
    
    if (targetDateTime.getTime() >= minValid.getTime()) {
      return { date: targetDateStr, time: to24hString(h12, min, period) };
    }
    
    let validMin = Math.ceil(minValid.getMinutes() / 5) * 5;
    let validH24 = minValid.getHours();
    const validDate = new Date(minValid);
    
    if (validMin >= 60) {
      validMin = 0;
      validH24 += 1;
      if (validH24 >= 24) {
        validH24 = 0;
        validDate.setDate(validDate.getDate() + 1);
      }
    }
    
    const finalDateStr = `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, "0")}-${String(validDate.getDate()).padStart(2, "0")}`;
    const finalPeriod: "AM" | "PM" = validH24 >= 12 ? "PM" : "AM";
    let finalH12 = validH24 % 12;
    finalH12 = finalH12 === 0 ? 12 : finalH12;
    
    return {
      date: finalDateStr,
      time: to24hString(finalH12, validMin, finalPeriod),
    };
  };

  const getNearestValidTime = (
    dateStr: string,
    h12: number,
    min: number,
    period: "AM" | "PM"
  ): { h12: number; min: number; period: "AM" | "PM" } => {
    const { time } = getNearestValidDateTime(dateStr, to24hString(h12, min, period));
    return parse24h(time);
  };

  // Auto-correct time/date if selection becomes past
  useEffect(() => {
    if (pickupDate) {
      const { date, time } = getNearestValidDateTime(pickupDate, pickupTime);
      if (date !== pickupDate) {
        setPickupDate(date);
      }
      if (pickupTime && time !== pickupTime) {
        setPickupTime(time);
      }
    }
  }, [pickupDate, pickupTime, showTimePicker, showDatePicker]);

  // Sync temp pickers state when opening Time Picker
  useEffect(() => {
    if (showTimePicker) {
      const { time } = getNearestValidDateTime(pickupDate, pickupTime);
      const { h12, min, period } = parse24h(time);
      setTempHour(h12);
      setTempMinute(min);
      setTempPeriod(period);
    }
  }, [showTimePicker, pickupTime, pickupDate]);

  // Click outside detection to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(target) &&
        (!datePopoverRef.current || !datePopoverRef.current.contains(target))
      ) {
        setShowDatePicker(false);
      }
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

  // Escape key handler to close pickers
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowDatePicker(false);
        setShowTimePicker(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock background scroll when a picker is open on mobile
  useEffect(() => {
    if (isMobile && (showDatePicker || showTimePicker)) {
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [showDatePicker, showTimePicker, isMobile]);

  // Display Formatting Helpers
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) return "Select Date";
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return "Select Time";
    const { h12, min, period } = parse24h(timeStr);
    return `${h12}:${String(min).padStart(2, "0")} ${period}`;
  };

  // Calendar calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = formatDateISO(currentYear, currentMonth, day);
    setPickupDate(selectedDate);
    setShowDatePicker(false);
  };

  // Generate calendar days
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells: (number | null)[] = [];

  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const hoursOptions = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesOptions = Array.from({ length: 12 }, (_, i) => i * 5);
  const periodOptions: ("AM" | "PM")[] = ["AM", "PM"];

  const isPeriodValid = (p: "AM" | "PM") => {
    return hoursOptions.some(h => 
      minutesOptions.some(m => isValidTime(h, m, p))
    );
  };

  const isHourValid = (h: number) => {
    return minutesOptions.some(m => isValidTime(h, m, tempPeriod));
  };

  const isMinuteValid = (m: number) => {
    return isValidTime(tempHour, m, tempPeriod);
  };

  const handleConfirmTime = () => {
    const validated = getNearestValidTime(pickupDate, tempHour, tempMinute, tempPeriod);
    setPickupTime(to24hString(validated.h12, validated.min, validated.period));
    setShowTimePicker(false);
  };

  const adjustTempSelection = (h: number, m: number, p: "AM" | "PM") => {
    const validated = getNearestValidTime(pickupDate, h, m, p);
    setTempHour(validated.h12);
    setTempMinute(validated.min);
    setTempPeriod(validated.period);
  };

  const isOpen = showDatePicker || showTimePicker;

  const renderDatePickerPopover = () => {
    if (!showDatePicker) return null;

    const content = (
      <AnimatePresence key="datepicker-presence">
        {showDatePicker && (
          <div className={isMobile ? "mobile-picker-modal-overlay" : undefined}>
            <motion.div
              key="datepicker-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="picker-backdrop"
              onClick={() => setShowDatePicker(false)}
              onTouchMove={(e) => isMobile && e.preventDefault()}
            />
            <motion.div
              key="datepicker-popover"
              ref={datePopoverRef}
              initial={
                isMobile
                  ? { opacity: 0, scale: 0.92 }
                  : { opacity: 0, y: dateOpenUpward ? -10 : 10, scale: 0.95 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                isMobile
                  ? { opacity: 0, scale: 0.92 }
                  : { opacity: 0, y: dateOpenUpward ? -10 : 10, scale: 0.95 }
              }
              transition={{ duration: 0.15 }}
              className={`picker-popover date-popover card-lowest ${!isMobile && dateOpenUpward ? "popover-above" : ""}`}
              style={
                isMobile
                  ? {}
                  : {
                      top: dateOpenUpward ? "auto" : "calc(100% + 6px)",
                      bottom: dateOpenUpward ? "calc(100% + 6px)" : "auto",
                    }
              }
              onTouchMove={(e) => isMobile && e.stopPropagation()}
            >
              {/* Calendar Header */}
              <div className="calendar-header">
                <button type="button" className="nav-arrow" onClick={handlePrevMonth} aria-label="Previous month">
                  <ChevronLeft size={16} />
                </button>
                <span className="calendar-title">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button type="button" className="nav-arrow" onClick={handleNextMonth} aria-label="Next month">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Weekday Labels */}
              <div className="weekday-labels">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(label => (
                  <span key={label} className="weekday-label">{label}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="days-grid">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="day-cell empty" />;
                  }

                  const cellDateString = formatDateISO(currentYear, currentMonth, day);
                  const isSelected = pickupDate === cellDateString;
                  
                  const cellDate = new Date(currentYear, currentMonth, day);
                  const todayStart = new Date(minValid.getFullYear(), minValid.getMonth(), minValid.getDate());
                  const isPast = cellDate.getTime() < todayStart.getTime() ||
                    (cellDate.getTime() === todayStart.getTime() && (minValid.getHours() > 23 || (minValid.getHours() === 23 && minValid.getMinutes() >= 30)));

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      disabled={isPast}
                      className={`day-cell ${isSelected ? "selected" : ""} ${isPast ? "disabled" : ""}`}
                      onClick={() => handleDateSelect(day)}
                    >
                      {day}
                    </button>
                  );
                })}
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
                      top: timeOpenUpward ? "auto" : "calc(100% + 6px)",
                      bottom: timeOpenUpward ? "calc(100% + 6px)" : "auto",
                    }
              }
              onTouchMove={(e) => isMobile && e.stopPropagation()}
            >
              <div className="time-picker-title">Select {timeLabel || "Pickup Time"}</div>
              
              <div className="time-columns-container">
                {/* Hours Column */}
                <div className="time-column">
                  <span className="column-header">Hour</span>
                  <div className="column-scroll-area">
                    {hoursOptions.map(h => {
                      const isValid = isHourValid(h);
                      const isSelected = tempHour === h;
                      return (
                        <button
                          key={`hour-${h}`}
                          type="button"
                          disabled={!isValid}
                          className={`time-cell ${isSelected ? "selected" : ""} ${!isValid ? "disabled" : ""}`}
                          onClick={() => adjustTempSelection(h, tempMinute, tempPeriod)}
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
                      const isValid = isMinuteValid(m);
                      const isSelected = tempMinute === m;
                      return (
                        <button
                          key={`min-${m}`}
                          type="button"
                          disabled={!isValid}
                          className={`time-cell ${isSelected ? "selected" : ""} ${!isValid ? "disabled" : ""}`}
                          onClick={() => adjustTempSelection(tempHour, m, tempPeriod)}
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
                      const isValid = isPeriodValid(p);
                      const isSelected = tempPeriod === p;
                      return (
                        <button
                          key={`period-${p}`}
                          type="button"
                          disabled={!isValid}
                          className={`time-cell ${isSelected ? "selected" : ""} ${!isValid ? "disabled" : ""}`}
                          onClick={() => adjustTempSelection(tempHour, tempMinute, p)}
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
    <div
      className="datetime-picker-row"
      style={{
        ...(showDate === false ? { gridTemplateColumns: "1fr" } : {}),
        zIndex: isOpen && !isMobile ? 500 : undefined,
      }}
    >
      {/* DATE PICKER FIELD */}
      {showDate !== false && (
        <div className="picker-wrapper" ref={datePickerRef}>
          <label className="input-label" style={{ display: 'block', marginBottom: '0.35rem' }}>{dateLabel || "Pickup Date"}</label>
          <div 
            className={`custom-picker-trigger ${showDatePicker ? "active" : ""}`}
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowTimePicker(false);
            }}
          >
            <Calendar size={18} className="trigger-icon" />
            <div className="trigger-text-wrapper">
              <span className="trigger-value">{formatDisplayDate(pickupDate)}</span>
            </div>
          </div>

          {renderDatePickerPopover()}
        </div>
      )}

      {/* TIME PICKER FIELD */}
      <div className="picker-wrapper" ref={timePickerRef}>
        <label className="input-label" style={{ display: 'block', marginBottom: '0.35rem' }}>{timeLabel || "Pickup Time"}</label>
        <div 
          className={`custom-picker-trigger ${showTimePicker ? "active" : ""}`}
          onClick={() => {
            setShowTimePicker(!showTimePicker);
            setShowDatePicker(false);
          }}
        >
          <Clock size={18} className="trigger-icon" />
          <div className="trigger-text-wrapper">
            <span className="trigger-value">{formatDisplayTime(pickupTime)}</span>
          </div>
        </div>

        {renderTimePickerPopover()}
      </div>
    </div>
  );
}

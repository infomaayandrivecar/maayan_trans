"use client";

import React, { useState, useEffect } from "react";
import {
  Lock, Mail, LogOut, Search, Calendar, Clock, User, Phone,
  MapPin, Navigation, IndianRupee, RefreshCw, AlertCircle,
  TrendingUp, Compass, HelpCircle, FileText, Printer, Download,
  Edit3, Eye, ArrowLeft, X, Check, CheckCircle2, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Header from "../components/Header";
import DateTimePicker from "../components/DateTimePicker";

interface Booking {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string;
  email_address: string;
  passengers_count: number;
  trip_instructions: string;
  trip_type: "One Way" | "Round Trip";
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  number_of_days: number;
  car_type: string;
  distance_km: number;
  total_fare: number;
  status?: "Pending" | "Active" | "Completed";
}

interface TripSheet {
  booking_id: string;
  serial_no: string;
  organisation: string;
  ds_no: string;
  no_of_guests: string;
  booked_by: string;
  service_type: string;
  address: string;
  date_out: string;
  date_in: string;
  kms_out: number;
  kms_in: number;
  time_out: string;
  time_in: string;
  reporting_time: string;
  chauffeur_name: string;
  chauffeur_phone: string;
  vehicle_start_time: string;
  vehicle_no: string;
  car_allotted: string;
  parking_toll: string;
  standing_instructions: string;
}

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Authentication State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Database State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [tripTypeFilter, setTripTypeFilter] = useState<"All" | "One Way" | "Round Trip">("All");
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Trip Sheet Modal State
  const [activeTripSheetBooking, setActiveTripSheetBooking] = useState<Booking | null>(null);
  const [tripSheetData, setTripSheetData] = useState<TripSheet | null>(null);
  const [tripSheetLoading, setTripSheetLoading] = useState(false);
  const [tripSheetSaving, setTripSheetSaving] = useState(false);
  const [tripSheetView, setTripSheetView] = useState<"edit" | "preview">("edit");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBookings = async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setFetchError(error.message);
      } else {
        setBookings(data || []);
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch bookings");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBookings();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoginError(error.message);
      }
    } catch (err: any) {
      setLoginError(err.message || "An unexpected error occurred");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setBookings([]);
  };

  // Trip Sheet Loading & Saving
  const loadTripSheet = async (booking: Booking) => {
    setActiveTripSheetBooking(booking);
    setTripSheetLoading(true);
    setTripSheetView("edit");
    setSaveSuccess(false);

    try {
      const { data, error } = await supabase
        .from("trip_sheets")
        .select("*")
        .eq("booking_id", booking.id)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 means record not found
        console.error("Error loading trip sheet:", error.message);
      }

      if (data) {
        setTripSheetData(data);
      } else {
        // Initialize default Trip Sheet
        const randomSerial = Math.floor(100000 + Math.random() * 900000).toString();
        const randomDS = Math.floor(10000 + Math.random() * 90000).toString();

        // Calculate a default end date
        let dateIn = booking.pickup_date;
        try {
          const dateObj = new Date(booking.pickup_date);
          dateObj.setDate(dateObj.getDate() + (booking.number_of_days - 1));
          dateIn = dateObj.toISOString().split("T")[0];
        } catch (e) { }

        setTripSheetData({
          booking_id: booking.id,
          serial_no: randomSerial,
          organisation: "",
          ds_no: `DS-${randomDS}`,
          no_of_guests: `${booking.passengers_count} Adults`,
          booked_by: booking.full_name,
          service_type: booking.trip_type === "Round Trip" ? "Outstation Round Trip" : "Outstation One Way",
          address: booking.pickup_location,
          date_out: booking.pickup_date,
          date_in: dateIn,
          kms_out: 0,
          kms_in: 0,
          time_out: booking.pickup_time,
          time_in: "",
          reporting_time: "07:00",
          chauffeur_name: "",
          chauffeur_phone: "",
          vehicle_start_time: "07:30",
          vehicle_no: "",
          car_allotted: booking.car_type,
          parking_toll: "",
          standing_instructions: booking.trip_instructions || "Local Run / Outstation Travel"
        });
      }
    } catch (err) {
      console.error("Unexpected error fetching trip sheet:", err);
    } finally {
      setTripSheetLoading(false);
    }
  };

  const handleSaveTripSheet = async () => {
    if (!tripSheetData) return;
    setTripSheetSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from("trip_sheets")
        .upsert(tripSheetData);

      if (error) {
        alert("Error saving trip sheet: " + error.message);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert("Error saving trip sheet: " + (err.message || err));
    } finally {
      setTripSheetSaving(false);
    }
  };

  const updateStatus = async (bookingId: string, newStatus: "Pending" | "Active" | "Completed") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) {
        alert("Error updating status: " + error.message);
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } catch (err: any) {
      alert("Error updating status: " + (err.message || err));
    }
  };

  // Calculation helpers
  const calculateTotalDays = () => {
    if (!tripSheetData?.date_out || !tripSheetData?.date_in) return 1;
    try {
      const d1 = new Date(tripSheetData.date_out);
      const d2 = new Date(tripSheetData.date_in);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) ? 1 : diffDays;
    } catch (e) {
      return 1;
    }
  };

  const calculateTotalKms = () => {
    if (!tripSheetData) return "---";
    const outVal = parseFloat(tripSheetData.kms_out as any) || 0;
    const inVal = parseFloat(tripSheetData.kms_in as any) || 0;
    if (inVal > 0 && inVal >= outVal) {
      return `${(inVal - outVal).toLocaleString("en-IN")} KM`;
    }
    return "---";
  };

  const calculateTotalTime = () => {
    if (!tripSheetData?.time_out || !tripSheetData?.time_in) return "---";
    try {
      const [h1, m1] = tripSheetData.time_out.split(":").map(Number);
      const [h2, m2] = tripSheetData.time_in.split(":").map(Number);
      if (isNaN(h1) || isNaN(h2)) return "---";
      let diffMins = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diffMins < 0) diffMins += 24 * 60; // Crosses midnight
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours} hr ${mins} min`;
    } catch (e) {
      return "---";
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.phone_number.includes(searchQuery) ||
      booking.pickup_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.dropoff_location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTripType =
      tripTypeFilter === "All" || booking.trip_type === tripTypeFilter;

    return matchesSearch && matchesTripType;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Auto-reset page number when search/filters change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [searchQuery, tripTypeFilter, totalPages, currentPage]);

  // Calculate quick stats
  const totalRevenue = bookings
    .filter(b => b.status === "Completed")
    .reduce((sum, b) => sum + (b.total_fare || 0), 0);
  const completedTripsCount = bookings.filter(b => b.status === "Completed").length;
  const activeTripsCount = bookings.filter(b => b.status === "Active").length;

  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

  if (authLoading) {
    return (
      <div className="landing-page" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="spinner-small" style={{ width: "40px", height: "40px", borderTopColor: "var(--primary-container)" }}></div>
      </div>
    );
  }

  return (
    <div className="landing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* LOCAL STYLES FOR PRINTING TRIP SHEET */}
      <style jsx global>{`
        @media print {
          @page {
            size: portrait;
            margin: 10mm;
          }
          html, body {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          /* Hide all sibling layout modules on print to completely free page flow */
          header, .sticky-header, main.main-content, .no-print {
            display: none !important;
          }
          .print-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 99999 !important;
            box-shadow: none !important;
          }
          .print-modal-content {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print-overflow {
            overflow: visible !important;
            padding: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .print-container {
            padding: 1.25rem 1rem !important;
            font-size: 10px !important;
          }
          .print-container table {
            font-size: 9px !important;
          }
          .print-container td {
            padding: 4px 6px !important;
          }
          .booking-id-cell {
            word-break: break-all !important;
          }
        }
        @media (max-width: 600px) {
          .print-modal-content.card-container {
            padding: 1.25rem 1rem !important;
          }
          .datetime-picker-row {
            flex-direction: column !important;
            gap: 1rem !important;
          }
          .preview-actions-wrapper {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.5rem !important;
          }
          .preview-actions-wrapper button {
            width: 100% !important;
            padding: 0.75rem 1.2rem !important;
            border-radius: var(--radius-sm) !important;
            justify-content: center !important;
          }
          .preview-header-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .preview-header-container > div:last-child {
            text-align: left !important;
          }
        }
        @media (max-width: 480px) {
          .print-modal-content.card-container {
            padding: 1rem 0.75rem !important;
          }
          .print-container {
            padding: 1rem 0.5rem !important;
          }
          .preview-logo-wrapper {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
        }

        /* Theme styles for booking card left border */
        .round-trip-card {
          border-left: 4px solid var(--primary-container) !important;
        }
        [data-theme="dark"] .round-trip-card {
          border-left: 4px solid var(--primary) !important;
        }
        .one-way-card {
          border-left: 4px solid var(--on-surface-variant) !important;
        }

        /* Theme styles for trip type badges */
        .trip-badge {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          display: inline-block;
          margin-bottom: 0.4rem;
        }
        .trip-badge.round-trip {
          background-color: rgba(255, 179, 0, 0.12) !important;
          color: #d97706 !important;
        }
        [data-theme="dark"] .trip-badge.round-trip {
          color: #ffb300 !important;
        }
        .trip-badge.one-way {
          background-color: rgba(17, 17, 17, 0.05) !important;
          color: var(--on-surface) !important;
        }
        [data-theme="dark"] .trip-badge.one-way {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* Status badge styling */
        .status-badge {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
          display: inline-block;
          letter-spacing: 0.05em;
        }
        .status-badge.pending {
          background-color: rgba(245, 158, 11, 0.1) !important;
          color: #f59e0b !important;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .status-badge.active {
          background-color: rgba(59, 130, 246, 0.1) !important;
          color: #3b82f6 !important;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .status-badge.completed {
          background-color: rgba(16, 185, 129, 0.1) !important;
          color: #10b981 !important;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        /* Status selector buttons styling */
        .status-btn {
          padding: 0.4rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          border: 1px solid var(--outline-variant);
          cursor: pointer;
          background: var(--surface-container-low);
          color: var(--on-surface-variant);
          transition: all 0.2s;
        }
        .status-btn:hover {
          background: var(--surface-container-high);
        }
        .status-btn.selected {
          background: var(--primary-container) !important;
          color: var(--on-primary-container) !important;
          border-color: var(--primary-container) !important;
        }
        [data-theme="dark"] .status-btn.selected {
          background: var(--primary) !important;
          color: var(--on-primary) !important;
          border-color: var(--primary) !important;
        }
      `}</style>

      <Header />

      <main className="main-content" style={{ flex: 1, padding: "2rem 1.5rem" }}>
        {!session ? (
          // ================= LOGIN SCREEN =================
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "65vh" }}>
            <motion.div
              className="card-container"
              style={{ maxWidth: "420px", width: "100%", padding: "2.5rem" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <span className="hero-badge label-sm">System Access</span>
                <h2 className="headline-md" style={{ marginTop: "0.5rem" }}>Admin Portal</h2>
                <p className="body-md" style={{ marginTop: "0.5rem" }}>Please sign in to access the bookings dashboard.</p>
              </div>

              <form onSubmit={handleLogin} className="booking-form">
                <div className="input-field-container">
                  <label htmlFor="email-input" className="input-label">Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={18} />
                    <input
                      type="email"
                      id="email-input"
                      required
                      placeholder="admin@maayantrans.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-field-container">
                  <label htmlFor="password-input" className="input-label">Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      type="password"
                      id="password-input"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="error-message-box">
                    <span className="error-text">{loginError}</span>
                  </div>
                )}

                <motion.button
                  type="submit"
                  className="btn-primary"
                  disabled={loginLoading}
                  style={{ width: "100%", marginTop: "1rem", display: "flex", justifyContent: "center" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loginLoading ? <div className="spinner-small"></div> : "Login to Portal"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        ) : (
          // ================= DASHBOARD SCREEN =================
          <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>

            {/* Dashboard Header Banner */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              <div>
                <h1 className="headline-md" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  Bookings Dashboard
                </h1>
                <p className="body-md">Manage and review all reservation requests.</p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button
                  onClick={fetchBookings}
                  className="btn-secondary"
                  style={{ padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  disabled={fetchLoading}
                >
                  <RefreshCw size={14} className={fetchLoading ? "animate-spin" : ""} style={{ animation: fetchLoading ? "spin 1s linear infinite" : "none" }} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="btn-primary"
                  style={{
                    padding: "0.6rem 1.2rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "none",
                    background: "var(--primary-container)"
                  }}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "2rem", gap: "1.5rem" }}>
              <div className="feature-card card-lowest" style={{ padding: "1.5rem" }}>
                <div className="feature-icon-wrap" style={{ width: "36px", height: "36px", marginBottom: "1rem" }}><FileText size={18} /></div>
                <span className="input-label" style={{ fontSize: "0.65rem" }}>Total Requests</span>
                <h3 className="display-lg" style={{ fontSize: "1.8rem", marginTop: "0.25rem" }}>{bookings.length}</h3>
              </div>

              <div className="feature-card card-lowest" style={{ padding: "1.5rem" }}>
                <div className="feature-icon-wrap" style={{ width: "36px", height: "36px", marginBottom: "1rem", backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}><TrendingUp size={18} /></div>
                <span className="input-label" style={{ fontSize: "0.65rem" }}>Est. Gross Revenue</span>
                <h3 className="display-lg" style={{ fontSize: "1.8rem", marginTop: "0.25rem", color: "var(--primary)" }}>
                  ₹{totalRevenue.toLocaleString("en-IN")}/-
                </h3>
              </div>



              <div className="feature-card card-lowest" style={{ padding: "1.5rem" }}>
                <div className="feature-icon-wrap" style={{ width: "36px", height: "36px", marginBottom: "1rem", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}><CheckCircle2 size={18} /></div>
                <span className="input-label" style={{ fontSize: "0.65rem" }}>Completed Trips</span>
                <h3 className="display-lg" style={{ fontSize: "1.8rem", marginTop: "0.25rem" }}>{completedTripsCount}</h3>
              </div>

              <div className="feature-card card-lowest" style={{ padding: "1.5rem" }}>
                <div className="feature-icon-wrap" style={{ width: "36px", height: "36px", marginBottom: "1rem", backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}><Activity size={18} /></div>
                <span className="input-label" style={{ fontSize: "0.65rem" }}>Active Trips</span>
                <h3 className="display-lg" style={{ fontSize: "1.8rem", marginTop: "0.25rem" }}>{activeTripsCount}</h3>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="card-lowest" style={{ padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div className="input-wrapper" style={{ flex: 1, minWidth: "260px", maxWidth: "450px" }}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by ID, customer name, phone, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="input-label" style={{ margin: 0 }}>Trip Type:</span>
                <div className="input-wrapper" style={{ paddingRight: "0.5rem" }}>
                  <select
                    value={tripTypeFilter}
                    onChange={(e: any) => setTripTypeFilter(e.target.value)}
                    style={{ padding: "0.5rem 2rem 0.5rem 1rem", border: "none", background: "transparent", color: "var(--on-surface)", cursor: "pointer" }}
                  >
                    <option value="All">All Types</option>
                    <option value="One Way">One Way</option>
                    <option value="Round Trip">Round Trip</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {fetchError && (
              <div className="error-message-box" style={{ marginBottom: "1.5rem" }}>
                <span className="error-text">Error loading bookings: {fetchError}</span>
              </div>
            )}

            {/* Bookings List */}
            {fetchLoading && bookings.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                <div className="spinner-small" style={{ width: "30px", height: "30px", borderTopColor: "var(--primary)" }}></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="card-lowest" style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <AlertCircle size={40} style={{ color: "var(--on-surface-variant)", opacity: 0.5, marginBottom: "1rem" }} />
                <h3 className="title-md">No bookings found</h3>
                <p className="body-md">No records matched your search query or filter selection.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {currentBookings.map((booking) => {
                  const isExpanded = expandedBookingId === booking.id;
                  const bookingDate = new Date(booking.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const bookingTime = new Date(booking.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <motion.div
                      key={booking.id}
                      className={`card-lowest ${booking.trip_type === "Round Trip" ? "round-trip-card" : "one-way-card"}`}
                      style={{
                        padding: "1.25rem 1.5rem",
                        cursor: "pointer"
                      }}
                      onClick={() => toggleExpand(booking.id)}
                      layout
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: "260px" }}>
                          <div>
                            <span className="hero-badge label-sm" style={{ padding: "0.25rem 0.6rem", fontSize: "0.6rem", textTransform: "none", marginBottom: 0, display: "inline-block" }}>
                              {booking.id}
                            </span>
                            <h3 className="title-md" style={{ marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              {booking.full_name}
                            </h3>
                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.25rem", color: "var(--on-surface-variant)", fontSize: "0.8rem" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Phone size={12} /> {booking.phone_number}
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Calendar size={12} /> {bookingDate} at {bookingTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <span className={`status-badge ${(booking.status || "Pending").toLowerCase()}`}>
                              {booking.status || "Pending"}
                            </span>
                            <span className={`trip-badge ${booking.trip_type === "Round Trip" ? "round-trip" : "one-way"}`}>
                              {booking.trip_type}
                            </span>
                          </div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)", marginTop: "0.2rem" }}>
                            ₹{booking.total_fare.toLocaleString("en-IN")}/-
                          </div>
                        </div>
                      </div>

                      {/* Route overview */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginTop: "1rem",
                        padding: "0.6rem 0.8rem",
                        backgroundColor: "var(--surface-container-low)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.8rem"
                      }}>
                        <MapPin size={14} style={{ color: "#d97706" }} />
                        <span style={{ fontWeight: "600" }}>{booking.pickup_location.split(",")[0]}</span>
                        <span style={{ color: "var(--on-surface-variant)", opacity: 0.6 }}>➔</span>
                        <MapPin size={14} style={{ color: "var(--on-surface)" }} />
                        <span style={{ fontWeight: "600" }}>{booking.dropoff_location.split(",")[0]}</span>
                      </div>

                      {/* Expanded Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: "hidden", marginTop: "1rem", borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}
                            onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking details
                          >
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                              <div>
                                <h4 className="label-sm" style={{ marginBottom: "0.5rem", color: "#d97706" }}>Customer Contact Details</h4>
                                <p className="body-md"><strong>Email:</strong> <a href={`mailto:${booking.email_address}`} style={{ color: "inherit", textDecoration: "underline" }}>{booking.email_address}</a></p>
                                <p className="body-md"><strong>Phone:</strong> <a href={`tel:${booking.phone_number}`} style={{ color: "inherit", textDecoration: "underline" }}>{booking.phone_number}</a></p>
                                <p className="body-md"><strong>Passengers:</strong> {booking.passengers_count}</p>
                              </div>

                              <div>
                                <h4 className="label-sm" style={{ marginBottom: "0.5rem", color: "#d97706" }}>Trip Parameters</h4>
                                <p className="body-md"><strong>Pickup Date:</strong> {booking.pickup_date} at {booking.pickup_time}</p>
                                {booking.trip_type === "Round Trip" && (
                                  <p className="body-md"><strong>Duration:</strong> {booking.number_of_days} {booking.number_of_days === 1 ? "Day" : "Days"}</p>
                                )}
                                <p className="body-md"><strong>Vehicle:</strong> {booking.car_type}</p>
                                <p className="body-md"><strong>Est. Distance:</strong> {booking.distance_km} km</p>
                              </div>

                              <div>
                                <h4 className="label-sm" style={{ marginBottom: "0.5rem", color: "#d97706" }}>Trip Status</h4>
                                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                                  {(["Pending", "Active", "Completed"] as const).map((statusOption) => {
                                    const isSelected = (booking.status || "Pending") === statusOption;
                                    return (
                                      <button
                                        key={statusOption}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateStatus(booking.id, statusOption);
                                        }}
                                        className={`status-btn ${isSelected ? "selected" : ""}`}
                                      >
                                        {statusOption}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-start", gap: "0.5rem" }}>
                                <h4 className="label-sm" style={{ marginBottom: "0.5rem", color: "#d97706" }}>Actions</h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadTripSheet(booking);
                                  }}
                                  className="btn-primary"
                                  style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", width: "100%", textTransform: "none", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center", boxShadow: "none" }}
                                >
                                  <FileText size={14} />
                                  <span>Manage Trip Sheet</span>
                                </button>
                              </div>
                            </div>

                            <div style={{ marginTop: "1rem" }}>
                              <h4 className="label-sm" style={{ marginBottom: "0.5rem", color: "#d97706" }}>Exact Route Details</h4>
                              <p className="body-md"><strong>Pickup:</strong> {booking.pickup_location}</p>
                              <p className="body-md"><strong>Destination:</strong> {booking.dropoff_location}</p>
                            </div>

                            {booking.trip_instructions && (
                              <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", backgroundColor: "var(--surface-container)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--primary-container)" }}>
                                <h4 className="label-sm" style={{ marginBottom: "0.25rem" }}>Special Instructions</h4>
                                <p className="body-md" style={{ fontStyle: "italic" }}>"{booking.trip_instructions}"</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="no-print" style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginTop: "2rem",
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--outline-variant)"
              }}>
                <div className="body-md" style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>
                  Showing <strong style={{ color: "var(--on-surface)" }}>{indexOfFirstItem + 1}</strong> to <strong style={{ color: "var(--on-surface)" }}>{Math.min(indexOfLastItem, filteredBookings.length)}</strong> of <strong style={{ color: "var(--on-surface)" }}>{filteredBookings.length}</strong> bookings
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary"
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.8rem",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      borderRadius: "var(--radius-sm)"
                    }}
                  >
                    &larr; Prev
                  </button>

                  {/* Page Numbers */}
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      const isCurrent = currentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className="btn-secondary"
                          style={{
                            width: "32px",
                            height: "32px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            borderRadius: "var(--radius-sm)",
                            border: isCurrent ? "1px solid var(--primary-container)" : "none",
                            background: isCurrent ? "var(--primary-container)" : "var(--surface-container-low)",
                            color: isCurrent ? "#111" : "var(--on-surface)"
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary"
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.8rem",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      borderRadius: "var(--radius-sm)"
                    }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= TRIP SHEET DIALOG / MODAL ================= */}
      <AnimatePresence>
        {activeTripSheetBooking && tripSheetData && (
          <div className="print-modal-overlay" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem"
          }}>
            <motion.div
              className="print-modal-content card-container"
              style={{
                maxWidth: "950px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                backgroundColor: "var(--surface)",
                padding: "2rem",
                position: "relative"
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >

              {/* Modal Controls (Hidden during print) */}
              <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "1rem" }}>
                <div>
                  <h2 className="title-md" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={20} />
                    <span>Trip Sheet (Duty Slip)</span>
                  </h2>
                  <p className="body-md" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>Booking ID: {activeTripSheetBooking.id}</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ display: "flex", background: "var(--surface-container)", borderRadius: "var(--radius-full)", padding: "2px" }}>
                    <button
                      onClick={() => setTripSheetView("edit")}
                      className="tab-btn"
                      style={{
                        padding: "0.4rem 1rem",
                        fontSize: "0.75rem",
                        borderRadius: "var(--radius-full)",
                        border: "none",
                        color: tripSheetView === "edit" ? "var(--on-primary)" : "var(--on-surface-variant)",
                        background: tripSheetView === "edit" ? "var(--primary)" : "transparent",
                        fontWeight: "600",
                        boxShadow: tripSheetView === "edit" ? "var(--shadow-ambient)" : "none"
                      }}
                    >
                      <Edit3 size={12} style={{ display: "inline-block", marginRight: "4px" }} />
                      Edit Details
                    </button>
                    <button
                      onClick={() => setTripSheetView("preview")}
                      className="tab-btn"
                      style={{
                        padding: "0.4rem 1rem",
                        fontSize: "0.75rem",
                        borderRadius: "var(--radius-full)",
                        border: "none",
                        color: tripSheetView === "preview" ? "var(--on-primary)" : "var(--on-surface-variant)",
                        background: tripSheetView === "preview" ? "var(--primary)" : "transparent",
                        fontWeight: "600",
                        boxShadow: tripSheetView === "preview" ? "var(--shadow-ambient)" : "none"
                      }}
                    >
                      <Eye size={12} style={{ display: "inline-block", marginRight: "4px" }} />
                      Preview Slip
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTripSheetBooking(null)}
                    className="btn-secondary"
                    style={{ padding: "0.4rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {tripSheetLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                  <div className="spinner-small" style={{ width: "30px", height: "30px", borderTopColor: "var(--primary)" }}></div>
                </div>
              ) : (
                <div>

                  {/* ================= EDIT VIEW ================= */}
                  {tripSheetView === "edit" && (
                    <div className="no-print">
                      <div className="booking-form" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>

                        {/* Column 1 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div className="input-field-container">
                            <label className="input-label">Trip Serial Number</label>
                            <div className="input-wrapper">
                              <FileText size={16} />
                              <input
                                type="text"
                                value={tripSheetData.serial_no}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, serial_no: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Organisation / Company Name</label>
                            <div className="input-wrapper">
                              <User size={16} />
                              <input
                                type="text"
                                placeholder="e.g. Sanofi Healthcare India Pvt Ltd"
                                value={tripSheetData.organisation}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, organisation: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Duty Slip No. (DS No.)</label>
                            <div className="input-wrapper">
                              <FileText size={16} />
                              <input
                                type="text"
                                value={tripSheetData.ds_no}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, ds_no: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Booked By (Staff / desk)</label>
                            <div className="input-wrapper">
                              <User size={16} />
                              <input
                                type="text"
                                value={tripSheetData.booked_by}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, booked_by: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Number of Guests</label>
                            <div className="input-wrapper">
                              <User size={16} />
                              <input
                                type="text"
                                value={tripSheetData.no_of_guests}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, no_of_guests: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Service Type / Run Scope</label>
                            <div className="input-wrapper">
                              <Compass size={16} />
                              <input
                                type="text"
                                value={tripSheetData.service_type}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, service_type: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Reporting Time</label>
                            <div className="input-wrapper">
                              <Clock size={16} />
                              <input
                                type="text"
                                placeholder="e.g. 07:00 AM"
                                value={tripSheetData.reporting_time}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, reporting_time: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Vehicle Start Time</label>
                            <div className="input-wrapper">
                              <Clock size={16} />
                              <input
                                type="text"
                                placeholder="e.g. 07:30 AM"
                                value={tripSheetData.vehicle_start_time}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, vehicle_start_time: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 2 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div className="input-field-container">
                            <label className="input-label">Reporting Address</label>
                            <div className="input-wrapper">
                              <MapPin size={16} />
                              <input
                                type="text"
                                value={tripSheetData.address}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, address: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Chauffeur Name</label>
                            <div className="input-wrapper">
                              <User size={16} />
                              <input
                                type="text"
                                placeholder="e.g. Akash R."
                                value={tripSheetData.chauffeur_name}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, chauffeur_name: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Chauffeur Phone</label>
                            <div className="input-wrapper">
                              <Phone size={16} />
                              <input
                                type="text"
                                placeholder="e.g. +91 9994417006"
                                value={tripSheetData.chauffeur_phone}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, chauffeur_phone: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Vehicle Number</label>
                            <div className="input-wrapper">
                              <Navigation size={16} />
                              <input
                                type="text"
                                placeholder="e.g. TN-37-BY-1234"
                                value={tripSheetData.vehicle_no}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, vehicle_no: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Car Allotted</label>
                            <div className="input-wrapper">
                              <Navigation size={16} />
                              <input
                                type="text"
                                value={tripSheetData.car_allotted}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, car_allotted: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Parking & Toll charges</label>
                            <div className="input-wrapper">
                              <IndianRupee size={16} />
                              <input
                                type="text"
                                placeholder="e.g. Paid by Customer / ₹450"
                                value={tripSheetData.parking_toll}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, parking_toll: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Standing Instructions</label>
                            <div className="input-wrapper">
                              <FileText size={16} />
                              <input
                                type="text"
                                value={tripSheetData.standing_instructions}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, standing_instructions: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Out / In Matrix */}
                      <h4 className="label-sm" style={{ margin: "1.5rem 0 0.5rem 0", color: "#d97706" }}>Trip Out/In Details</h4>
                      <div className="booking-form" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                        {/* Out Details */}
                        <div className="card-lowest" style={{ padding: "1.25rem" }}>
                          <span className="label-sm" style={{ display: "block", marginBottom: "1rem", color: "var(--primary)" }}>Departing / Out Details</span>
                          <DateTimePicker
                            pickupDate={tripSheetData.date_out}
                            pickupTime={tripSheetData.time_out}
                            setPickupDate={(date) => setTripSheetData({ ...tripSheetData, date_out: date })}
                            setPickupTime={(time) => setTripSheetData({ ...tripSheetData, time_out: time })}
                          />
                          <div className="input-field-container" style={{ marginTop: "1rem" }}>
                            <label className="input-label">Kilometers Out</label>
                            <div className="input-wrapper">
                              <input
                                type="number"
                                style={{ paddingLeft: "1.25rem" }}
                                value={tripSheetData.kms_out || ""}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, kms_out: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* In Details */}
                        <div className="card-lowest" style={{ padding: "1.25rem" }}>
                          <span className="label-sm" style={{ display: "block", marginBottom: "1rem", color: "var(--primary)" }}>Returning / In Details</span>
                          <DateTimePicker
                            pickupDate={tripSheetData.date_in}
                            pickupTime={tripSheetData.time_in || "12:00"}
                            setPickupDate={(date) => setTripSheetData({ ...tripSheetData, date_in: date })}
                            setPickupTime={(time) => setTripSheetData({ ...tripSheetData, time_in: time })}
                          />
                          <div className="input-field-container" style={{ marginTop: "1rem" }}>
                            <label className="input-label">Kilometers In</label>
                            <div className="input-wrapper">
                              <input
                                type="number"
                                style={{ paddingLeft: "1.25rem" }}
                                value={tripSheetData.kms_in || ""}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, kms_in: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Auto Calculated Summary Row */}
                      <div className="card-lowest" style={{
                        padding: "1rem 1.5rem",
                        marginBottom: "1.5rem",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                        gap: "1.5rem",
                        textAlign: "center",
                        background: "var(--surface-container-low)"
                      }}>
                        <div>
                          <span className="input-label">Total Days</span>
                          <div style={{ fontSize: "1.25rem", fontWeight: "800", marginTop: "0.25rem" }}>
                            {calculateTotalDays()} Day(s)
                          </div>
                        </div>
                        <div>
                          <span className="input-label">Total Kilometers</span>
                          <div style={{ fontSize: "1.25rem", fontWeight: "800", marginTop: "0.25rem" }}>
                            {calculateTotalKms()}
                          </div>
                        </div>
                        <div>
                          <span className="input-label">Total Travel Time</span>
                          <div style={{ fontSize: "1.25rem", fontWeight: "800", marginTop: "0.25rem" }}>
                            {calculateTotalTime()}
                          </div>
                        </div>
                      </div>

                      {/* Save Action */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem", borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
                        {saveSuccess && (
                          <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontWeight: "600" }}>
                            <Check size={16} /> Saved Successfully
                          </span>
                        )}

                        <button
                          onClick={handleSaveTripSheet}
                          className="btn-primary"
                          disabled={tripSheetSaving}
                          style={{ minWidth: "150px", display: "flex", justifyContent: "center" }}
                        >
                          {tripSheetSaving ? <div className="spinner-small"></div> : "Save Trip Sheet"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ================= PREVIEW / PRINT VIEW ================= */}
                  {(tripSheetView === "preview" || typeof window === "undefined") && (
                    <div>
                      {/* Action buttons (Hidden during printing) */}
                      <div className="no-print preview-actions-wrapper" style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.75rem",
                        marginBottom: "1.5rem",
                        backgroundColor: "var(--surface-container-low)",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-md)"
                      }}>
                        <button
                          onClick={() => setTripSheetView("edit")}
                          className="btn-secondary"
                          style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                        >
                          <ArrowLeft size={14} />
                          <span>Back to Edit</span>
                        </button>

                        <button
                          onClick={() => window.print()}
                          className="btn-secondary"
                          style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                        >
                          <Printer size={14} />
                          <span>Print</span>
                        </button>

                        <button
                          onClick={() => window.print()}
                          className="btn-primary"
                          style={{ padding: "0.5rem 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", background: "var(--primary-container)", boxShadow: "none" }}
                        >
                          <Download size={14} />
                          <span>Download Trip Sheet</span>
                        </button>
                      </div>

                      {/* Clean printed sheet template (matches physical layout) */}
                      <div style={{ overflowX: "auto", width: "100%", paddingBottom: "1rem" }} className="no-print-overflow">
                        <div className="print-container" style={{
                          border: "1px solid #ddd",
                          borderRadius: "var(--radius-md)",
                          padding: "2.5rem",
                          background: "white",
                          color: "#111",
                          boxShadow: "var(--shadow-ambient)",
                          maxWidth: "800px",
                          margin: "0 auto",
                          fontFamily: "var(--font-body)"
                        }}>

                          {/* Header logo, details, and DS Serial */}
                          <div className="preview-header-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "2px solid #ffb300", paddingBottom: "15px" }}>
                            <div className="preview-logo-wrapper" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                              <div style={{ background: "#111111", color: "white", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", padding: "10px 15px", letterSpacing: "2px", textTransform: "uppercase" }}>
                                MAAYAN
                              </div>
                              <div>
                                <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "16px", color: "#111", letterSpacing: "0.5px", textTransform: "uppercase", lineHeight: 1.2 }}>MAAYAN TRANS & SERVICES</div>
                                <div style={{ fontSize: "10px", color: "#666", fontWeight: "600", letterSpacing: "0.5px", marginTop: "2px" }}>GSTIN: 29MAAYN1234F1Z5 | PAN: MAAYN1234F</div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "9px", color: "#888", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>TRIP SERIAL NUMBER</div>
                              <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "#d97706", marginTop: "2px" }}>
                                DS No: {tripSheetData.serial_no}
                              </div>
                            </div>
                          </div>

                          {/* Detail grid (Structured table) */}
                          <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "1px solid #111",
                            fontSize: "11px",
                            fontFamily: "var(--font-body)",
                            marginBottom: "15px"
                          }}>
                            <tbody>
                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "20%", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>ORGANISATION</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "30%", fontWeight: "bold", fontSize: "11px" }}>{tripSheetData.organisation || "---"}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "20%", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>BOOKING NO</td>
                                <td className="booking-id-cell" style={{ border: "1px solid #111", padding: "8px 12px", width: "30%", fontWeight: "bold" }}>{tripSheetData.booking_id}</td>
                              </tr>
                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>CUSTOMER</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px" }}>{tripSheetData.booked_by} (Mobile: {activeTripSheetBooking.phone_number})</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>DS NO.</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold" }}>{tripSheetData.ds_no}</td>
                              </tr>
                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>REP. ADDRESS</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px" }}>{tripSheetData.address}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>NO OF GUEST</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px" }}>{tripSheetData.no_of_guests}</td>
                              </tr>
                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>SERVICE TYPE</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "700", color: "#d97706" }}>{tripSheetData.service_type}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>BOOKED BY</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px" }}>{tripSheetData.booked_by}</td>
                              </tr>

                              {/* Sub headers details out in total */}
                              <tr style={{ background: "#f5f5f5" }}>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold", color: "#333", fontSize: "10px" }}>DETAILS</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold", textAlign: "center", color: "#333", fontSize: "10px" }}>OUT</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold", textAlign: "center", color: "#333", fontSize: "10px" }}>IN</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold", textAlign: "center", color: "#333", fontSize: "10px" }}>TOTAL</td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>DATE</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center" }}>{tripSheetData.date_out}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center" }}>{tripSheetData.date_in || "---"}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontWeight: "bold" }}>{calculateTotalDays()} Day(s)</td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>KILOMETERS</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center" }}>{tripSheetData.kms_out.toLocaleString("en-IN")} KM</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontStyle: tripSheetData.kms_in > 0 ? "normal" : "italic", color: tripSheetData.kms_in > 0 ? "inherit" : "#888" }}>
                                  {tripSheetData.kms_in > 0 ? `${tripSheetData.kms_in.toLocaleString("en-IN")} KM` : "To be filled"}
                                </td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontWeight: "bold" }}>{calculateTotalKms()}</td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>TIME</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center" }}>{tripSheetData.time_out}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontStyle: tripSheetData.time_in ? "normal" : "italic", color: tripSheetData.time_in ? "inherit" : "#888" }}>
                                  {tripSheetData.time_in || "To be filled"}
                                </td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontWeight: "bold" }}>{calculateTotalTime()}</td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>REPORTING TIME</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold" }}>{tripSheetData.reporting_time}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>CHAUFFEUR</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold" }}>
                                  {tripSheetData.chauffeur_name ? `${tripSheetData.chauffeur_name} (${tripSheetData.chauffeur_phone})` : "To be filled"}
                                </td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>VEHICLE START TIME</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold" }}>{tripSheetData.vehicle_start_time}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>VEHICLE NO.</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold" }}>{tripSheetData.vehicle_no || "To be allotted"}</td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>CAR BOOKED</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px" }}>{activeTripSheetBooking.car_type}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>CAR ALLOTTED</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px" }}>{tripSheetData.car_allotted}</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Instructions, Toll and Parking */}
                          <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "1px solid #111",
                            fontSize: "11px",
                            marginBottom: "30px"
                          }}>
                            <tbody>
                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "25%", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>PARKING & TOLL</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "25%" }}>{tripSheetData.parking_toll || "---"}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "25%", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>STANDING INST.</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "25%" }}>{tripSheetData.standing_instructions || "---"}</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Signature Block */}
                          <div style={{
                            marginTop: "50px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center"
                          }}>
                            <div style={{
                              border: "1px dashed #aaa",
                              borderRadius: "var(--radius-sm)",
                              padding: "25px",
                              width: "80%",
                              textAlign: "center",
                              background: "#fafafa"
                            }}>
                              <div style={{ fontSize: "14px", color: "#ccc", marginBottom: "8px" }}>✏️</div>
                              <span style={{ fontSize: "9px", fontWeight: "bold", color: "#666", letterSpacing: "1px", textTransform: "uppercase" }}>
                                CUSTOMER / AUTH. SIGNATURE
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

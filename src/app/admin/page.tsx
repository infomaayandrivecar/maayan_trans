"use client";

import React, { useState, useEffect } from "react";
import {
  Lock, Mail, LogOut, Search, Calendar, Clock, User, Phone,
  MapPin, Navigation, IndianRupee, RefreshCw, AlertCircle,
  TrendingUp, Compass, HelpCircle, FileText, Printer, Download,
  Edit3, Eye, ArrowLeft, X, Check, CheckCircle2, Activity, Settings,
  MessageSquare, Trash2, Plus, Car
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Header from "../components/Header";
import DateTimePicker from "../components/DateTimePicker";
import TimePicker from "../components/TimePicker";
import { useBooking } from "../context/BookingContext";

interface Booking {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string;
  email_address?: string;
  passengers_count: number;
  trip_instructions: string;
  trip_type: "One Way" | "Round Trip" | "Outstation Trip";
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  number_of_days: number;
  car_type: string;
  distance_km: number;
  total_fare: number;
  status?: "Pending" | "Active" | "Completed";
  driver_name?: string;
  driver_phone?: string;
  vehicle_no?: string;
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
  service_city: string;
}

const extractDistrictFromAddress = (address: string): string => {
  if (!address) return "";
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";

  const lastPart = parts[parts.length - 1].toLowerCase();
  if (lastPart === "india") {
    if (parts.length >= 3) {
      return parts[parts.length - 3];
    }
    if (parts.length === 2) {
      return parts[0];
    }
  } else {
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
  }
  return parts[0];
};

// Returns a HH:MM time string that is `minutes` earlier than the given HH:MM value
const subtractMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const total = h * 60 + m - minutes;
  const adjusted = ((total % 1440) + 1440) % 1440; // wrap around midnight
  const hh = String(Math.floor(adjusted / 60)).padStart(2, "0");
  const mm = String(adjusted % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

// Formats a HH:MM 24-hour time string into a 12-hour AM/PM string
const formatTimeTo12Hour = (time24: string): string => {
  if (!time24) return "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  const h24 = parseInt(parts[0], 10);
  const min = parseInt(parts[1], 10);
  if (isNaN(h24) || isNaN(min)) return time24;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  h12 = h12 === 0 ? 12 : h12;
  return `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${period}`;
};
const VEHICLE_TYPES: Record<string, { label: string; keys: string[] }> = {
  hatchback: {
    label: "Hatchback",
    keys: ["hatchback"]
  },
  sedan: {
    label: "Sedan",
    keys: ["sedan"]
  },
  premium_sedan: {
    label: "Premium Sedan",
    keys: ["premium_sedan"]
  },
  suv: {
    label: "SUV",
    keys: ["suv"]
  },
  premium_suv: {
    label: "Premium SUV",
    keys: ["premium_suv"]
  }
};

const generateUniqueSerialAndDS = async (bookingId: string): Promise<{ serial_no: string; ds_no: string }> => {
  const idParts = bookingId ? bookingId.split("-") : [];
  let dsSuffix = idParts.length > 0 ? idParts[idParts.length - 1] : Math.floor(10000 + Math.random() * 90000).toString();
  let generatedDS = `DS-${dsSuffix}`;
  let generatedSerial = `TS-${dsSuffix}`;

  try {
    const { data: existingSerials } = await supabase
      .from("trip_sheets")
      .select("serial_no")
      .eq("serial_no", generatedSerial)
      .limit(1);

    if (existingSerials && existingSerials.length > 0) {
      if (idParts.length >= 3) {
        // e.g. MYN-CBE-240626-1827-0011 -> 240626-0011
        const datePart = idParts[idParts.length - 3];
        dsSuffix = `${datePart}-${dsSuffix}`;
      } else {
        dsSuffix = `${dsSuffix}-${Math.floor(100 + Math.random() * 900)}`;
      }
      generatedDS = `DS-${dsSuffix}`;
      generatedSerial = `TS-${dsSuffix}`;
    }
  } catch (e) {
    console.error("Error generating unique serial number:", e);
  }

  return { serial_no: generatedSerial, ds_no: generatedDS };
};


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
  const [tripTypeFilter, setTripTypeFilter] = useState<"All" | "One Way" | "Round Trip" | "Outstation Trip">("All");
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

  // Notify Customer Modal State
  const [notifyBooking, setNotifyBooking] = useState<Booking | null>(null);
  const [notifyVehicleType, setNotifyVehicleType] = useState("");
  const [notifyVehicleNumber, setNotifyVehicleNumber] = useState("");
  const [notifyDriverName, setNotifyDriverName] = useState("");
  const [notifyDriverPhone, setNotifyDriverPhone] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySaving, setNotifySaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Navigation & Settings Form State
  const [activeTab, setActiveTab] = useState<"bookings" | "settings">("bookings");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | null>(null);
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsAddress, setSettingsAddress] = useState("");
  const [settingsMarquee, setSettingsMarquee] = useState("");
  const [settingsGst, setSettingsGst] = useState("");
  const [settingsPan, setSettingsPan] = useState("");
  const [settingsEmails, setSettingsEmails] = useState<string[]>(["info.maayandrivecar@gmail.com"]);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [settingsVehicles, setSettingsVehicles] = useState<Record<string, { ratePerKm: number; driverAllowancePerDay: number; oneWayMinKmPerHour?: number; oneWayHourRate?: number; roundTripHourRate?: number; outstationHourRate?: number; outstationMinKmPerDay?: number; outstationHoursPerDay?: number; }>>({});
  const [settingsMinKmOneWay, setSettingsMinKmOneWay] = useState<number>(5);
  const [settingsMinKmRoundTrip, setSettingsMinKmRoundTrip] = useState<number>(5);
  const [settingsMinKmOutstation, setSettingsMinKmOutstation] = useState<number>(100);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);


  const { state, refreshSettings } = useBooking();

  const loadAdminSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettingsPhone(data.company?.phone || "");
        setSettingsEmail(data.company?.email || "");
        setSettingsAddress(data.company?.address || "");
        setSettingsMarquee(data.company?.marqueeText || "");
        setSettingsGst(data.company?.gst || "");
        setSettingsPan(data.company?.pan || "");
        setSettingsEmails(data.company?.notificationEmails || ["info.maayandrivecar@gmail.com"]);
        setSettingsVehicles(data.vehicles || {});
        setSettingsMinKmOneWay(data.company?.minKmOneWay !== undefined ? Number(data.company.minKmOneWay) : 5);
        setSettingsMinKmRoundTrip(data.company?.minKmRoundTrip !== undefined ? Number(data.company.minKmRoundTrip) : 5);
        setSettingsMinKmOutstation(data.company?.minKmOutstation !== undefined ? Number(data.company.minKmOutstation) : 100);
      }
    } catch (error) {
      console.error("Failed to load admin settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveAdminSettings = async () => {
    setSettingsSaving(true);
    setSettingsSuccess(false);
    try {
      const payload = {
        company: {
          phone: settingsPhone,
          email: settingsEmail,
          address: settingsAddress,
          marqueeText: settingsMarquee,
          notificationEmails: settingsEmails,
          gst: settingsGst,
          pan: settingsPan,
          minKmOneWay: settingsMinKmOneWay,
          minKmRoundTrip: settingsMinKmRoundTrip,
          minKmOutstation: settingsMinKmOutstation
        },
        vehicles: settingsVehicles
      };

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.status === 207) {
        // Partial success: saved locally but DB sync failed
        const errData = await res.json();
        alert(errData.error || "Settings saved locally but could not sync to database. Please check connection.");
      } else if (res.ok) {
        setSettingsSuccess(true);
        if (refreshSettings) {
          await refreshSettings();
        }
        setTimeout(() => setSettingsSuccess(false), 4000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save settings.");
      }
    } catch (error) {
      console.error("Error saving admin settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSettingsSaving(false);
    }
  };



  useEffect(() => {
    if (session) {
      loadAdminSettings();
    }
  }, [session]);

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
        setTripSheetData({
          ...data,
          service_city: data.service_city || extractDistrictFromAddress(booking.pickup_location)
        });
      } else {
        // Initialize default Trip Sheet
        const { serial_no: generatedSerial, ds_no: generatedDS } = await generateUniqueSerialAndDS(booking.id);

        // Calculate a default end date
        let dateIn = booking.pickup_date;
        try {
          const dateObj = new Date(booking.pickup_date);
          dateObj.setDate(dateObj.getDate() + (booking.number_of_days - 1));
          dateIn = dateObj.toISOString().split("T")[0];
        } catch (e) { }

        setTripSheetData({
          booking_id: booking.id,
          serial_no: generatedSerial,
          organisation: "",
          ds_no: generatedDS,
          no_of_guests: `${booking.passengers_count} Adults`,
          booked_by: booking.full_name,
          service_type: booking.trip_type,
          address: booking.pickup_location,
          date_out: booking.pickup_date,
          date_in: dateIn,
          kms_out: 0,
          kms_in: 0,
          time_out: booking.pickup_time,
          time_in: "",
          reporting_time: booking.pickup_time || "07:00",
          chauffeur_name: "",
          chauffeur_phone: "",
          vehicle_start_time: booking.pickup_time ? subtractMinutes(booking.pickup_time, 30) : "06:30",
          vehicle_no: "",
          car_allotted: booking.car_type,
          parking_toll: "",
          standing_instructions: booking.trip_instructions || "",
          service_city: extractDistrictFromAddress(booking.pickup_location)
        });
      }
    } catch (err) {
      console.error("Unexpected error fetching trip sheet:", err);
    } finally {
      setTripSheetLoading(false);
    }
  };

  const handlePrintTripSheet = () => {
    if (!tripSheetData) return;

    // Store original document title and url
    const originalTitle = document.title;
    const originalUrl = window.location.href;

    try {
      // Set title to desired PDF filename (Booking ID_Customer Name)
      const sanitizedName = tripSheetData.booked_by ? tripSheetData.booked_by.replace(/[^a-zA-Z0-9 ]/g, "").trim() : "Customer";
      document.title = `${tripSheetData.booking_id}_${sanitizedName}`;

      // Temporarily change URL to root to remove /admin from browser print footer
      const newUrl = window.location.origin + "/";
      window.history.replaceState({}, "", newUrl);

      // Trigger print dialog
      window.print();
    } finally {
      // Restore original document title and url
      document.title = originalTitle;
      window.history.replaceState({}, "", originalUrl);
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

  const openNotifyModal = async (booking: Booking) => {
    setNotifyBooking(booking);
    setNotifyVehicleType(booking.car_type || "");
    setNotifyVehicleNumber(booking.vehicle_no || "");
    setNotifyDriverName(booking.driver_name || "");
    setNotifyDriverPhone(booking.driver_phone || "");
    setNotifyLoading(true);

    try {
      const { data, error } = await supabase
        .from("trip_sheets")
        .select("chauffeur_name, chauffeur_phone, vehicle_no, car_allotted")
        .eq("booking_id", booking.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading trip sheet for notification:", error.message);
      }

      if (data) {
        if (data.car_allotted) setNotifyVehicleType(data.car_allotted);
        if (data.vehicle_no) setNotifyVehicleNumber(data.vehicle_no);
        if (data.chauffeur_name) setNotifyDriverName(data.chauffeur_name);
        if (data.chauffeur_phone) setNotifyDriverPhone(data.chauffeur_phone);
      }
    } catch (err) {
      console.error("Unexpected error loading trip sheet for notification:", err);
    } finally {
      setNotifyLoading(false);
    }
  };

  const saveNotifyDetails = async (booking: Booking, quiet = false) => {
    setNotifySaving(true);
    try {
      // 1. Update public.bookings table with driver and vehicle info
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          car_type: notifyVehicleType,
          driver_name: notifyDriverName,
          driver_phone: notifyDriverPhone,
          vehicle_no: notifyVehicleNumber
        })
        .eq("id", booking.id);

      if (bookingError) {
        alert("Error saving notification details to booking record: " + bookingError.message);
        return false;
      }

      // 2. Fetch current trip sheet (if exists) to prepare trip sheet upsert
      const { data, error } = await supabase
        .from("trip_sheets")
        .select("*")
        .eq("booking_id", booking.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading trip sheet for notify save:", error.message);
      }

      let updatedTripSheet: TripSheet;

      if (data) {
        updatedTripSheet = {
          ...data,
          car_allotted: notifyVehicleType,
          vehicle_no: notifyVehicleNumber,
          chauffeur_name: notifyDriverName,
          chauffeur_phone: notifyDriverPhone,
          service_city: data.service_city || extractDistrictFromAddress(booking.pickup_location)
        };
      } else {
        const { serial_no: generatedSerial, ds_no: generatedDS } = await generateUniqueSerialAndDS(booking.id);

        let dateIn = booking.pickup_date;
        try {
          const dateObj = new Date(booking.pickup_date);
          dateObj.setDate(dateObj.getDate() + (booking.number_of_days - 1));
          dateIn = dateObj.toISOString().split("T")[0];
        } catch (e) { }

        updatedTripSheet = {
          booking_id: booking.id,
          serial_no: generatedSerial,
          organisation: "",
          ds_no: generatedDS,
          no_of_guests: `${booking.passengers_count} Adults`,
          booked_by: booking.full_name,
          service_type: booking.trip_type,
          address: booking.pickup_location,
          date_out: booking.pickup_date,
          date_in: dateIn,
          kms_out: 0,
          kms_in: 0,
          time_out: booking.pickup_time,
          time_in: "",
          reporting_time: booking.pickup_time || "07:00",
          chauffeur_name: notifyDriverName,
          chauffeur_phone: notifyDriverPhone,
          vehicle_start_time: booking.pickup_time ? subtractMinutes(booking.pickup_time, 30) : "06:30",
          vehicle_no: notifyVehicleNumber,
          car_allotted: notifyVehicleType,
          parking_toll: "",
          standing_instructions: booking.trip_instructions || "",
          service_city: extractDistrictFromAddress(booking.pickup_location)
        };
      }

      // 3. Upsert to public.trip_sheets table
      const { error: upsertError } = await supabase
        .from("trip_sheets")
        .upsert(updatedTripSheet);

      if (upsertError) {
        alert("Error saving notification details to trip sheet: " + upsertError.message);
        return false;
      } else {
        // Update local React bookings list state so the details update on the dashboard instantly
        setBookings((prev) =>
          prev.map((b) =>
            b.id === booking.id
              ? {
                ...b,
                car_type: notifyVehicleType,
                driver_name: notifyDriverName,
                driver_phone: notifyDriverPhone,
                vehicle_no: notifyVehicleNumber
              }
              : b
          )
        );

        if (tripSheetData && tripSheetData.booking_id === booking.id) {
          setTripSheetData(updatedTripSheet);
        }
        if (!quiet) {
          showToast("Customer notification details saved successfully!");
        }
        return true;
      }
    } catch (err: any) {
      alert("Error saving details: " + (err.message || err));
      return false;
    } finally {
      setNotifySaving(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!notifyBooking) return;

    // Save notify details quietly before sending
    await saveNotifyDetails(notifyBooking, true);

    const phone = notifyBooking.phone_number.replace(/\D/g, "");
    const fullPhone = phone.length === 10 ? `91${phone}` : phone;

    // Format pickup date and time for cleaner presentation
    let formattedDateTime = `${notifyBooking.pickup_date} at ${notifyBooking.pickup_time}`;
    try {
      const dateParts = notifyBooking.pickup_date.split("-");
      if (dateParts.length === 3) {
        const year = dateParts[0];
        const monthIndex = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthStr = months[monthIndex] || dateParts[1];

        let timeStr = notifyBooking.pickup_time;
        const timeParts = timeStr.split(":");
        if (timeParts.length >= 2) {
          let hours = parseInt(timeParts[0], 10);
          const minutes = timeParts[1];
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? hours : 12;
          timeStr = `${hours}:${minutes} ${ampm}`;
        }

        formattedDateTime = `${day.toString().padStart(2, '0')} ${monthStr} ${year}, ${timeStr}`;
      }
    } catch (e) {
      console.error("Error formatting date/time for WhatsApp:", e);
    }

    const companyPhone = settingsPhone || "+91 98942 21664";
    const companyEmail = settingsEmail || "info.maayandrivecar@gmail.com";

    const message = `*Booking Confirmed!*\n\n` +
      `Hello ${notifyBooking.full_name},\n\n` +
      `Thank you for booking with *Maayan Trans & Services*.\n\n` +
      `Your driver and vehicle have been assigned.\n\n` +
      `*Assigned Vehicle*\n` +
      `• Type: ${notifyVehicleType || "Assigned Soon"}\n` +
      `• Number: ${notifyVehicleNumber || "Assigned Soon"}\n\n` +
      `*Assigned Driver*\n` +
      `• Name: ${notifyDriverName || "Assigned Soon"}\n` +
      `• Mobile: ${notifyDriverPhone || "Assigned Soon"}\n\n` +
      `*Journey Information*\n` +
      `• Pickup: ${notifyBooking.pickup_location}\n` +
      `• Drop-off: ${notifyBooking.dropoff_location}\n` +
      `• Date & Time: ${formattedDateTime}\n\n` +
      `Have a pleasant and safe journey. If you require any support, please contact us at ${companyPhone} or ${companyEmail}.\n\n` +
      `Thank you for choosing *Maayan Trans & Services*.`;

    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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
        /* Watermark and position context for print container */
        .print-container {
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .print-container::before {
          content: "MAAYAN TRANS";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.04);
          white-space: nowrap;
          z-index: -1;
          pointer-events: none;
          font-family: var(--font-display);
        }
        
        .print-container table td {
          padding: 12px 16px !important;
          line-height: 1.4 !important;
          font-size: 11.5px !important;
        }

        @media print {
          @page {
            size: portrait;
            margin: 0;
          }
          html, body, #__next, .landing-page {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            display: block !important;
          }
          /* Hide all sibling layout modules on print to completely free page flow */
          header, .sticky-header, main.main-content, .no-print, .bg-transport-container {
            display: none !important;
          }
          .print-modal-overlay {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .print-modal-content {
            position: static !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 40px !important;
            margin: 15mm auto !important;
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

        @media (max-width: 600px) {
          /* Search & filter mobile styles */
          .search-filter-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
            padding: 1.25rem 1rem !important;
          }
          .search-filter-container .input-wrapper {
            max-width: 100% !important;
            width: 100% !important;
          }
          .trip-type-wrapper {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .trip-type-wrapper .input-wrapper {
            flex: 1 !important;
            max-width: 200px !important;
          }

          .card-lowest {
            padding: 1.25rem 1rem !important;
          }

          /* Booking card mobile styles */
          .booking-card-main {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.75rem !important;
          }
          .booking-card-info {
            min-width: 100% !important;
            width: 100% !important;
          }
          .booking-card-meta {
            width: 100% !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: space-between !important;
            align-items: center !important;
            text-align: left !important;
            border-top: 1px dashed var(--outline-variant);
            padding-top: 0.75rem;
            margin-top: 0.25rem;
            gap: 0.5rem 1rem !important;
          }
          .booking-card-meta > div {
            margin-top: 0 !important;
          }
          .booking-card-meta > div:first-child {
            display: flex !important;
            gap: 0.4rem !important;
            align-items: center !important;
            flex: 1 1 auto !important;
            margin-right: 0.5rem !important;
            flex-wrap: wrap !important;
          }
          .booking-card-meta > div:last-child {
            margin-top: 0 !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .booking-card-meta .trip-badge,
          .booking-card-meta .status-badge {
            margin-bottom: 0 !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
        }

        /* Theme styles for booking card left border */
        .round-trip-card {
          border-left: 4px solid var(--primary-container) !important;
        }
        [data-theme="dark"] .round-trip-card {
          border-left: 4px solid var(--primary) !important;
        }
        .outstation-trip-card {
          border-left: 4px solid #7c3aed !important;
        }
        [data-theme="dark"] .outstation-trip-card {
          border-left: 4px solid #a78bfa !important;
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
          white-space: nowrap;
        }
        .trip-badge.round-trip {
          background-color: rgba(255, 179, 0, 0.12) !important;
          color: #d97706 !important;
        }
        [data-theme="dark"] .trip-badge.round-trip {
          color: #ffb300 !important;
        }
        .trip-badge.outstation {
          background-color: rgba(124, 58, 237, 0.1) !important;
          color: #7c3aed !important;
          border: 1px solid rgba(124, 58, 237, 0.2) !important;
        }
        [data-theme="dark"] .trip-badge.outstation {
          background-color: rgba(167, 139, 250, 0.15) !important;
          color: #a78bfa !important;
          border: 1px solid rgba(167, 139, 250, 0.25) !important;
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
          white-space: nowrap;
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
            <div className="settings-header-banner" style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              <div>
                <h1 className="headline-md" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {activeTab === "bookings" ? "Bookings Dashboard" : "Admin Settings"}
                </h1>
                <p className="body-md">
                  {activeTab === "bookings" ? "Manage and review all reservation requests." : "Configure company contact info and dynamic vehicle rates."}
                </p>
              </div>

              <div className="settings-header-actions" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {activeTab === "bookings" && (
                  <button
                    onClick={fetchBookings}
                    className="btn-secondary"
                    style={{ padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                    disabled={fetchLoading}
                  >
                    <RefreshCw size={14} className={fetchLoading ? "animate-spin" : ""} style={{ animation: fetchLoading ? "spin 1s linear infinite" : "none" }} />
                    <span>Refresh</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab(activeTab === "bookings" ? "settings" : "bookings")}
                  className="btn-secondary"
                  style={{
                    padding: "0.6rem 1.2rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    borderColor: "var(--primary)",
                    color: "var(--primary)"
                  }}
                >
                  <Settings size={14} />
                  <span>{activeTab === "bookings" ? "Settings" : "Back to Bookings"}</span>
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

            {activeTab === "settings" ? (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "3rem" }}>
                {/* Banners Row */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {/* Save Success Alert */}
                  {settingsSuccess && (
                    <div className="success-banner" style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid #22c55e", borderRadius: "var(--radius-sm)", padding: "1rem", color: "#22c55e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CheckCircle2 size={16} />
                      <span>Settings saved and synced to database successfully!</span>
                    </div>
                  )}

                </div>

                <div className="settings-grid">
                  {/* Left Column: Company Info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div className="feature-card card-lowest settings-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <h3 className="title-md" style={{ color: "#d97706", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
                        Company Contact Settings
                      </h3>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-phone">Phone Number</label>
                        <div className="input-wrapper">
                          <Phone size={18} />
                          <input
                            id="settings-phone"
                            type="text"
                            value={settingsPhone}
                            onChange={(e) => setSettingsPhone(e.target.value)}
                            placeholder="e.g. +91 98942 21664"
                          />
                        </div>
                      </div>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-email">Email Address</label>
                        <div className="input-wrapper">
                          <Mail size={18} />
                          <input
                            id="settings-email"
                            type="email"
                            value={settingsEmail}
                            onChange={(e) => setSettingsEmail(e.target.value)}
                            placeholder="e.g. info.maayandrivecar@gmail.com"
                          />
                        </div>
                      </div>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-address">Address</label>
                        <div className="input-wrapper" style={{ alignItems: "flex-start", padding: "0.5rem" }}>
                          <MapPin size={18} style={{ marginTop: "0.3rem" }} />
                          <textarea
                            id="settings-address"
                            value={settingsAddress}
                            onChange={(e) => setSettingsAddress(e.target.value)}
                            placeholder="e.g. Company Address"
                            rows={3}
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              color: "var(--on-surface)",
                              fontFamily: "inherit",
                              resize: "vertical"
                            }}
                          />
                        </div>
                      </div>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-gst">GST Number</label>
                        <div className="input-wrapper">
                          <input
                            id="settings-gst"
                            type="text"
                            value={settingsGst}
                            onChange={(e) => setSettingsGst(e.target.value)}
                            placeholder="e.g. 29MAAYN1234F1Z5"
                          />
                        </div>
                      </div>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-pan">PAN Number</label>
                        <div className="input-wrapper">
                          <input
                            id="settings-pan"
                            type="text"
                            value={settingsPan}
                            onChange={(e) => setSettingsPan(e.target.value)}
                            placeholder="e.g. MAAYN1234F"
                          />
                        </div>
                      </div>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-marquee">Marquee Text</label>
                        <div className="input-wrapper" style={{ alignItems: "flex-start", padding: "0.5rem" }}>
                          <textarea
                            id="settings-marquee"
                            value={settingsMarquee}
                            onChange={(e) => setSettingsMarquee(e.target.value)}
                            placeholder="Marquee announcements text"
                            rows={4}
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              color: "var(--on-surface)",
                              fontFamily: "inherit",
                              resize: "vertical"
                            }}
                          />
                        </div>
                      </div>

                      {/* Notification Emails list */}
                      <div className="input-field-container">
                        <label className="input-label">Notification Email Addresses</label>
                        <span className="body-sm" style={{ color: "var(--on-surface-variant)", display: "block", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                          These emails will receive details of each new booking.
                        </span>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {settingsEmails.map((email) => (
                            <div key={email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", background: "var(--surface-container-low)", borderRadius: "var(--radius-sm)", border: "1px solid var(--outline-variant)" }}>
                              <span style={{ fontSize: "0.85rem", color: "var(--on-surface)" }}>{email}</span>
                              <button
                                type="button"
                                onClick={() => setSettingsEmails(settingsEmails.filter(e => e !== email))}
                                style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", display: "flex", alignItems: "center" }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem", flexWrap: "wrap" }}>
                          <div className="input-wrapper" style={{ flex: 1 }}>
                            <Mail size={16} />
                            <input
                              type="email"
                              value={newEmailInput}
                              onChange={(e) => setNewEmailInput(e.target.value)}
                              placeholder="Add new email address"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (newEmailInput && newEmailInput.trim()) {
                                    if (!settingsEmails.includes(newEmailInput.trim())) {
                                      setSettingsEmails([...settingsEmails, newEmailInput.trim()]);
                                    }
                                    setNewEmailInput("");
                                  }
                                }
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => {
                              if (newEmailInput && newEmailInput.trim()) {
                                if (!settingsEmails.includes(newEmailInput.trim())) {
                                  setSettingsEmails([...settingsEmails, newEmailInput.trim()]);
                                }
                                setNewEmailInput("");
                              }
                            }}
                            style={{
                              padding: "0.6rem 1rem",
                              height: "42px",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              borderRadius: "var(--radius-sm)"
                            }}
                          >
                            <Plus size={16} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Vehicle Rates & Allowances, and Trip Distance Settings */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Vehicle Rates & Allowances */}
                    <div className="feature-card card-lowest settings-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <h3 className="title-md" style={{ color: "#d97706", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
                        Vehicle Fare Rates & Allowances
                      </h3>

                      {settingsLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                          <div className="spinner-small" style={{ width: "30px", height: "30px" }}></div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                          {/* Vehicle Type buttons */}
                          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            {Object.entries(VEHICLE_TYPES).map(([typeKey, typeInfo]) => {
                              const isActive = selectedVehicleType === typeKey;
                              return (
                                <button
                                  key={typeKey}
                                  type="button"
                                  onClick={() => setSelectedVehicleType(typeKey)}
                                  className={isActive ? "btn-primary" : "btn-secondary"}
                                  style={{
                                    flex: "1 1 120px",
                                    padding: "0.75rem 1.25rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                    borderRadius: "var(--radius-sm)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    border: isActive ? "1px solid var(--primary)" : "1px solid var(--outline-variant)",
                                    backgroundColor: isActive ? "var(--primary)" : "transparent",
                                    color: isActive ? "var(--on-primary)" : "var(--on-surface)",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow: isActive ? "0 4px 12px rgba(217, 119, 6, 0.2)" : "none"
                                  }}
                                >
                                  <Car size={16} />
                                  <span>{typeInfo.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Vehicle Type configuration */}
                          <AnimatePresence mode="wait">
                            {selectedVehicleType ? (
                              <motion.div
                                key={selectedVehicleType}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
                              >
                                {VEHICLE_TYPES[selectedVehicleType].keys.map((vehicleKey) => {
                                  const vehicleData = settingsVehicles[vehicleKey];
                                  if (!vehicleData) return null;
                                  return (
                                    <div key={vehicleKey} className="settings-vehicle-row" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                      <span className="label-sm" style={{ fontWeight: "700", textTransform: "uppercase", display: "block", color: "#d97706", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                                        {vehicleKey.replace("_", " ")}
                                      </span>
                                      <div className="settings-vehicle-grid">
                                        {/* Rate per KM */}
                                        <div className="input-field-container">
                                          <label className="input-label" style={{ fontSize: "0.75rem" }}>Rate per KM (₹)</label>
                                          <div className="input-wrapper" style={{ padding: "0.4rem 0.6rem" }}>
                                            <IndianRupee size={14} />
                                            <input
                                              type="number"
                                              step="0.1"
                                              value={vehicleData.ratePerKm}
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setSettingsVehicles(prev => ({
                                                  ...prev,
                                                  [vehicleKey]: { ...prev[vehicleKey], ratePerKm: val }
                                                }));
                                              }}
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                        </div>

                                        {/* Driver Allowance */}
                                        <div className="input-field-container">
                                          <label className="input-label" style={{ fontSize: "0.75rem" }}>OutStation Driver Betta  (₹/Day)</label>
                                          <div className="input-wrapper" style={{ padding: "0.4rem 0.6rem" }}>
                                            <IndianRupee size={14} />
                                            <input
                                              type="number"
                                              value={vehicleData.driverAllowancePerDay}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setSettingsVehicles(prev => ({
                                                  ...prev,
                                                  [vehicleKey]: { ...prev[vehicleKey], driverAllowancePerDay: val }
                                                }));
                                              }}
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                        </div>

                                        {/* One-Way Dist/Hr (KM) */}
                                        <div className="input-field-container">
                                          <label className="input-label" style={{ fontSize: "0.75rem" }}>One-Way Dist/Hr (KM)</label>
                                          <div className="input-wrapper" style={{ padding: "0.4rem 0.6rem" }}>
                                            <input
                                              type="number"
                                              value={vehicleData.oneWayMinKmPerHour !== undefined ? vehicleData.oneWayMinKmPerHour : 20}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setSettingsVehicles(prev => ({
                                                  ...prev,
                                                  [vehicleKey]: { ...prev[vehicleKey], oneWayMinKmPerHour: val }
                                                }));
                                              }}
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                        </div>

                                        {/* One-Way Hourly Rate */}
                                        <div className="input-field-container">
                                          <label className="input-label" style={{ fontSize: "0.75rem" }}>One-Way Hourly Rate (₹)</label>
                                          <div className="input-wrapper" style={{ padding: "0.4rem 0.6rem" }}>
                                            <IndianRupee size={14} />
                                            <input
                                              type="number"
                                              value={vehicleData.oneWayHourRate !== undefined ? vehicleData.oneWayHourRate : 170}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setSettingsVehicles(prev => ({
                                                  ...prev,
                                                  [vehicleKey]: { ...prev[vehicleKey], oneWayHourRate: val }
                                                }));
                                              }}
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                        </div>

                                        {/* Round-Trip Hourly Rate */}
                                        <div className="input-field-container">
                                          <label className="input-label" style={{ fontSize: "0.75rem" }}>Round-Trip Hourly Rate (₹)</label>
                                          <div className="input-wrapper" style={{ padding: "0.4rem 0.6rem" }}>
                                            <IndianRupee size={14} />
                                            <input
                                              type="number"
                                              value={vehicleData.roundTripHourRate !== undefined ? vehicleData.roundTripHourRate : 170}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setSettingsVehicles(prev => ({
                                                  ...prev,
                                                  [vehicleKey]: { ...prev[vehicleKey], roundTripHourRate: val }
                                                }));
                                              }}
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                        </div>

                                        {/* Outstation Hourly Rate */}
                                        <div className="input-field-container">
                                          <label className="input-label" style={{ fontSize: "0.75rem" }}>Outstation Hourly Rate (₹)</label>
                                          <div className="input-wrapper" style={{ padding: "0.4rem 0.6rem" }}>
                                            <IndianRupee size={14} />
                                            <input
                                              type="number"
                                              value={vehicleData.outstationHourRate !== undefined ? vehicleData.outstationHourRate : 170}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setSettingsVehicles(prev => ({
                                                  ...prev,
                                                  [vehicleKey]: { ...prev[vehicleKey], outstationHourRate: val }
                                                }));
                                              }}
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                        </div>

                                        {/* Outstation Min KM/Day */}
                                        <div className="input-field-container">
                                          <label className="input-label" style={{ fontSize: "0.75rem" }}>Outstation Min KM/Day</label>
                                          <div className="input-wrapper" style={{ padding: "0.4rem 0.6rem" }}>
                                            <input
                                              type="number"
                                              value={vehicleData.outstationMinKmPerDay !== undefined ? vehicleData.outstationMinKmPerDay : 250}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setSettingsVehicles(prev => ({
                                                  ...prev,
                                                  [vehicleKey]: { ...prev[vehicleKey], outstationMinKmPerDay: val }
                                                }));
                                              }}
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                        </div>

                                        {/* Outstation Hours Per Day */}
                                        <div className="input-field-container">
                                          <label className="input-label" style={{ fontSize: "0.75rem" }}>Outstation Hours Per Day</label>
                                          <div className="input-wrapper" style={{ padding: "0.4rem 0.6rem" }}>
                                            <input
                                              type="number"
                                              value={vehicleData.outstationHoursPerDay !== undefined ? vehicleData.outstationHoursPerDay : 16}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setSettingsVehicles(prev => ({
                                                  ...prev,
                                                  [vehicleKey]: { ...prev[vehicleKey], outstationHoursPerDay: val }
                                                }));
                                              }}
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            ) : (
                              <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "3rem 1.5rem",
                                  border: "1px dashed var(--outline-variant)",
                                  borderRadius: "var(--radius-sm)",
                                  textAlign: "center",
                                  color: "var(--on-surface-variant)",
                                  gap: "0.75rem",
                                  backgroundColor: "var(--surface-container-low)"
                                }}
                              >
                                <Car size={36} style={{ color: "#d97706", opacity: 0.8 }} />
                                <span className="title-sm" style={{ fontWeight: 600, color: "var(--on-surface)" }}>No Vehicle Type Selected</span>
                                <span className="body-sm" style={{ fontSize: "0.8rem", maxWidth: "260px", lineHeight: "1.4" }}>
                                  Select Hatchback, Sedan, or SUV above to configure rates, allowances, and trip settings.
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Trip Distance Settings (KM) */}
                    <div className="feature-card card-lowest settings-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <h3 className="title-md" style={{ color: "#d97706", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
                        Trip Distance Settings (KM)
                      </h3>
                      <span className="body-sm" style={{ color: "var(--on-surface-variant)", display: "block", fontSize: "0.8rem", marginTop: "-0.5rem" }}>
                        Configure the minimum distance requirements (KM) for bookings.
                      </span>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-min-km-oneway">One-Way Trip Minimum (KM)</label>
                        <div className="input-wrapper">
                          <input
                            id="settings-min-km-oneway"
                            type="number"
                            value={settingsMinKmOneWay}
                            onChange={(e) => setSettingsMinKmOneWay(Math.max(0, parseInt(e.target.value) || 0))}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-min-km-roundtrip">Round Trip Minimum (KM)</label>
                        <div className="input-wrapper">
                          <input
                            id="settings-min-km-roundtrip"
                            type="number"
                            value={settingsMinKmRoundTrip}
                            onChange={(e) => setSettingsMinKmRoundTrip(Math.max(0, parseInt(e.target.value) || 0))}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="input-field-container">
                        <label className="input-label" htmlFor="settings-min-km-outstation">Outstation Trip Minimum (KM)</label>
                        <div className="input-wrapper">
                          <input
                            id="settings-min-km-outstation"
                            type="number"
                            value={settingsMinKmOutstation}
                            onChange={(e) => setSettingsMinKmOutstation(Math.max(0, parseInt(e.target.value) || 0))}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Row */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <motion.button
                    type="button"
                    onClick={saveAdminSettings}
                    className="btn-primary"
                    disabled={settingsSaving}
                    style={{ padding: "0.8rem 2.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {settingsSaving ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Save Settings</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            ) : (
              <>
                {/* Quick Stats Grid */}
                <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "2rem", gap: "1.5rem" }}>
                  <div className="feature-card card-lowest" style={{ padding: "1.5rem" }}>
                    <div className="feature-icon-wrap" style={{
                      width: "36px",
                      height: "36px",
                      marginBottom: "1rem",
                      background: "rgba(217, 119, 6, 0.1)",
                      border: "1px solid rgba(217, 119, 6, 0.2)",
                      color: "#d97706"
                    }}><FileText size={18} /></div>
                    <span className="input-label" style={{ fontSize: "0.65rem" }}>Total Requests</span>
                    <h3 className="display-lg" style={{ fontSize: "1.8rem", marginTop: "0.25rem" }}>{bookings.length}</h3>
                  </div>

                  <div className="feature-card card-lowest" style={{ padding: "1.5rem" }}>
                    <div className="feature-icon-wrap" style={{
                      width: "36px",
                      height: "36px",
                      marginBottom: "1rem",
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                      color: "#22c55e"
                    }}><TrendingUp size={18} /></div>
                    <span className="input-label" style={{ fontSize: "0.65rem" }}>Est. Gross Revenue</span>
                    <h3 className="display-lg" style={{ fontSize: "1.8rem", marginTop: "0.25rem", color: "var(--primary)" }}>
                      ₹{Math.round(totalRevenue).toLocaleString("en-IN")}/-
                    </h3>
                  </div>

                  <div className="feature-card card-lowest" style={{ padding: "1.5rem" }}>
                    <div className="feature-icon-wrap" style={{
                      width: "36px",
                      height: "36px",
                      marginBottom: "1rem",
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "#10b981"
                    }}><CheckCircle2 size={18} /></div>
                    <span className="input-label" style={{ fontSize: "0.65rem" }}>Completed Trips</span>
                    <h3 className="display-lg" style={{ fontSize: "1.8rem", marginTop: "0.25rem" }}>{completedTripsCount}</h3>
                  </div>

                  <div className="feature-card card-lowest" style={{ padding: "1.5rem" }}>
                    <div className="feature-icon-wrap" style={{
                      width: "36px",
                      height: "36px",
                      marginBottom: "1rem",
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      color: "#3b82f6"
                    }}><Activity size={18} /></div>
                    <span className="input-label" style={{ fontSize: "0.65rem" }}>Active Trips</span>
                    <h3 className="display-lg" style={{ fontSize: "1.8rem", marginTop: "0.25rem" }}>{activeTripsCount}</h3>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="card-lowest search-filter-container" style={{ padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                  <div className="input-wrapper" style={{ flex: 1, minWidth: "260px", maxWidth: "450px" }}>
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search by ID, customer name, phone, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="trip-type-wrapper" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
                        <option value="Outstation Trip">Outstation Trip</option>
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
                          className={`card-lowest ${booking.trip_type === "Round Trip"
                            ? "round-trip-card"
                            : booking.trip_type === "Outstation Trip"
                              ? "outstation-trip-card"
                              : "one-way-card"
                            }`}
                          style={{
                            padding: "1.25rem 1.5rem",
                            cursor: "pointer"
                          }}
                          onClick={() => toggleExpand(booking.id)}
                          layout
                        >
                          <div className="booking-card-main" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div className="booking-card-info" style={{ display: "flex", gap: "1rem", flex: 1, minWidth: "260px" }}>
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

                            <div className="booking-card-meta" style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                <span className={`status-badge ${(booking.status || "Pending").toLowerCase()}`}>
                                  {booking.status || "Pending"}
                                </span>
                                <span className={`trip-badge ${booking.trip_type === "Round Trip"
                                  ? "round-trip"
                                  : booking.trip_type === "Outstation Trip"
                                    ? "outstation"
                                    : "one-way"
                                  }`}>
                                  {booking.trip_type === "Outstation Trip" ? "Outstation" : booking.trip_type}
                                </span>
                              </div>
                              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)", marginTop: "0.2rem" }}>
                                ₹{Math.round(booking.total_fare).toLocaleString("en-IN")}/-
                              </div>
                            </div>
                          </div>

                          {/* Route overview */}
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.5rem 0.75rem",
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
                                    <p className="body-md"><strong>Email:</strong> {booking.email_address ? <a href={`mailto:${booking.email_address}`} style={{ color: "inherit", textDecoration: "underline" }}>{booking.email_address}</a> : <span style={{ color: "var(--on-surface-variant)" }}>Not provided</span>}</p>
                                    <p className="body-md"><strong>Phone:</strong> <a href={`tel:${booking.phone_number}`} style={{ color: "inherit", textDecoration: "underline" }}>{booking.phone_number}</a></p>
                                    <p className="body-md"><strong>Passengers:</strong> {booking.passengers_count}</p>
                                  </div>

                                  <div>
                                    <h4 className="label-sm" style={{ marginBottom: "0.5rem", color: "#d97706" }}>Trip Parameters</h4>
                                    <p className="body-md"><strong>Pickup Date:</strong> {booking.pickup_date} at {booking.pickup_time}</p>
                                    {(booking.trip_type === "Round Trip" || booking.trip_type === "Outstation Trip") && (
                                      <p className="body-md"><strong>Duration:</strong> {booking.number_of_days} {booking.number_of_days === 1 ? "Day" : "Days"}</p>
                                    )}
                                    <p className="body-md"><strong>Vehicle:</strong> {booking.car_type}</p>
                                    {booking.vehicle_no && (
                                      <p className="body-md"><strong>Vehicle Number:</strong> {booking.vehicle_no}</p>
                                    )}
                                    {booking.driver_name && (
                                      <p className="body-md"><strong>Driver Name:</strong> {booking.driver_name}</p>
                                    )}
                                    {booking.driver_phone && (
                                      <p className="body-md"><strong>Driver Mobile:</strong> {booking.driver_phone}</p>
                                    )}
                                    <p className="body-md"><strong>Est. Distance:</strong> {Number(booking.distance_km).toFixed(2)} km</p>
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
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openNotifyModal(booking);
                                      }}
                                      className="btn-secondary"
                                      style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", width: "100%", textTransform: "none", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center", boxShadow: "none" }}
                                    >
                                      <MessageSquare size={14} />
                                      <span>Notify Customer</span>
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
                                border: isCurrent ? "1px solid var(--primary)" : "none",
                                background: isCurrent ? "var(--primary)" : "var(--surface-container-low)",
                                color: isCurrent ? "var(--on-primary)" : "var(--on-surface)"
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
              </>
            )}
          </div>
        )}
      </main>

      <footer className="no-print" style={{
        padding: "1.5rem",
        textAlign: "center",
        borderTop: "1px solid var(--outline-variant)",
        color: "var(--on-surface-variant)",
        fontSize: "0.85rem",
        backgroundColor: "var(--surface-container-low)",
        width: "100%"
      }}>
        © 2026 Maayan Trans & Services. All rights reserved.
      </footer>

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
                      onClick={async () => {
                        await handleSaveTripSheet();
                        setTripSheetView("preview");
                      }}
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
                            <TimePicker
                              time={tripSheetData.reporting_time}
                              setTime={(time) => {
                                setTripSheetData(prev => prev ? ({
                                  ...prev,
                                  reporting_time: time,
                                  vehicle_start_time: subtractMinutes(time, 30)
                                }) : null);
                              }}
                              label="Reporting Time"
                              placeholder="e.g. 07:00 AM"
                            />
                          </div>

                          <div className="input-field-container">
                            <TimePicker
                              time={tripSheetData.vehicle_start_time}
                              setTime={(time) => {
                                setTripSheetData(prev => prev ? ({
                                  ...prev,
                                  vehicle_start_time: time
                                }) : null);
                              }}
                              label="Vehicle Start Time"
                              placeholder="e.g. 07:30 AM"
                            />
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
                                placeholder="e.g. Local Run / Outstation Travel"
                                value={tripSheetData.standing_instructions}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, standing_instructions: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="input-field-container">
                            <label className="input-label">Service City</label>
                            <div className="input-wrapper">
                              <MapPin size={16} />
                              <input
                                type="text"
                                placeholder="e.g. Tamil Nadu"
                                value={tripSheetData.service_city || ""}
                                onChange={(e) => setTripSheetData({ ...tripSheetData, service_city: e.target.value })}
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
                            dateLabel="Out Date"
                            timeLabel="Out Time"
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
                          onClick={handlePrintTripSheet}
                          className="btn-secondary"
                          style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                        >
                          <Printer size={14} />
                          <span>Print</span>
                        </button>

                        <button
                          onClick={handlePrintTripSheet}
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
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "45px", height: "45px" }}>
                                <img src="/logo_original.png?v=3" alt="Maayan Trans Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              </div>
                              <div>
                                <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "16px", color: "#111", letterSpacing: "0.5px", textTransform: "uppercase", lineHeight: 1.2 }}>MAAYAN TRANS & SERVICES</div>
                                <div style={{ fontSize: "10px", color: "#666", fontWeight: "600", letterSpacing: "0.5px", marginTop: "2px" }}>
                                  GSTIN: {state.settings.company?.gst || "---"} | PAN: {state.settings.company?.pan || "---"}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "9px", color: "#888", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>TRIP SERIAL NUMBER</div>
                              <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "#d97706", marginTop: "2px" }}>
                                {tripSheetData.serial_no}
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
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "30%", fontWeight: tripSheetData.organisation ? "bold" : "normal", fontSize: "11px", fontStyle: tripSheetData.organisation ? "normal" : "italic", color: tripSheetData.organisation ? "inherit" : "#e5e5e5" }}>{tripSheetData.organisation || "To be filled"}</td>
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
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontStyle: "italic", color: "#e5e5e5" }}>To be filled</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontStyle: "italic", color: "#e5e5e5" }}>To be filled</td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>KILOMETERS</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center" }}>{tripSheetData.kms_out.toLocaleString("en-IN")} KM</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontStyle: "italic", color: "#e5e5e5" }}>To be filled</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontStyle: "italic", color: "#e5e5e5" }}>To be filled</td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>TIME</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center" }}>{formatTimeTo12Hour(tripSheetData.time_out)}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontStyle: "italic", color: "#e5e5e5" }}>To be filled</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", textAlign: "center", fontStyle: "italic", color: "#e5e5e5" }}>To be filled</td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>REPORTING TIME</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold" }}>{formatTimeTo12Hour(tripSheetData.reporting_time)}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>CHAUFFEUR</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: tripSheetData.chauffeur_name ? "bold" : "normal", fontStyle: tripSheetData.chauffeur_name ? "normal" : "italic", color: tripSheetData.chauffeur_name ? "inherit" : "#e5e5e5" }}>
                                  {tripSheetData.chauffeur_name ? `${tripSheetData.chauffeur_name} (${tripSheetData.chauffeur_phone})` : "To be filled"}
                                </td>
                              </tr>

                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>VEHICLE START TIME</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: "bold" }}>{formatTimeTo12Hour(tripSheetData.vehicle_start_time)}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>VEHICLE NO.</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontWeight: tripSheetData.vehicle_no ? "bold" : "normal", fontStyle: tripSheetData.vehicle_no ? "normal" : "italic", color: tripSheetData.vehicle_no ? "inherit" : "#e5e5e5" }}>{tripSheetData.vehicle_no || "To be filled"}</td>
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
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "25%", fontStyle: tripSheetData.parking_toll ? "normal" : "italic", color: tripSheetData.parking_toll ? "inherit" : "#e5e5e5" }}>{tripSheetData.parking_toll || "To be filled"}</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "25%", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>SERVICE CITY</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "25%", fontStyle: tripSheetData.service_city ? "normal" : "italic", color: tripSheetData.service_city ? "inherit" : "#e5e5e5" }}>{tripSheetData.service_city || "To be filled"}</td>
                              </tr>
                              <tr>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", width: "25%", background: "#fcfcfc", fontWeight: "bold", color: "#555", fontSize: "9px", textTransform: "uppercase" }}>STANDING INST.</td>
                                <td style={{ border: "1px solid #111", padding: "8px 12px", fontStyle: tripSheetData.standing_instructions ? "normal" : "italic", color: tripSheetData.standing_instructions ? "inherit" : "#e5e5e5" }} colSpan={3}>{tripSheetData.standing_instructions || "To be filled"}</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Signature Block */}
                          <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "1px solid #111",
                            fontSize: "11px",
                            marginTop: "30px"
                          }}>
                            <tbody>
                              <tr>
                                <td style={{ border: "1px solid #111", padding: "12px 14px", width: "55%", verticalAlign: "top", fontSize: "10px", lineHeight: "1.6", color: "#222" }}>
                                  I confirm that I am responsible for full payment of this bill in the event that the bill is not paid by the organisation or person indicated.
                                </td>
                                <td style={{ border: "1px solid #111", padding: "12px 14px", width: "45%", verticalAlign: "bottom", textAlign: "center" }}>
                                  <div style={{ height: "48px" }} />
                                  <div style={{ borderTop: "1px solid #555", paddingTop: "6px", fontSize: "9px", fontWeight: "bold", color: "#555", letterSpacing: "1px", textTransform: "uppercase" }}>
                                    ✏️ &nbsp; Signature
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Custom Printed Footer */}
                          <div style={{
                            marginTop: "30px",
                            textAlign: "center",
                            fontSize: "10px",
                            color: "#888",
                            fontFamily: "var(--font-display)",
                            letterSpacing: "1px"
                          }}>
                            www.maayantrans.com
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

      {/* ================= NOTIFY CUSTOMER DIALOG / MODAL ================= */}
      <AnimatePresence>
        {notifyBooking && (
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
              className="card-container"
              style={{
                maxWidth: "500px",
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "1rem" }}>
                <div>
                  <h2 className="title-md" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <MessageSquare size={20} />
                    <span>Notify Customer</span>
                  </h2>
                  <p className="body-md" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", marginTop: "0.25rem" }}>
                    Booking for: <strong>{notifyBooking.full_name}</strong> ({notifyBooking.phone_number})
                  </p>
                </div>
                <button
                  onClick={() => setNotifyBooking(null)}
                  className="btn-icon"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--on-surface-variant)",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {notifyLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <div className="spinner-small" style={{ width: "30px", height: "30px" }}></div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="input-field-container">
                    <label className="input-label">Vehicle Type</label>
                    <div className="input-wrapper">
                      <Car size={16} />
                      <input
                        type="text"
                        placeholder="e.g. Hatchback, Sedan, SUV"
                        value={notifyVehicleType}
                        onChange={(e) => setNotifyVehicleType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-field-container">
                    <label className="input-label">Vehicle Number</label>
                    <div className="input-wrapper">
                      <FileText size={16} />
                      <input
                        type="text"
                        placeholder="e.g. KA-01-MJ-1234"
                        value={notifyVehicleNumber}
                        onChange={(e) => setNotifyVehicleNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-field-container">
                    <label className="input-label">Driver Name</label>
                    <div className="input-wrapper">
                      <User size={16} />
                      <input
                        type="text"
                        placeholder="e.g. Rajesh Kumar"
                        value={notifyDriverName}
                        onChange={(e) => setNotifyDriverName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-field-container">
                    <label className="input-label">Driver Mobile Number</label>
                    <div className="input-wrapper">
                      <Phone size={16} />
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={notifyDriverPhone}
                        onChange={(e) => setNotifyDriverPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem", borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
                    <button
                      onClick={() => setNotifyBooking(null)}
                      className="btn-secondary"
                      style={{ padding: "0.5rem 1.5rem" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        const success = await saveNotifyDetails(notifyBooking, false);
                        if (success) {
                          setNotifyBooking(null);
                        }
                      }}
                      className="btn-primary"
                      style={{
                        padding: "0.5rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "100px"
                      }}
                      disabled={notifySaving}
                    >
                      {notifySaving ? <div className="spinner-small"></div> : "Save"}
                    </button>
                    <button
                      onClick={handleSendWhatsApp}
                      className="btn-primary"
                      style={{
                        padding: "0.5rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>Send WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            style={{
              position: "fixed",
              top: "2rem",
              right: "2rem",
              zIndex: 9999,
              backgroundColor: "var(--surface-container-lowest, #ffffff)",
              color: "var(--on-surface, #1b1c1c)",
              padding: "1rem 1.5rem",
              borderRadius: "var(--radius-md, 0.75rem)",
              boxShadow: "0 12px 40px rgba(79, 70, 50, 0.15)",
              borderLeft: "4px solid #22c55e",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontFamily: "var(--font-display)"
            }}
          >
            <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

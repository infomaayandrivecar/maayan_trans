"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit2, ArrowRight, ShieldCheck, Check, Moon, Sun, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useBooking, Vehicle } from "../context/BookingContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Image from "next/image";

export default function BookingWizard() {
  const router = useRouter();
  const {
    state,
    vehicles,
    isLoading,
    error,
    setVehicle,
    setPassengerInfo,
    calculateFare,
    submitBooking,
    resetBooking,
  } = useBooking();

  // Step state: "vehicles" | "passenger" | "success"
  const [step, setStep] = useState<"vehicles" | "passenger" | "success">("vehicles");
  const [theme, setTheme] = useState("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("maayan_theme") || "light";
    setTheme(savedTheme);
  }, []);

  // Sync theme changes with document attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("maayan_theme", nextTheme);
    }
  };

  // Safe redirect if pickup or dropoff details are missing
  useEffect(() => {
    if (isMounted && (!state.pickup || !state.dropoff)) {
      // Don't redirect instantly to allow user to see, but after render if they refresh
      const timeout = setTimeout(() => {
        if (!state.pickup || !state.dropoff) {
          router.push("/");
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isMounted, state.pickup, state.dropoff, router]);

  // Trigger confetti on success
  useEffect(() => {
    if (step === "success") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#785900", "#ffc107", "#dfa000", "#2e7d32"],
      });
    }
  }, [step]);

  // Scroll to top when wizard step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [step]);

  const formik = useFormik({
    initialValues: {
      fullName: state.passengerInfo.fullName || "",
      phone: state.passengerInfo.phoneNumber || state.phoneNumber || "",
      email: state.passengerInfo.emailAddress || "",
      passengersCount: state.passengerInfo.passengersCount || 1,
      tripInstructions: state.passengerInfo.tripInstructions || "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      fullName: Yup.string().trim().required("Full Name is required."),
      phone: Yup.string()
        .trim()
        .required("A valid phone number is required (min 10 digits).")
        .min(10, "A valid phone number is required (min 10 digits)."),
      email: Yup.string()
        .trim()
        .email("Please enter a valid email address.")
        .required("Please enter a valid email address."),
      passengersCount: Yup.number()
        .min(1, "Number of passengers must be at least 1.")
        .max(15, "Number of passengers cannot exceed 15.")
        .required("Number of passengers is required."),
      tripInstructions: Yup.string().optional(),
    }),
    onSubmit: async (values) => {
      const passengerDetails = {
        fullName: values.fullName,
        phoneNumber: values.phone,
        emailAddress: values.email,
        passengersCount: Number(values.passengersCount),
        tripInstructions: values.tripInstructions,
      };

      // Set passenger info to global state
      setPassengerInfo(passengerDetails);

      const success = await submitBooking(passengerDetails);
      if (success) {
        setStep("success");
      }
    },
  });

  if (!isMounted) {
    return (
      <div className="wizard-page">
        <Header />
        <main className="wizard-main-content">
          <div className="wizard-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <div className="spinner-medium"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!state.pickup || !state.dropoff) {
    return (
      <div className="redirect-screen">
        <div className="redirect-card card-lowest">
          <AlertCircle size={48} className="alert-icon" />
          <h2 className="title-md">No Booking Search Session Active</h2>
          <p className="body-md text-muted">Redirecting you to the home page to search for available routes...</p>
          <button type="button" className="btn-primary" onClick={() => router.push("/")}>
            Go Back Immediately
          </button>
        </div>
      </div>
    );
  }

  // Handle vehicle selection click
  const handleSelectVehicle = (vehicle: Vehicle) => {
    setVehicle(vehicle);
    setStep("passenger");
    formik.setValues({
      fullName: state.passengerInfo.fullName || "",
      phone: state.passengerInfo.phoneNumber || state.phoneNumber || "",
      email: state.passengerInfo.emailAddress || "",
      passengersCount: state.passengerInfo.passengersCount || 1,
      tripInstructions: state.passengerInfo.tripInstructions || "",
    });
  };

  const getReturnDateString = () => {
    if (!state.pickupDate) return "";
    const pDate = new Date(state.pickupDate);
    pDate.setDate(pDate.getDate() + state.numberOfDays);
    return pDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="wizard-page">
      {/* Dynamic Success Banner */}
      {step === "success" && (
        <div className="success-banner animate-fade-in">
          <div className="success-banner-content">
            <Check size={16} />
            <span>Booking Successful!</span>
          </div>
        </div>
      )}

      <Header />

      <main className="wizard-main-content">
        <div className="wizard-wrapper">
          {/* STEP 1: VEHICLE SELECTION */}
          {step === "vehicles" && (
            <div className="wizard-step-container">
              {/* Route Summary Bar */}
              <div className="route-summary-bar card-lowest">
                <div className="summary-info">
                  <div className="summary-trip-details">
                    <span className="summary-trip-type label-sm">{state.tripType}</span>
                    <span className="summary-journey-meta">
                      {state.tripType === "Round Trip" ? `${state.numberOfDays} Days Journey` : `${state.distanceKm ? state.distanceKm : 0} km`}
                    </span>
                  </div>
                  <div className="route-destinations">
                    <div className="destination-node">
                      <span className="node-label">FROM</span>
                      <span className="node-value">{state.pickup.name}</span>
                    </div>
                    <div className="node-divider-arrow">→</div>
                    <div className="destination-node">
                      <span className="node-label">TO</span>
                      <span className="node-value">{state.dropoff.name}</span>
                    </div>
                    <div className="node-divider-line"></div>
                    <div className="destination-node">
                      <span className="node-label">DEPARTURE</span>
                      <span className="node-value">{formatDisplayDate(state.pickupDate)}</span>
                    </div>
                    {state.tripType === "Round Trip" && (
                      <>
                        <div className="node-divider-line"></div>
                        <div className="destination-node">
                          <span className="node-label">RETURN</span>
                          <span className="node-value">{getReturnDateString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="edit-route-btn"
                  onClick={() => router.push("/")}
                  aria-label="Edit booking details"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              {/* Title Section */}
              <div className="step-title-section">
                <h1 className="headline-md">Vehicle Selection</h1>
                <p className="body-md subtitle">Select a car that fits your group and luggage needs.</p>
              </div>

              {/* Vehicle Cards Grid */}
              <div className="vehicle-grid">
                {vehicles.map((v) => {
                  const fare = calculateFare(v);
                  return (
                    <div
                      key={v.id}
                      className={`vehicle-card card-lowest ${v.isTopPick ? "top-pick-highlight" : ""}`}
                    >
                      {v.isTopPick && (
                        <div className="top-pick-badge label-sm">Top Pick</div>
                      )}
                      
                      <div className="vehicle-image-wrap">
                        <Image
                          src={v.image}
                          alt={v.name}
                          className="vehicle-img"
                          width={260}
                          height={180}
                        />
                      </div>

                      <div className="vehicle-info-wrap">
                        <h3 className="title-md vehicle-title">{v.name}</h3>
                        <div className="vehicle-price">₹{fare}/-</div>
                        <p className="vehicle-inclusions body-md">
                          {state.distanceKm ? `${state.distanceKm} kms` : "0 kms"}. {v.features}
                        </p>
                        
                        <button
                          type="button"
                          className="btn-primary select-car-btn"
                          onClick={() => handleSelectVehicle(v)}
                        >
                          SELECT CAR
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: PASSENGER DETAILS */}
          {step === "passenger" && state.selectedVehicle && (
            <div className="wizard-step-container">
              {/* Step Navigation Header */}
              <div className="passenger-step-header">
                <div className="back-link-nav" onClick={() => setStep("vehicles")}>
                  ← Back to Vehicle Selection
                </div>
                <h1 className="headline-md">Passenger Details</h1>
                <p className="body-md subtitle">Complete your booking details for a smooth ride experience.</p>
              </div>

              <div className="passenger-columns">
                {/* Left Side: Form */}
                <form onSubmit={formik.handleSubmit} className="passenger-form-column">
                  <div className="passenger-info-card card-container">
                    <h3 className="title-md section-card-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Your Information
                    </h3>

                    <div className="form-fields-grid">
                      <div className="input-field-container">
                        <label htmlFor="fullname" className="input-label">Full Name</label>
                        <div className="input-wrapper">
                          <input
                            type="text"
                            id="fullname"
                            name="fullName"
                            placeholder="Enter your full name"
                            value={formik.values.fullName}
                            onChange={(e) => {
                              formik.handleChange(e);
                              setPassengerInfo({ fullName: e.target.value });
                            }}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                        {formik.touched.fullName && formik.errors.fullName && (
                          <span className="field-error-message">{formik.errors.fullName}</span>
                        )}
                      </div>

                      <div className="input-field-container">
                        <label htmlFor="phone" className="input-label">Phone Number</label>
                        <div className="input-wrapper">
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            value={formik.values.phone}
                            onChange={(e) => {
                              formik.handleChange(e);
                              setPassengerInfo({ phoneNumber: e.target.value });
                            }}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                        {formik.touched.phone && formik.errors.phone && (
                          <span className="field-error-message">{formik.errors.phone}</span>
                        )}
                      </div>

                      <div className="input-field-container">
                        <label htmlFor="passengers" className="input-label">Number of Passengers</label>
                        <div className="input-wrapper">
                          <input
                            type="number"
                            id="passengers"
                            name="passengersCount"
                            min="1"
                            max="15"
                            value={formik.values.passengersCount}
                            onChange={(e) => {
                              formik.handleChange(e);
                              setPassengerInfo({ passengersCount: Number(e.target.value) });
                            }}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                        {formik.touched.passengersCount && formik.errors.passengersCount && (
                          <span className="field-error-message">{formik.errors.passengersCount}</span>
                        )}
                      </div>

                      <div className="input-field-container">
                        <label htmlFor="email" className="input-label">Email Address</label>
                        <div className="input-wrapper">
                          <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email address"
                            value={formik.values.email}
                            onChange={(e) => {
                              formik.handleChange(e);
                              setPassengerInfo({ emailAddress: e.target.value });
                            }}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                        {formik.touched.email && formik.errors.email && (
                          <span className="field-error-message">{formik.errors.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="input-field-container full-width-field">
                      <label htmlFor="instructions" className="input-label">Trip Instructions (Optional)</label>
                      <div className="input-wrapper">
                        <textarea
                          id="instructions"
                          name="tripInstructions"
                          placeholder="e.g. Trip instructions or landmarks for pickup"
                          value={formik.values.tripInstructions}
                          onChange={(e) => {
                            formik.handleChange(e);
                            setPassengerInfo({ tripInstructions: e.target.value });
                          }}
                          onBlur={formik.handleBlur}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secure Booking Info */}
                  <div className="secure-booking-card card-lowest">
                    <ShieldCheck size={20} className="secure-check-icon" />
                    <div className="secure-details">
                      <h4 className="title-sm font-semibold">Secure Booking</h4>
                      <p className="body-xs text-muted">Your privacy is our priority. All bookings are encrypted and secure.</p>
                    </div>
                  </div>
                </form>

                {/* Right Side: Fare Summary */}
                <div className="passenger-summary-column">
                  <div className="fare-summary-card card-container">
                    <h3 className="title-md summary-card-title">Fare Summary</h3>

                    <div className="summary-ledger">
                      <div className="ledger-row">
                        <span className="ledger-label">From</span>
                        <span className="ledger-value font-semibold">{state.pickup.name}</span>
                      </div>
                      <div className="ledger-row">
                        <span className="ledger-label">To</span>
                        <span className="ledger-value font-semibold">{state.dropoff.name}</span>
                      </div>
                      <div className="ledger-row">
                        <span className="ledger-label">Distance</span>
                        <span className="ledger-value">{state.distanceKm ? `${state.distanceKm} km` : "N/A"}</span>
                      </div>
                      <div className="ledger-row">
                        <span className="ledger-label">Car Type</span>
                        <span className="ledger-value">{state.selectedVehicle.name}</span>
                      </div>
                      <div className="ledger-row">
                        <span className="ledger-label">Driver Allowance</span>
                        <span className="ledger-value">
                          ₹{state.selectedVehicle.driverAllowancePerDay * (state.tripType === "Round Trip" ? state.numberOfDays : 1)}.00
                        </span>
                      </div>
                      <div className="ledger-row">
                        <span className="ledger-label">Trip Type</span>
                        <span className="ledger-value">{state.tripType}</span>
                      </div>
                    </div>

                    <div className="extra-charges-alert">
                      <h4 className="alert-title label-sm">Extra Fare Details</h4>
                      <p className="alert-content body-md">For Extra Km & Hill Toll charges will be calculated extra during journey if applicable.</p>
                    </div>

                    <div className="fare-total-row">
                      <span className="total-label">Total Fare</span>
                      <span className="total-value">₹{calculateFare(state.selectedVehicle)}</span>
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => formik.handleSubmit()}
                      className="btn-primary confirm-booking-btn"
                    >
                      {isLoading ? (
                        <div className="spinner-small"></div>
                      ) : (
                        <>
                          Confirm Booking
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    {error && (
                      <div className="error-message-box mt-4">
                        <span className="error-text">{error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BOOKING SUCCESS */}
          {step === "success" && state.bookingReceipt && (
            <div className="wizard-step-container success-layout animate-fade-in">
              <div className="success-card card-container">
                <div className="success-icon-wrap">
                  <div className="success-icon-bg">
                    <Check size={40} className="check-icon-large" />
                  </div>
                </div>

                <h1 className="success-title">Congratulations!</h1>
                <p className="success-subtitle body-md">
                  Your taxi has been booked successfully. Our team will reach out shortly.
                </p>

                {/* Journey Details Summary block */}
                <div className="success-journey-block">
                  <div className="success-journey-route">
                    <span className="journey-label font-bold text-primary">Journey: </span>
                    <span className="journey-text font-semibold">
                      {state.bookingReceipt.pickupLocation.split(",")[0]}
                      <span className="route-arrow"> → </span>
                      {state.bookingReceipt.dropoffLocation.split(",")[0]}
                    </span>
                  </div>
                  <div className="success-journey-fare">
                    <span className="fare-label font-bold text-primary">Total Fare: </span>
                    <span className="fare-text font-bold text-lg">₹{state.bookingReceipt.totalFare}</span>
                  </div>
                </div>

                {/* Receipt Details Collapse/Trigger */}
                <details className="receipt-details-collapsible">
                  <summary className="receipt-summary-btn btn-secondary">
                    View Booking Details
                  </summary>
                  <div className="receipt-content-dropdown card-lowest">
                    <table className="receipt-table">
                      <tbody>
                        <tr>
                          <td>Booking ID</td>
                          <td>{state.bookingReceipt.id}</td>
                        </tr>
                        <tr>
                          <td>Passenger</td>
                          <td>{state.bookingReceipt.fullName}</td>
                        </tr>
                        <tr>
                          <td>Phone</td>
                          <td>{state.bookingReceipt.phoneNumber}</td>
                        </tr>
                        <tr>
                          <td>Vehicle</td>
                          <td>{state.bookingReceipt.carType}</td>
                        </tr>
                        <tr>
                          <td>Date & Time</td>
                          <td>{state.bookingReceipt.pickupDate} at {state.bookingReceipt.pickupTime}</td>
                        </tr>
                        <tr>
                          <td>Distance</td>
                          <td>{state.bookingReceipt.distanceKm} km</td>
                        </tr>
                        {state.bookingReceipt.tripInstructions && (
                          <tr>
                            <td>Instructions</td>
                            <td>{state.bookingReceipt.tripInstructions}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>

                <button
                  type="button"
                  className="btn-primary done-btn"
                  onClick={() => {
                    resetBooking();
                    router.push("/");
                  }}
                >
                  Book Another Ride
                </button>
              </div>

              {/* Theme toggler aligned to bottom center */}
              <div className="theme-toggle-bottom">
                <button type="button" className="btn-secondary theme-toggle-btn" onClick={toggleTheme}>
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                  <span>Toggle Theme</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      
    </div>
  );
}

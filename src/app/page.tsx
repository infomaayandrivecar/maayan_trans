"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, Calendar, Clock, Phone, Award, Compass, Heart, ShieldCheck, Briefcase, Plane, Map, ChevronDown, Users, Luggage } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useBooking } from "./context/BookingContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PlacesAutocomplete from "./components/PlacesAutocomplete";
import Image from "next/image";
import DateTimePicker from "./components/DateTimePicker";

// Reusable Animation Variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const highlightCities = [
  { name: "New Delhi", x: 34.0, y: 29.5 },
  { name: "Mumbai", x: 23.5, y: 60.5 },
  { name: "Bengaluru", x: 36.0, y: 78.0 },
  { name: "Chennai", x: 42.5, y: 78.5 },
  { name: "Kochi", x: 35.0, y: 84.5 },
  { name: "Coimbatore", x: 37.0, y: 81.0 },
  { name: "Madurai", x: 39.5, y: 83.5 },
  { name: "Hyderabad", x: 39.5, y: 67.0 },
  { name: "Kolkata", x: 70.0, y: 50.0 }
];

export default function Home() {
  const router = useRouter();
  const {
    state,
    setTripType,
    setPickup,
    setDropoff,
    setPickupDate,
    setPickupTime,
    setDropDate,
    setDropTime,
    setNumberOfDays,
    setPhoneNumber,
    calculateDistance,
    isLoading: isBookingLoading,
    error: bookingError,
    vehicles,
  } = useBooking();

  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const daysDropdownRef = useRef<HTMLDivElement>(null);

  // Close days dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (daysDropdownRef.current && !daysDropdownRef.current.contains(event.target as Node)) {
        setShowDaysDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formik = useFormik({
    initialValues: {
      tripType: state.tripType,
      pickup: state.pickup,
      dropoff: state.dropoff,
      pickupDate: state.pickupDate,
      pickupTime: state.pickupTime,
      dropDate: state.dropDate || "",
      dropTime: state.dropTime || "",
      numberOfDays: state.numberOfDays,
      phoneNumber: state.phoneNumber || "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      tripType: Yup.string().required(),
      pickup: Yup.object().nullable().required("Please enter a valid pickup address."),
      dropoff: Yup.object().nullable().required("Please enter a valid destination address."),
      pickupDate: Yup.string().required("Please select a pickup date."),
      pickupTime: Yup.string()
        .required("Please select a pickup time.")
        .test(
          "future-time",
          "Selected pickup time must be at least 30 minutes in the future from now. Please choose a later time.",
          function (value) {
            const { pickupDate } = this.parent;
            if (!pickupDate || !value) return true;
            const now = new Date();
            const [year, month, day] = pickupDate.split("-").map(Number);
            const [hours, minutes] = value.split(":").map(Number);
            const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
            const minValidTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes buffer
            return dateObj.getTime() >= minValidTime.getTime();
          }
        ),
      dropTime: Yup.string().when("tripType", {
        is: "Round Trip",
        then: (schema) => schema
          .required("Please select a drop-off time.")
          .test(
            "after-pickup",
            "Drop-off time must be after pickup time.",
            function (value) {
              const { pickupDate, pickupTime } = this.parent;
              if (!pickupDate || !pickupTime || !value) return true;
              const pickupObj = new Date(`${pickupDate}T${pickupTime}`);
              const dropObj = new Date(`${pickupDate}T${value}`);
              return dropObj.getTime() > pickupObj.getTime();
            }
          ),
        otherwise: (schema) => schema.notRequired(),
      }),
      numberOfDays: Yup.number().when("tripType", {
        is: "Outstation Trip",
        then: (schema) => schema.min(1, "Number of days must be at least 1").required("Number of days is required."),
        otherwise: (schema) => schema.notRequired(),
      }),
      phoneNumber: Yup.string()
        .required("Please enter a valid phone number (min 10 digits).")
        .matches(/^\d+$/, "Phone number must contain only digits.")
        .min(10, "Please enter a valid phone number (min 10 digits)."),
    }),
    onSubmit: async (values) => {
      setPhoneNumber(values.phoneNumber);
      if (values.tripType === "Round Trip") {
        setDropDate(values.pickupDate);
        setDropTime(values.dropTime);
      }
      const success = await calculateDistance();
      if (success) {
        router.push("/booking");
      }
    },
  });

  return (
    <div className="landing-page">
      <Header />

      <main className="main-content">
        {/* HERO SECTION */}
        <section className="hero-section" style={{ position: 'relative', overflow: 'visible', zIndex: 5 }}>
          {/* Subtle animated background gradient */}
          <motion.div
            className="hero-bg-gradient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'radial-gradient(circle at top right, var(--surface-tint-5), transparent)',
              zIndex: -1
            }}
          />

          {/* India Map Background */}
          <motion.div
            animate={{
              x: [0, 15, -15, 0],
              y: [0, 10, -10, 0],
              scale: [1, 1.01, 0.99, 1],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="hero-map-container"
          >
            {/* Map Image Layer */}
            <div className="bg-map-element-layer" />

            {/* Interactive pulsing markers */}
            {highlightCities.map((city) => (
              <div
                key={city.name}
                className="map-marker-container"
                style={{
                  position: 'absolute',
                  left: `${city.x}%`,
                  top: `${city.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="map-marker-pulse" />
                <div className="map-marker-dot" />
              </div>
            ))}
          </motion.div>

          <div className="hero-container">
            {/* Left Content (Animated) */}
            <motion.div
              className="hero-text-area"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.span variants={fadeIn} className="hero-badge label-sm">Reliable Inter-City Travel</motion.span>
              <motion.h1 variants={fadeIn} className="display-lg hero-title">
                Your Premium Journey <span className="highlight-text">Starts Here.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="hero-description body-md">
                Experience professional outstation taxi services, airport transfers, and corporate travel solutions with punctuality at its core. Book your ride across cities with ease and comfort.
              </motion.p>

              {/* Stats HUD with CountUp */}
              <motion.div variants={fadeIn} className="stats-row" style={{ marginTop: '2rem' }}>
                <div className="stat-item">
                  <span className="stat-number">
                    <CountUp end={50} duration={2.5} enableScrollSpy scrollSpyOnce />k+
                  </span>
                  <span className="stat-label">Happy Riders</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">
                    <CountUp end={120} duration={2.5} enableScrollSpy scrollSpyOnce />+
                  </span>
                  <span className="stat-label">Cities Covered</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">
                    <CountUp end={4.9} decimals={1} duration={2.5} enableScrollSpy scrollSpyOnce />/5
                  </span>
                  <span className="stat-label">Avg. Rating</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Booking Card (Animated) */}
            <motion.div
              className="hero-form-area"
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <div className="booking-card card-container" style={{ boxShadow: 'var(--shadow-ambient)' }}>
                {/* Tabs */}
                <div className="booking-tabs" style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    className={`tab-btn ${formik.values.tripType === "One Way" ? "active" : ""}`}
                    onClick={() => {
                      setTripType("One Way");
                      formik.setFieldValue("tripType", "One Way");
                    }}
                  >
                    One Way
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${formik.values.tripType === "Round Trip" ? "active" : ""}`}
                    onClick={() => {
                      setTripType("Round Trip");
                      formik.setFieldValue("tripType", "Round Trip");
                    }}
                  >
                    Round Trip
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${formik.values.tripType === "Outstation Trip" ? "active" : ""}`}
                    onClick={() => {
                      setTripType("Outstation Trip");
                      formik.setFieldValue("tripType", "Outstation Trip");
                    }}
                  >
                    Outstation
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={formik.handleSubmit} className="booking-form">
                  <div className="input-field-container">
                    <label htmlFor="pickup-input" className="input-label">Pickup Location</label>
                    <PlacesAutocomplete
                      id="pickup-input"
                      placeholder="Enter pickup city or address"
                      icon={<MapPin size={18} />}
                      initialValue={formik.values.pickup?.name ? `${formik.values.pickup.name}, ${formik.values.pickup.formattedAddress}` : ""}
                      onSelect={(place) => {
                        setPickup(place);
                        formik.setFieldValue("pickup", place);
                      }}
                    />
                    {formik.touched.pickup && formik.errors.pickup && (
                      <span className="field-error-message">{formik.errors.pickup}</span>
                    )}
                  </div>

                  <div className="input-field-container">
                    <label htmlFor="dropoff-input" className="input-label">Drop-off Location</label>
                    <PlacesAutocomplete
                      id="dropoff-input"
                      placeholder="Enter destination city"
                      icon={<Navigation size={18} />}
                      initialValue={formik.values.dropoff?.name ? `${formik.values.dropoff.name}, ${formik.values.dropoff.formattedAddress}` : ""}
                      onSelect={(place) => {
                        setDropoff(place);
                        formik.setFieldValue("dropoff", place);
                      }}
                    />
                    {formik.touched.dropoff && formik.errors.dropoff && (
                      <span className="field-error-message">{formik.errors.dropoff}</span>
                    )}
                  </div>

                  <DateTimePicker
                    pickupDate={formik.values.pickupDate}
                    pickupTime={formik.values.pickupTime}
                    setPickupDate={(date) => {
                      setPickupDate(date);
                      formik.setFieldValue("pickupDate", date);
                    }}
                    setPickupTime={(time) => {
                      setPickupTime(time);
                      formik.setFieldValue("pickupTime", time);
                    }}
                  />
                  {/* Inline validator feedback for Date/Time picker validation errors */}
                  {((formik.touched.pickupDate && formik.errors.pickupDate) || (formik.touched.pickupTime && formik.errors.pickupTime)) && (
                    <span className="field-error-message" style={{ marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                      {formik.errors.pickupDate || formik.errors.pickupTime}
                    </span>
                  )}

                  <div className={(formik.values.tripType === "Outstation Trip" || formik.values.tripType === "Round Trip") ? "form-row-2" : "form-row-1"}>
                    <div className="input-field-container">
                      <label htmlFor="phone-input" className="input-label">Phone Number</label>
                      <div className="input-wrapper">
                        <Phone size={18} />
                        <input
                          type="tel"
                          id="phone-input"
                          name="phoneNumber"
                          placeholder="Enter phone number"
                          value={formik.values.phoneNumber}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, "");
                            formik.setFieldValue("phoneNumber", cleaned);
                            setPhoneNumber(cleaned);
                          }}
                          onBlur={formik.handleBlur}
                        />
                      </div>
                      {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                        <span className="field-error-message">{formik.errors.phoneNumber}</span>
                      )}
                    </div>

                    {formik.values.tripType === "Round Trip" && (
                      <div className="input-field-container">
                        <DateTimePicker
                          pickupDate={formik.values.pickupDate}
                          pickupTime={formik.values.dropTime}
                          setPickupDate={() => { }}
                          setPickupTime={(time) => {
                            setDropTime(time);
                            formik.setFieldValue("dropTime", time);
                          }}
                          timeLabel="Drop Time"
                          showDate={false}
                          minDateTime={(formik.values.pickupDate && formik.values.pickupTime) ? `${formik.values.pickupDate}T${formik.values.pickupTime}` : undefined}
                        />
                        {/* Inline validator feedback for Drop Time picker validation errors */}
                        {formik.touched.dropTime && formik.errors.dropTime && (
                          <span className="field-error-message" style={{ marginTop: '0rem' }}>
                            {formik.errors.dropTime}
                          </span>
                        )}
                      </div>
                    )}

                    {(formik.values.tripType === "Outstation Trip") && (
                      <div className="input-field-container" ref={daysDropdownRef} style={{ position: 'relative' }}>
                        <label className="input-label">Number of Days</label>
                        <div
                          className={`custom-picker-trigger ${showDaysDropdown ? "active" : ""}`}
                          onClick={() => setShowDaysDropdown(!showDaysDropdown)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Calendar size={18} className="trigger-icon" style={{ marginRight: '0.8rem' }} />
                            <span className="trigger-value">
                              {formik.values.numberOfDays} {formik.values.numberOfDays === 1 ? "Day" : "Days"}
                            </span>
                          </div>
                          <ChevronDown size={18} className="trigger-icon" />
                        </div>

                        <AnimatePresence>
                          {showDaysDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="picker-popover card-lowest days-dropdown-popover"
                              style={{
                                position: 'absolute',
                                top: '105%',
                                left: 0,
                                zIndex: 120,
                                width: '100%',
                                maxHeight: '240px',
                                overflowY: 'auto',
                                padding: '0.5rem',
                              }}
                            >
                              {[...Array(15)].map((_, i) => {
                                const daysVal = i + 1;
                                const isSelected = formik.values.numberOfDays === daysVal;
                                return (
                                  <button
                                    key={daysVal}
                                    type="button"
                                    className={`time-cell ${isSelected ? "selected" : ""}`}
                                    style={{
                                      width: '100%',
                                      padding: '0.6rem 1rem',
                                      textAlign: 'left',
                                      display: 'block',
                                      borderRadius: 'var(--radius-sm)',
                                      fontFamily: 'var(--font-body)',
                                      fontSize: '0.85rem',
                                      fontWeight: isSelected ? '700' : '500',
                                    }}
                                    onClick={() => {
                                      setNumberOfDays(daysVal);
                                      formik.setFieldValue("numberOfDays", daysVal);
                                      setShowDaysDropdown(false);
                                    }}
                                  >
                                    {daysVal} {daysVal === 1 ? "Day" : "Days"}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {formik.touched.numberOfDays && formik.errors.numberOfDays && (
                          <span className="field-error-message">{formik.errors.numberOfDays}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {bookingError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-message-box">
                      <span className="error-text">
                        {bookingError}
                      </span>
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isBookingLoading}
                    className="btn-primary form-submit-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isBookingLoading ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <>
                        <Navigation size={18} style={{ marginRight: '8px' }} />
                        GET FARE
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SERVICES GRID SECTION (SEO OPTIMIZED) */}
        <section id="services" className="features-section">
          <div className="section-container">
            <motion.div
              className="section-header"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
            >
              <span className="hero-badge label-sm" style={{ display: 'inline-block', marginBottom: '1.25rem', padding: '0.4rem 1.1rem' }}>Our Offerings</span>
              <h2 className="headline-md section-title" style={{ fontWeight: 800 }}>Comprehensive Transportation Services</h2>
              <p className="section-subtitle body-md" style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>Whether you need a quick local ride or a long outstation journey, Maayan Trans delivers excellence.</p>
            </motion.div>

            <motion.div
              className="services-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {[
                { icon: <Map size={28} />, title: "Outstation Taxi Services", desc: "Reliable outstation cabs for comfortable inter-city travel. Transparent billing with no hidden costs." },
                { icon: <Plane size={28} />, title: "Airport Transfers", desc: "Punctual airport pick-up and drop-off services to ensure you never miss a flight." },
                { icon: <Navigation size={28} />, title: "Local City Rides", desc: "Explore the city with our premium local rental packages. Hourly and full-day booking available." },
                { icon: <Briefcase size={28} />, title: "Corporate Travel Solutions", desc: "Executive transportation for business professionals. Streamlined billing and premium fleet options." }
              ].map((service, idx) => (
                <motion.div
                  key={idx}
                  className="feature-card"
                  variants={fadeIn}
                >
                  <div className="feature-icon-wrap">
                    {service.icon}
                  </div>
                  <h3 className="title-md feature-card-title">{service.title}</h3>
                  <p className="body-md feature-card-desc">{service.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CAR RENTAL / FLEET SECTION */}
        <section id="fleet" className="features-section" style={{ backgroundColor: 'var(--surface-container-lowest)', borderTop: '1px solid var(--outline-variant)' }}>
          <div className="section-container">
            <motion.div
              className="section-header"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
            >
              <span className="hero-badge label-sm" style={{ display: 'inline-block', marginBottom: '1.25rem', padding: '0.4rem 1.1rem' }}>Our Fleet</span>
              <h2 className="headline-md section-title" style={{ fontWeight: 800 }}>Explore Our Car Options</h2>
              <p className="section-subtitle body-md" style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
                Select from our premium range of well-maintained vehicles. Ideal for outstation travel, airport transfers, and local daily use.
              </p>
            </motion.div>

            <motion.div
              className="fleet-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                marginTop: '3rem'
              }}
            >
              {[
                {
                  id: "hatchback",
                  name: "Hatchback",
                  defaultImage: "/images/hatchback.png",
                  passengers: "4 Passengers",
                  luggage: "2 Bags",
                  defaultRate: 13,
                  type: "Suzuki WagonR / Swift or equivalent",
                  features: ["Air Conditioned", "Economical City Ride", "Well-Maintained & Clean"]
                },
                {
                  id: "sedan",
                  name: "Sedan",
                  defaultImage: "/images/sedan.png",
                  passengers: "4 Passengers",
                  luggage: "3 Bags",
                  defaultRate: 14,
                  type: "Suzuki Dzire / Toyota Etios or equivalent",
                  features: ["Extra Boot Space", "Comfortable Legroom", "Perfect for Intercity"]
                },
                {
                  id: "premium_sedan",
                  name: "Premium Sedan",
                  defaultImage: "/images/premium_sedan.png",
                  passengers: "4 Passengers",
                  luggage: "3 Bags",
                  defaultRate: 16,
                  type: "Honda City / Hyundai Verna or equivalent",
                  features: ["Premium Interior", "Superior Comfort", "Business & Family Travel"]
                },
                {
                  id: "suv",
                  name: "SUV",
                  defaultImage: "/images/suv.png",
                  passengers: "6-7 Passengers",
                  luggage: "4 Bags",
                  defaultRate: 17.5,
                  type: "Suzuki Ertiga / Mahindra Marazzo or equivalent",
                  features: ["Spacious Seating", "Great for Families", "High Ground Clearance"]
                },
                {
                  id: "premium_suv",
                  name: "Premium SUV",
                  defaultImage: "/images/premium_suv.png",
                  passengers: "7 Passengers",
                  luggage: "5 Bags",
                  defaultRate: 20,
                  type: "Toyota Innova Crysta or equivalent",
                  features: ["Ultra-Premium Comfort", "Captain Seats", "Top Choice for Long Distance"]
                }
              ].map((car, idx) => {
                const matchedVehicle = vehicles?.find(v => v.id === car.id);
                const rate = matchedVehicle ? matchedVehicle.ratePerKm : car.defaultRate;
                const image = matchedVehicle ? matchedVehicle.image : car.defaultImage;

                return (
                  <motion.div
                    key={idx}
                    className="feature-card card-lowest fleet-card"
                    variants={fadeIn}
                    whileHover={{ y: -8 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--outline-variant)',
                      backgroundColor: 'var(--surface)',
                      transition: 'all 0.3s ease',
                      boxShadow: 'var(--shadow-flat)',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Car Image container */}
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '180px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderRadius: 'var(--radius-md)',
                        background: 'radial-gradient(circle, var(--surface-tint-5) 0%, transparent 70%)'
                      }}>
                        <Image
                          src={image}
                          alt={car.name}
                          width={280}
                          height={160}
                          style={{
                            objectFit: 'contain',
                            filter: 'drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.08))'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                        <h3 className="title-md" style={{ fontWeight: 700, margin: 0 }}>{car.name}</h3>
                        <span className="label-sm" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                          ₹{rate}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--on-surface-variant)' }}>/km</span>
                        </span>
                      </div>

                      <p className="body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                        {car.type}
                      </p>

                      {/* Passenger / Luggage Capacities */}
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderTop: '1px solid var(--outline-variant)', borderBottom: '1px solid var(--outline-variant)', padding: '0.5rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--on-surface)' }}>
                          <Users size={14} style={{ color: 'var(--primary)' }} />
                          <span>{car.passengers}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--on-surface)' }}>
                          <Luggage size={14} style={{ color: 'var(--primary)' }} />
                          <span>{car.luggage}</span>
                        </div>
                      </div>

                      {/* Features List */}
                      <ul style={{ paddingLeft: '1.1rem', margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {car.features.map((feat, fIdx) => (
                          <li key={fIdx} className="body-sm" style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: 'none'
                      }}
                    >
                      <span>Book {car.name} Now</span>
                      <Navigation size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* SELF-DRIVE CAR RENTAL SECTION */}
        <section id="self-drive" className="features-section" style={{ borderTop: '1px solid var(--outline-variant)', backgroundColor: 'transparent' }}>
          <div className="section-container">
            <motion.div
              className="section-header"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
            >
              <span className="hero-badge label-sm" style={{ display: 'inline-block', marginBottom: '1.25rem', padding: '0.4rem 1.1rem' }}>Drive Yourself</span>
              <h2 className="headline-md section-title" style={{ fontWeight: 800 }}>Self-Drive Car Rentals</h2>
              <p className="section-subtitle body-md" style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
                Rent a car and take the wheel. Enjoy complete freedom, privacy, and zero driver allowance costs. Perfect for weekend getaways, family outings, and long road trips.
              </p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", marginTop: "3rem" }}>
              {/* Left Column: Benefits & How It Works */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
              >
                <h3 className="title-md" style={{ fontWeight: 700, borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.75rem", color: "var(--primary)" }}>
                  Why Choose Self-Drive?
                </h3>

                {[
                  { title: "Complete Privacy & Freedom", desc: "No driver, no schedules. Go where you want, when you want, and enjoy the journey with your loved ones." },
                  { title: "Zero Driver Allowance Costs", desc: "Save on driver fees and allowances. You only pay for the car rental and fuel." },
                  { title: "Doorstep Delivery & Collection", desc: "Have the car delivered to your home, office, or airport and collected when you return." },
                  { title: "24/7 Roadside Assistance", desc: "Drive with peace of mind. We provide round-the-clock emergency support for breakdowns or issues." }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeIn}
                    className="feature-card card-lowest"
                    whileHover={{ y: -4 }}
                    style={{
                      display: "flex",
                      gap: "1.25rem",
                      padding: "1.25rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--outline-variant)",
                      backgroundColor: "var(--surface)",
                      boxShadow: "var(--shadow-flat)",
                      alignItems: "flex-start"
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255, 179, 0, 0.1)",
                      border: "1px solid rgba(255, 179, 0, 0.25)",
                      color: "var(--primary)",
                      flexShrink: 0
                    }}>
                      <ShieldCheck size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 className="title-sm" style={{ fontWeight: 700, margin: "0 0 0.35rem 0", fontSize: "0.95rem" }}>{item.title}</h4>
                      <p className="body-md" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", margin: 0, lineHeight: 1.45 }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Right Column: Fleet Options & Pricing */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
              >
                <h3 className="title-md" style={{ fontWeight: 700, borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.75rem", color: "var(--primary)" }}>
                  Available Categories & Pricing
                </h3>

                {[
                  {
                    name: "Self-Drive Hatchbacks",
                    models: "Maruti Swift, Hyundai i20, or equivalent",
                    price: "₹1,200",
                    image: "/images/hatchback.png"
                  },
                  {
                    name: "Self-Drive Sedans",
                    models: "Maruti Dzire, Honda Amaze, or equivalent",
                    price: "₹1,500",
                    image: "/images/sedan.png"
                  },
                  {
                    name: "Self-Drive SUVs",
                    models: "Mahindra Thar, Maruti Ertiga, Hyundai Creta",
                    price: "₹2,000",
                    image: "/images/suv.png"
                  }
                ].map((cat, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeIn}
                    className="feature-card card-lowest"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.25rem",
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--outline-variant)",
                      backgroundColor: "var(--surface)",
                      boxShadow: "var(--shadow-flat)"
                    }}
                  >
                    <div style={{
                      position: "relative",
                      width: "90px",
                      height: "60px",
                      flexShrink: 0,
                      background: "radial-gradient(circle, var(--surface-tint-5) 0%, transparent 70%)"
                    }}>
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 className="title-sm" style={{ fontWeight: 700, margin: "0 0 0.15rem 0" }}>{cat.name}</h4>
                      <p className="body-sm" style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem", margin: "0 0 0.4rem 0" }}>{cat.models}</p>
                      <span className="label-sm" style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.95rem" }}>
                        Starting from {cat.price}<span style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--on-surface-variant)" }}>/day</span>
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* CTA Button */}
                <motion.div variants={fadeIn} style={{ marginTop: "1rem" }}>
                  <a
                    href="https://wa.me/+919894221664?text=Hi%20Maayan%20Trans,%20I%20am%20interested%20in%20booking%20a%20Self-Drive%20Car%20Rental."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.75rem",
                      textDecoration: "none",
                      boxShadow: "none"
                    }}
                  >
                    <span>Enquire on WhatsApp</span>
                    <Phone size={14} />
                  </a>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* TRUST & SAFETY SECTION (SEO OPTIMIZED) */}
        <section className="features-section">
          <div className="section-container">
            <motion.div
              className="section-header"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="headline-md section-title">Why Choose Maayan Trans?</h2>
              <p className="section-subtitle body-md">We are committed to delivering safe, affordable, and transparent pricing for every ride.</p>
            </motion.div>

            <motion.div
              className="features-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeIn} className="feature-card card-lowest">
                <div className="feature-icon-wrap"><Award size={24} /></div>
                <h3 className="title-md feature-card-title">Affordable & Transparent Pricing</h3>
                <p className="body-md feature-card-desc">No hidden charges or surge pricing. Know exactly what you pay before you ride with our clear fare calculator.</p>
              </motion.div>

              <motion.div variants={fadeIn} className="feature-card card-lowest">
                <div className="feature-icon-wrap"><ShieldCheck size={24} /></div>
                <h3 className="title-md feature-card-title">Safe & Professional Drivers</h3>
                <p className="body-md feature-card-desc">Our drivers are strictly vetted, highly trained professionals dedicated to your safety and comfort on the road.</p>
              </motion.div>

              <motion.div variants={fadeIn} className="feature-card card-lowest">
                <div className="feature-icon-wrap"><Heart size={24} /></div>
                <h3 className="title-md feature-card-title">24/7 Customer Support</h3>
                <p className="body-md feature-card-desc">Our dedicated support team is available around the clock to assist you with bookings and travel queries.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="about-section">
          <div className="about-container">
            <motion.div
              className="about-image-column"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="about-image-wrapper">
                <Image
                  src="/images/about_car.png"
                  alt="Premium Maayan station wagon cab for outstation travel"
                  className="about-image"
                  width={600}
                  height={400}
                  priority
                />
              </div>
            </motion.div>

            <motion.div
              className="about-text-column"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="headline-md about-title">About Maayan Trans & Services</h2>
              <p className="about-description body-md">
                <strong>Maayan Trans & Services</strong> is your trusted partner for comfortable and reliable inter-city travel. We pride ourselves on punctual service, professional drivers, and a fleet of well-maintained vehicles to ensure your journey is safe and pleasant. Whether it's a corporate trip or a family vacation, we guarantee the best mobility experience.
              </p>

              <div className="checklist-container">
                <div className="check-item">
                  <ShieldCheck size={20} className="check-icon" style={{ color: '#ffb300' }} />
                  <span className="check-text body-md">Certified Chauffeurs</span>
                </div>
                <div className="check-item">
                  <ShieldCheck size={20} className="check-icon" style={{ color: '#ffb300' }} />
                  <span className="check-text body-md">Premium Executive Fleet</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

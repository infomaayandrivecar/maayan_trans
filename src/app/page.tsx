"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, Calendar, Clock, Phone, Award, Compass, Heart, ShieldCheck, Briefcase, Plane, Map, ChevronDown } from "lucide-react";
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

export default function Home() {
  const router = useRouter();
  const {
    state,
    setTripType,
    setPickup,
    setDropoff,
    setPickupDate,
    setPickupTime,
    setNumberOfDays,
    setPhoneNumber,
    calculateDistance,
    isLoading: isBookingLoading,
    error: bookingError,
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
      numberOfDays: Yup.number().when("tripType", {
        is: (val: string) => val === "Round Trip" || val === "Outstation Trip",
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
        <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
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

                  <div className={(formik.values.tripType === "Round Trip" || formik.values.tripType === "Outstation Trip") ? "form-row-2" : "form-row-1"}>
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

                    {(formik.values.tripType === "Round Trip" || formik.values.tripType === "Outstation Trip") && (
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

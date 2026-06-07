"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Place {
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

export interface Vehicle {
  id: string;
  name: string;
  image: string;
  ratePerKm: number;
  driverAllowancePerDay: number;
  tollPermitCharge: number;
  features: string;
  isTopPick?: boolean;
  oneWayMinKmPerHour?: number;
  oneWayHourRate?: number;
  roundTripHourRate?: number;
  outstationHourRate?: number;
  outstationMinKmPerDay?: number;
  outstationHoursPerDay?: number;
}

export interface PassengerInfo {
  fullName: string;
  phoneNumber: string;
  emailAddress?: string;
  passengersCount: number;
  tripInstructions: string;
}

export interface BookingReceipt {
  id: string;
  createdAt: string;
  fullName: string;
  phoneNumber: string;
  emailAddress?: string;
  passengersCount: number;
  tripInstructions: string;
  tripType: "One Way" | "Round Trip" | "Outstation Trip";
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  numberOfDays: number;
  carType: string;
  distanceKm: number;
  totalFare: number;
}

export interface CompanySettings {
  phone: string;
  email: string;
  address: string;
  marqueeText?: string;
  notificationEmails?: string[];
  gst?: string;
  pan?: string;
  minKmOneWay?: number;
  minKmRoundTrip?: number;
  minKmOutstation?: number;
}

export interface VehicleSettings {
  ratePerKm: number;
  driverAllowancePerDay: number;
  oneWayMinKmPerHour?: number;
  oneWayHourRate?: number;
  roundTripHourRate?: number;
  outstationHourRate?: number;
  outstationMinKmPerDay?: number;
  outstationHoursPerDay?: number;
}

export interface SettingsData {
  company: CompanySettings;
  vehicles: Record<string, VehicleSettings>;
}

export const DEFAULT_SETTINGS: SettingsData = {
  company: {
    phone: "+91 98942 21664",
    email: "maayantransporters@gmail.com",
    address: "11-E, RKK Nagar, Singanallur, Coimbatore, Tamil Nadu, India",
    marqueeText: "✨ Welcome to Maayan Trans & Services! Premium Inter-City Travel, Airport Transfers, and Local Rides at Affordable Rates. ✨ | 📞 Call us at +91 98942 21664 to book your ride today! 📞 | ⭐ Safe, Vetted, and Professional Drivers for a Premium Experience. ⭐",
    notificationEmails: ["info.maayandrivecar@gmail.com"],
    minKmOneWay: 5,
    minKmRoundTrip: 5,
    minKmOutstation: 100
  },
  vehicles: {
    hatchback: { ratePerKm: 13, driverAllowancePerDay: 300, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 170, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
    sedan: { ratePerKm: 14, driverAllowancePerDay: 350, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 170, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
    premium_sedan: { ratePerKm: 16, driverAllowancePerDay: 400, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 170, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
    suv: { ratePerKm: 17.5, driverAllowancePerDay: 450, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 170, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
    premium_suv: { ratePerKm: 20, driverAllowancePerDay: 500, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 170, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
  },
};

export interface BookingState {
  tripType: "One Way" | "Round Trip" | "Outstation Trip";
  pickup: Place | null;
  dropoff: Place | null;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  numberOfDays: number;
  phoneNumber: string; // quick contact from landing
  distanceKm: number | null;
  durationText: string;
  selectedVehicle: Vehicle | null;
  passengerInfo: PassengerInfo;
  bookingReceipt: BookingReceipt | null;
  settings: SettingsData;
}

interface BookingContextType {
  state: BookingState;
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  setTripType: (type: "One Way" | "Round Trip" | "Outstation Trip") => void;
  setPickup: (place: Place | null) => void;
  setDropoff: (place: Place | null) => void;
  setPickupDate: (date: string) => void;
  setPickupTime: (time: string) => void;
  setDropDate: (date: string) => void;
  setDropTime: (time: string) => void;
  setNumberOfDays: (days: number) => void;
  setPhoneNumber: (phone: string) => void;
  setVehicle: (vehicle: Vehicle) => void;
  setPassengerInfo: (info: Partial<PassengerInfo>) => void;
  calculateDistance: () => Promise<boolean>;
  calculateFare: (vehicle: Vehicle, includeDriverAllowance?: boolean) => number;
  getRoundTripHours: () => number;
  submitBooking: (overrideInfo?: Partial<PassengerInfo>) => Promise<boolean>;
  resetBooking: () => void;
  refreshSettings: () => Promise<void>;
}

const VEHICLES: Vehicle[] = [
  {
    id: "hatchback",
    name: "HATCHBACK",
    image: "/images/hatchback.png",
    ratePerKm: 13,
    driverAllowancePerDay: 300,
    tollPermitCharge: 0,
    features: "Driver Betta, Parking, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
    oneWayMinKmPerHour: 20,
    oneWayHourRate: 170,
    roundTripHourRate: 170,
    outstationHourRate: 170,
    outstationMinKmPerDay: 250,
  },
  {
    id: "sedan",
    name: "SEDAN",
    image: "/images/sedan.png",
    ratePerKm: 14,
    driverAllowancePerDay: 350,
    tollPermitCharge: 0,
    features: "Driver Betta, Parking, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
    oneWayMinKmPerHour: 20,
    oneWayHourRate: 170,
    roundTripHourRate: 170,
    outstationHourRate: 170,
    outstationMinKmPerDay: 250,
  },
  {
    id: "premium_sedan",
    name: "PREMIUM SEDAN",
    image: "/images/premium_sedan.png",
    ratePerKm: 16,
    driverAllowancePerDay: 400,
    tollPermitCharge: 0,
    features: "Driver Betta, Parking, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
    isTopPick: true,
    oneWayMinKmPerHour: 20,
    oneWayHourRate: 170,
    roundTripHourRate: 170,
    outstationHourRate: 170,
    outstationMinKmPerDay: 250,
  },
  {
    id: "suv",
    name: "SUV",
    image: "/images/suv.png",
    ratePerKm: 17.5,
    driverAllowancePerDay: 450,
    tollPermitCharge: 0,
    features: "Driver Betta, Parking, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
    oneWayMinKmPerHour: 20,
    oneWayHourRate: 170,
    roundTripHourRate: 170,
    outstationHourRate: 170,
    outstationMinKmPerDay: 250,
  },
  {
    id: "premium_suv",
    name: "PREMIUM SUV",
    image: "/images/premium_suv.png",
    ratePerKm: 20,
    driverAllowancePerDay: 500,
    tollPermitCharge: 0,
    features: "Driver Betta, Parking, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
    oneWayMinKmPerHour: 20,
    oneWayHourRate: 170,
    roundTripHourRate: 170,
    outstationHourRate: 170,
    outstationMinKmPerDay: 250,
  },
];

const initialPassengerInfo: PassengerInfo = {
  fullName: "",
  phoneNumber: "",
  emailAddress: "",
  passengersCount: 1,
  tripInstructions: "",
};

const defaultState: BookingState = {
  tripType: "One Way",
  pickup: null,
  dropoff: null,
  pickupDate: "",
  pickupTime: "",
  dropDate: "",
  dropTime: "",
  numberOfDays: 1,
  phoneNumber: "",
  distanceKm: null,
  durationText: "",
  selectedVehicle: null,
  passengerInfo: initialPassengerInfo,
  bookingReceipt: null,
  settings: DEFAULT_SETTINGS,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookingState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize vehicles list with rates applied from settings
  const vehicles = React.useMemo(() => {
    return VEHICLES.map(v => {
      const custom = state.settings?.vehicles?.[v.id];
      if (custom) {
        return {
          ...v,
          ratePerKm: custom.ratePerKm,
          driverAllowancePerDay: custom.driverAllowancePerDay,
          oneWayMinKmPerHour: custom.oneWayMinKmPerHour,
          oneWayHourRate: custom.oneWayHourRate,
          roundTripHourRate: custom.roundTripHourRate,
          outstationHourRate: custom.outstationHourRate,
          outstationMinKmPerDay: custom.outstationMinKmPerDay,
          outstationHoursPerDay: custom.outstationHoursPerDay,
        };
      }
      return v;
    });
  }, [state.settings]);

  const refreshSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setState(prev => {
          const updatedSelectedVehicle = prev.selectedVehicle
            ? {
              ...prev.selectedVehicle,
              ratePerKm: data.vehicles[prev.selectedVehicle.id]?.ratePerKm ?? prev.selectedVehicle.ratePerKm,
              driverAllowancePerDay: data.vehicles[prev.selectedVehicle.id]?.driverAllowancePerDay ?? prev.selectedVehicle.driverAllowancePerDay,
              oneWayMinKmPerHour: data.vehicles[prev.selectedVehicle.id]?.oneWayMinKmPerHour ?? prev.selectedVehicle.oneWayMinKmPerHour,
              oneWayHourRate: data.vehicles[prev.selectedVehicle.id]?.oneWayHourRate ?? prev.selectedVehicle.oneWayHourRate,
              roundTripHourRate: data.vehicles[prev.selectedVehicle.id]?.roundTripHourRate ?? prev.selectedVehicle.roundTripHourRate,
              outstationHourRate: data.vehicles[prev.selectedVehicle.id]?.outstationHourRate ?? prev.selectedVehicle.outstationHourRate,
              outstationMinKmPerDay: data.vehicles[prev.selectedVehicle.id]?.outstationMinKmPerDay ?? prev.selectedVehicle.outstationMinKmPerDay,
              outstationHoursPerDay: data.vehicles[prev.selectedVehicle.id]?.outstationHoursPerDay ?? prev.selectedVehicle.outstationHoursPerDay,
            }
            : null;
          return {
            ...prev,
            settings: data,
            selectedVehicle: updatedSelectedVehicle,
          };
        });
      }
    } catch (err) {
      console.error("Failed to refresh settings:", err);
    }
  };

  // Load state and settings on mount
  useEffect(() => {
    const loadStateAndSettings = async () => {
      let loadedState = defaultState;
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("maayan_booking_state");
        if (saved) {
          try {
            loadedState = JSON.parse(saved);
          } catch (e) {
            console.error("Failed to parse saved booking state:", e);
          }
        }
      }

      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const settingsData = await res.json();
          const updatedSelectedVehicle = loadedState.selectedVehicle
            ? {
              ...loadedState.selectedVehicle,
              ratePerKm: settingsData.vehicles[loadedState.selectedVehicle.id]?.ratePerKm ?? loadedState.selectedVehicle.ratePerKm,
              driverAllowancePerDay: settingsData.vehicles[loadedState.selectedVehicle.id]?.driverAllowancePerDay ?? loadedState.selectedVehicle.driverAllowancePerDay,
              oneWayMinKmPerHour: settingsData.vehicles[loadedState.selectedVehicle.id]?.oneWayMinKmPerHour ?? loadedState.selectedVehicle.oneWayMinKmPerHour,
              oneWayHourRate: settingsData.vehicles[loadedState.selectedVehicle.id]?.oneWayHourRate ?? loadedState.selectedVehicle.oneWayHourRate,
              roundTripHourRate: settingsData.vehicles[loadedState.selectedVehicle.id]?.roundTripHourRate ?? loadedState.selectedVehicle.roundTripHourRate,
              outstationHourRate: settingsData.vehicles[loadedState.selectedVehicle.id]?.outstationHourRate ?? loadedState.selectedVehicle.outstationHourRate,
              outstationMinKmPerDay: settingsData.vehicles[loadedState.selectedVehicle.id]?.outstationMinKmPerDay ?? loadedState.selectedVehicle.outstationMinKmPerDay,
              outstationHoursPerDay: settingsData.vehicles[loadedState.selectedVehicle.id]?.outstationHoursPerDay ?? loadedState.selectedVehicle.outstationHoursPerDay,
            }
            : null;

          setState({
            ...loadedState,
            settings: settingsData,
            selectedVehicle: updatedSelectedVehicle,
          });
        } else {
          setState(loadedState);
        }
      } catch (err) {
        console.error("Failed to load settings on mount:", err);
        setState(loadedState);
      }
      setIsLoaded(true);
    };

    loadStateAndSettings();
  }, []);

  // Save state to sessionStorage when it changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      if (state === defaultState) {
        sessionStorage.removeItem("maayan_booking_state");
      } else {
        sessionStorage.setItem("maayan_booking_state", JSON.stringify(state));
      }
    }
  }, [state, isLoaded]);

  const setTripType = (tripType: "One Way" | "Round Trip" | "Outstation Trip") => {
    setState(prev => {
      const numberOfDays = (tripType === "Round Trip" || tripType === "One Way") ? 1 : prev.numberOfDays;
      return { ...prev, tripType, numberOfDays };
    });
  };

  const setPickup = (pickup: Place | null) => {
    setState(prev => ({ ...prev, pickup }));
  };

  const setDropoff = (dropoff: Place | null) => {
    setState(prev => ({ ...prev, dropoff }));
  };

  const setPickupDate = (pickupDate: string) => {
    setState(prev => ({ ...prev, pickupDate }));
  };

  const setPickupTime = (pickupTime: string) => {
    setState(prev => ({ ...prev, pickupTime }));
  };

  const setDropDate = (dropDate: string) => {
    setState(prev => ({ ...prev, dropDate }));
  };

  const setDropTime = (dropTime: string) => {
    setState(prev => ({ ...prev, dropTime }));
  };

  const setNumberOfDays = (numberOfDays: number) => {
    setState(prev => ({ ...prev, numberOfDays }));
  };

  const setPhoneNumber = (phoneNumber: string) => {
    setState(prev => ({
      ...prev,
      phoneNumber,
      passengerInfo: { ...prev.passengerInfo, phoneNumber },
    }));
  };

  const setVehicle = (selectedVehicle: Vehicle) => {
    setState(prev => ({ ...prev, selectedVehicle }));
  };

  const setPassengerInfo = (info: Partial<PassengerInfo>) => {
    setState(prev => ({
      ...prev,
      passengerInfo: { ...prev.passengerInfo, ...info },
    }));
  };

  // Call the distance API route
  const calculateDistance = async (): Promise<boolean> => {
    if (!state.pickup || !state.dropoff) {
      setError("Please select both Pickup and Drop-off locations.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/distance?originLat=${state.pickup.lat}&originLng=${state.pickup.lng}&destLat=${state.dropoff.lat}&destLng=${state.dropoff.lng}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to calculate distance");
      }

      const minKmOneWay = state.settings?.company?.minKmOneWay ?? 5;
      const minKmRoundTrip = state.settings?.company?.minKmRoundTrip ?? 5;
      const minKmOutstation = state.settings?.company?.minKmOutstation ?? 100;

      if (state.tripType === "One Way" && data.distance < minKmOneWay) {
        setError(`One-Way bookings require a minimum trip distance of ${minKmOneWay} km.`);
        setState(prev => ({
          ...prev,
          distanceKm: data.distance,
          durationText: data.durationText,
        }));
        return false;
      }

      if (state.tripType === "Round Trip" && data.distance < minKmRoundTrip) {
        setError(`Round Trip bookings require a minimum trip distance of ${minKmRoundTrip} km.`);
        setState(prev => ({
          ...prev,
          distanceKm: data.distance,
          durationText: data.durationText,
        }));
        return false;
      }

      if (state.tripType === "Outstation Trip" && data.distance < minKmOutstation) {
        setError(`Outstation bookings require a minimum trip distance of ${minKmOutstation} km.`);
        setState(prev => ({
          ...prev,
          distanceKm: data.distance,
          durationText: data.durationText,
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        distanceKm: data.distance,
        durationText: data.durationText,
      }));
      return true;
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Distance lookup failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getRoundTripHours = (): number => {
    if (state.tripType === "Round Trip" && state.pickupDate && state.pickupTime && state.dropDate && state.dropTime) {
      try {
        const pickupDateTime = new Date(`${state.pickupDate}T${state.pickupTime}`);
        const dropDateTime = new Date(`${state.dropDate}T${state.dropTime}`);
        const diffMs = dropDateTime.getTime() - pickupDateTime.getTime();
        if (diffMs > 0) {
          return Math.ceil(diffMs / (1000 * 60 * 60));
        }
      } catch (e) {
        console.error("Error calculating round trip hours:", e);
      }
    }
    return 0;
  };

  // Calculate fare based on standard outstation formulas
  const calculateFare = (vehicle: Vehicle, includeDriverAllowance = true): number => {
    if (state.distanceKm === null) return 0;

    // Resolve latest rates from settings
    const latestRates = state.settings?.vehicles?.[vehicle.id] || vehicle;

    let days = 1;
    if (state.tripType === "Round Trip") {
      days = 1;
    } else if (state.tripType === "Outstation Trip") {
      days = Math.max(1, state.numberOfDays || 1);
    }

    let runningFare = 0;
    if (state.tripType === "Round Trip") {
      // Round trips are charged for actual round-trip distance (both ways)
      runningFare = (state.distanceKm * 2) * latestRates.ratePerKm;
    } else if (state.tripType === "Outstation Trip") {
      // Outstation trips logic:
      const actualDistance = state.distanceKm * 2;
      const outstationMinKmPerDay = latestRates.outstationMinKmPerDay !== undefined ? latestRates.outstationMinKmPerDay : 250;
      const minDistanceAllowance = days * outstationMinKmPerDay;
      const outstationHourRate = latestRates.outstationHourRate !== undefined ? latestRates.outstationHourRate : 170;
      const outstationHoursPerDay = latestRates.outstationHoursPerDay !== undefined ? latestRates.outstationHoursPerDay : 16;
      if (actualDistance < minDistanceAllowance) {
        // Charge minimum driver hours fare: Days * outstationHoursPerDay * hourly rate
        runningFare = days * outstationHoursPerDay * outstationHourRate;
      } else {
        // Charge based on actual distance
        runningFare = actualDistance * latestRates.ratePerKm;
      }
    } else {
      // One Way
      runningFare = state.distanceKm * latestRates.ratePerKm;
    }

    const driverFare = days * latestRates.driverAllowancePerDay;
    const extraCharges = vehicle.tollPermitCharge;

    let total = runningFare + (includeDriverAllowance ? driverFare : 0) + extraCharges;

    // Apply hour-based charges for one-way trips
    if (state.tripType === "One Way") {
      const minKmPerHour = latestRates.oneWayMinKmPerHour !== undefined ? latestRates.oneWayMinKmPerHour : 20;
      const hourRate = latestRates.oneWayHourRate !== undefined ? latestRates.oneWayHourRate : 170;
      const hours = Math.ceil(state.distanceKm / (minKmPerHour || 20));
      const hourCharges = hours * hourRate;
      total += hourCharges;
    }

    // Apply hour-based charges for round trips
    if (state.tripType === "Round Trip") {
      const roundTripHours = getRoundTripHours();
      const roundTripHourRate = latestRates.roundTripHourRate !== undefined ? latestRates.roundTripHourRate : 170;
      const hourCharges = roundTripHours * roundTripHourRate;
      total += hourCharges;
    }

    return Math.round(total * 100) / 100;
  };

  // Submit booking details to server
  const submitBooking = async (overrideInfo?: Partial<PassengerInfo>): Promise<boolean> => {
    if (!state.selectedVehicle || state.distanceKm === null) {
      setError("Booking state is incomplete. Please restart.");
      return false;
    }

    const minKmOneWay = state.settings?.company?.minKmOneWay ?? 5;
    const minKmRoundTrip = state.settings?.company?.minKmRoundTrip ?? 5;
    const minKmOutstation = state.settings?.company?.minKmOutstation ?? 100;

    if (state.tripType === "One Way" && state.distanceKm < minKmOneWay) {
      setError(`One-Way bookings require a minimum trip distance of ${minKmOneWay} km.`);
      return false;
    }

    if (state.tripType === "Round Trip" && state.distanceKm < minKmRoundTrip) {
      setError(`Round Trip bookings require a minimum trip distance of ${minKmRoundTrip} km.`);
      return false;
    }

    if (state.tripType === "Outstation Trip" && state.distanceKm < minKmOutstation) {
      setError(`Outstation bookings require a minimum trip distance of ${minKmOutstation} km.`);
      return false;
    }

    setIsLoading(true);
    setError(null);

    const passengerInfo = {
      ...state.passengerInfo,
      ...overrideInfo,
    };

    let days = state.numberOfDays;
    if (state.tripType === "Round Trip") {
      days = 1;
    }

    const fare = calculateFare(state.selectedVehicle);

    const payload = {
      fullName: passengerInfo.fullName,
      phoneNumber: passengerInfo.phoneNumber,
      emailAddress: passengerInfo.emailAddress,
      passengersCount: passengerInfo.passengersCount,
      tripInstructions: passengerInfo.tripInstructions,
      tripType: state.tripType,
      pickupLocation: state.pickup ? `${state.pickup.name}, ${state.pickup.formattedAddress}` : "",
      dropoffLocation: state.dropoff ? `${state.dropoff.name}, ${state.dropoff.formattedAddress}` : "",
      pickupDate: state.pickupDate,
      pickupTime: state.pickupTime,
      numberOfDays: days,
      carType: state.selectedVehicle.name,
      distanceKm: state.distanceKm,
      totalFare: fare,
    };

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to process booking submission");
      }

      setState(prev => ({
        ...prev,
        bookingReceipt: data.booking,
      }));
      return true;
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Booking submission failed. Please verify your details.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetBooking = () => {
    setState(defaultState);
  };

  return (
    <BookingContext.Provider
      value={{
        state,
        vehicles,
        isLoading,
        error,
        setTripType,
        setPickup,
        setDropoff,
        setPickupDate,
        setPickupTime,
        setDropDate,
        setDropTime,
        setNumberOfDays,
        setPhoneNumber,
        setVehicle,
        setPassengerInfo,
        calculateDistance,
        calculateFare,
        getRoundTripHours,
        submitBooking,
        resetBooking,
        refreshSettings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}

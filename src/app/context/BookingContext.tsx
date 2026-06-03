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
}

export interface PassengerInfo {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  passengersCount: number;
  tripInstructions: string;
}

export interface BookingReceipt {
  id: string;
  createdAt: string;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
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
}

export interface VehicleSettings {
  ratePerKm: number;
  driverAllowancePerDay: number;
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
    notificationEmails: ["info.maayandrivecar@gmail.com"]
  },
  vehicles: {
    hatchback: { ratePerKm: 13, driverAllowancePerDay: 300 },
    sedan: { ratePerKm: 14, driverAllowancePerDay: 350 },
    premium_sedan: { ratePerKm: 16, driverAllowancePerDay: 400 },
    suv: { ratePerKm: 17.5, driverAllowancePerDay: 450 },
    premium_suv: { ratePerKm: 20, driverAllowancePerDay: 500 },
  },
};

export interface BookingState {
  tripType: "One Way" | "Round Trip" | "Outstation Trip";
  pickup: Place | null;
  dropoff: Place | null;
  pickupDate: string;
  pickupTime: string;
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
  setNumberOfDays: (days: number) => void;
  setPhoneNumber: (phone: string) => void;
  setVehicle: (vehicle: Vehicle) => void;
  setPassengerInfo: (info: Partial<PassengerInfo>) => void;
  calculateDistance: () => Promise<boolean>;
  calculateFare: (vehicle: Vehicle, includeDriverAllowance?: boolean) => number;
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
    features: "Driver Betta, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
  },
  {
    id: "sedan",
    name: "SEDAN",
    image: "/images/sedan.png",
    ratePerKm: 14,
    driverAllowancePerDay: 350,
    tollPermitCharge: 0,
    features: "Driver Betta, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
  },
  {
    id: "premium_sedan",
    name: "PREMIUM SEDAN",
    image: "/images/premium_sedan.png",
    ratePerKm: 16,
    driverAllowancePerDay: 400,
    tollPermitCharge: 0,
    features: "Driver Betta, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
    isTopPick: true,
  },
  {
    id: "suv",
    name: "SUV",
    image: "/images/suv.png",
    ratePerKm: 17.5,
    driverAllowancePerDay: 450,
    tollPermitCharge: 0,
    features: "Driver Betta, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
  },
  {
    id: "premium_suv",
    name: "PREMIUM SUV",
    image: "/images/premium_suv.png",
    ratePerKm: 20,
    driverAllowancePerDay: 500,
    tollPermitCharge: 0,
    features: "Driver Betta, Toll & Permit, Extra Km, Hills & luggage charges are exclude.",
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
    setState(prev => ({ ...prev, tripType }));
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

  // Calculate fare based on standard outstation formulas
  const calculateFare = (vehicle: Vehicle, includeDriverAllowance = true): number => {
    if (state.distanceKm === null) return 0;

    // Resolve latest rates from settings
    const latestRates = state.settings?.vehicles?.[vehicle.id] || vehicle;

    let distanceToCharge = state.distanceKm;
    const isRoundOrOutstation = state.tripType === "Round Trip" || state.tripType === "Outstation Trip";
    const days = isRoundOrOutstation ? Math.max(1, state.numberOfDays || 1) : 1;

    if (isRoundOrOutstation) {
      // Outstation round/outstation trips are charged for both ways (pickup to dropoff and return)
      const totalEstimatedKm = state.distanceKm * 2;
      // Minimum charged kms is 250km per day for outstation taxi services in India
      const minKmsForDays = days * 250;
      distanceToCharge = Math.max(totalEstimatedKm, minKmsForDays);
    }

    const runningFare = distanceToCharge * latestRates.ratePerKm;
    const driverFare = days * latestRates.driverAllowancePerDay;
    const extraCharges = vehicle.tollPermitCharge;

    const total = runningFare + (includeDriverAllowance ? driverFare : 0) + extraCharges;
    return Math.round(total * 100) / 100;
  };

  // Submit booking details to server
  const submitBooking = async (overrideInfo?: Partial<PassengerInfo>): Promise<boolean> => {
    if (!state.selectedVehicle || state.distanceKm === null) {
      setError("Booking state is incomplete. Please restart.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    const passengerInfo = {
      ...state.passengerInfo,
      ...overrideInfo,
    };

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
      numberOfDays: state.numberOfDays,
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
        setNumberOfDays,
        setPhoneNumber,
        setVehicle,
        setPassengerInfo,
        calculateDistance,
        calculateFare,
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

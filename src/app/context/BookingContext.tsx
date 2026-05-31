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
  tripType: "One Way" | "Round Trip";
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  numberOfDays: number;
  carType: string;
  distanceKm: number;
  totalFare: number;
}

export interface BookingState {
  tripType: "One Way" | "Round Trip";
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
}

interface BookingContextType {
  state: BookingState;
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  setTripType: (type: "One Way" | "Round Trip") => void;
  setPickup: (place: Place | null) => void;
  setDropoff: (place: Place | null) => void;
  setPickupDate: (date: string) => void;
  setPickupTime: (time: string) => void;
  setNumberOfDays: (days: number) => void;
  setPhoneNumber: (phone: string) => void;
  setVehicle: (vehicle: Vehicle) => void;
  setPassengerInfo: (info: Partial<PassengerInfo>) => void;
  calculateDistance: () => Promise<boolean>;
  calculateFare: (vehicle: Vehicle) => number;
  submitBooking: (overrideInfo?: Partial<PassengerInfo>) => Promise<boolean>;
  resetBooking: () => void;
}

const VEHICLES: Vehicle[] = [
  {
    id: "hatchback",
    name: "HATCHBACK",
    image: "/images/hatchback.png",
    ratePerKm: 13,
    driverAllowancePerDay: 300,
    tollPermitCharge: 264,
    features: "Driver Betta, Toll & Permit included. Extra Km, Hills & luggage charges are exclude.",
  },
  {
    id: "sedan",
    name: "SEDAN",
    image: "/images/sedan.png",
    ratePerKm: 14,
    driverAllowancePerDay: 350,
    tollPermitCharge: 264,
    features: "Driver Betta, Toll & Permit included. Extra Km, Hills & luggage charges are exclude.",
  },
  {
    id: "premium_sedan",
    name: "PREMIUM SEDAN",
    image: "/images/premium_sedan.png",
    ratePerKm: 16,
    driverAllowancePerDay: 400,
    tollPermitCharge: 274,
    features: "Driver Betta, Toll & Permit included. Extra Km, Hills & luggage charges are exclude.",
    isTopPick: true,
  },
  {
    id: "suv",
    name: "SUV",
    image: "/images/suv.png",
    ratePerKm: 17.5,
    driverAllowancePerDay: 450,
    tollPermitCharge: 281.5,
    features: "Driver Betta, Toll & Permit included. Extra Km, Hills & luggage charges are exclude.",
  },
  {
    id: "premium_suv",
    name: "PREMIUM SUV",
    image: "/images/premium_suv.png",
    ratePerKm: 20,
    driverAllowancePerDay: 500,
    tollPermitCharge: 378,
    features: "Driver Betta, Toll & Permit included. Extra Km, Hills & luggage charges are exclude.",
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
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookingState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("maayan_booking_state");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState(parsed);
        } catch (e) {
          console.error("Failed to parse saved booking state:", e);
        }
      }
      setIsLoaded(true);
    }
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

  const setTripType = (tripType: "One Way" | "Round Trip") => {
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
  const calculateFare = (vehicle: Vehicle): number => {
    if (state.distanceKm === null) return 0;

    let distanceToCharge = state.distanceKm;
    const days = state.tripType === "Round Trip" ? state.numberOfDays : 1;

    if (state.tripType === "Round Trip") {
      // Outstation round trips are charged for both ways (pickup to dropoff and return)
      const totalEstimatedKm = state.distanceKm * 2;
      // Minimum charged kms is 250km per day for outstation taxi services in India
      const minKmsForDays = days * 250;
      distanceToCharge = Math.max(totalEstimatedKm, minKmsForDays);
    }

    const runningFare = distanceToCharge * vehicle.ratePerKm;
    const driverFare = days * vehicle.driverAllowancePerDay;
    const extraCharges = vehicle.tollPermitCharge;

    const total = runningFare + driverFare + extraCharges;
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
        vehicles: VEHICLES,
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

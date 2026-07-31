"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X, Navigation } from "lucide-react";
import { Place } from "../context/BookingContext";

interface PlacesAutocompleteProps {
  placeholder: string;
  icon: React.ReactNode;
  initialValue?: string;
  onSelect: (place: Place | null) => void;
  id: string;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function PlacesAutocomplete({
  placeholder,
  icon,
  initialValue = "",
  onSelect,
  id,
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Record<string, Prediction[]>>({});

  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  if (initialValue !== prevInitialValue) {
    setQuery(initialValue);
    setPrevInitialValue(initialValue);
  }

  // Debounced autocomplete fetch
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      return;
    }

    // Skip if search query matches the selected value
    if (initialValue && trimmedQuery === initialValue.trim()) {
      return;
    }

    // If query is already cached, resolve immediately and skip fetch
    if (cacheRef.current[trimmedQuery]) {
      setPredictions(cacheRef.current[trimmedQuery]);
      setIsLoading(false);
      return;
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?input=${encodeURIComponent(trimmedQuery)}`);
        const data = await res.json();
        const predictionsList = data.predictions || [];

        // Cache the predictions list
        cacheRef.current[trimmedQuery] = predictionsList;
        setPredictions(predictionsList);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 150); // Lowered from 300ms to 150ms for ultra-responsive feel

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [query, initialValue]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (prediction: Prediction) => {
    setQuery(prediction.description);
    setShowDropdown(false);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/place-details?placeId=${prediction.place_id}`);
      const data = await res.json();

      if (data.result) {
        onSelect({
          name: prediction.structured_formatting.main_text,
          formattedAddress: prediction.structured_formatting.secondary_text || data.result.formatted_address,
          lat: data.result.lat,
          lng: data.result.lng,
        });
      }
    } catch (err) {
      console.error("Place details error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();

          if (data.result) {
            const displayAddress = data.result.formatted_address || data.result.name;
            setQuery(displayAddress);
            setShowDropdown(false);
            onSelect({
              name: data.result.name,
              formattedAddress: data.result.formatted_address,
              lat: data.result.lat,
              lng: data.result.lng,
            });
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setLocationError("Failed to resolve address for your position.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location access denied. Please allow location permissions in your browser.");
        } else {
          setLocationError("Unable to retrieve GPS location. Please try searching manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const handleClear = () => {
    setQuery("");
    setPredictions([]);
    setLocationError(null);
    onSelect(null);
    setShowDropdown(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="autocomplete-container" ref={dropdownRef}>
      <div className={`input-wrapper ${showDropdown ? "focused" : ""}`}>
        {icon}
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setLocationError(null);
            const trimmed = val.trim();
            if (trimmed.length < 3) {
              setPredictions([]);
              setIsLoading(false);
            } else if (cacheRef.current[trimmed]) {
              // Instant display if results are already in client cache
              setPredictions(cacheRef.current[trimmed]);
              setIsLoading(false);
              setShowDropdown(true);
            } else {
              setIsLoading(true);
              setShowDropdown(true);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 size={16} className="loader-spinner" />
        )}
        {query && !isLoading && (
          <button type="button" onClick={handleClear} className="clear-btn" aria-label="Clear location input">
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="predictions-dropdown card-lowest animate-fade-in">
          {/* Current Location Option (Only shown when input is empty) */}
          {!query.trim() && (
            <button
              type="button"
              className="prediction-row current-location-row"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <Loader2 size={16} className="location-pin-icon loader-spinner-inline" />
              ) : (
                <Navigation size={16} className="location-pin-icon current-loc-icon" />
              )}
              <div className="prediction-details">
                <span className="main-text current-loc-title">
                  {isLocating ? "Locating position..." : "Use Current Location"}
                </span>
                <span className="secondary-text">
                  {isLocating ? "Fetching address via GPS..." : "Detect address automatically"}
                </span>
              </div>
            </button>
          )}

          {locationError && (
            <div className="location-error-banner">
              {locationError}
            </div>
          )}

          {!query.trim() && predictions.length > 0 && <div className="dropdown-divider" />}

          {predictions.map((pred) => (
            <button
              key={pred.place_id}
              type="button"
              className="prediction-row"
              onClick={() => handleSelect(pred)}
            >
              <MapPin size={16} className="location-pin-icon" style={{ color: 'var(--on-surface)', opacity: 0.8, flexShrink: 0 }} />
              <div className="prediction-details">
                <span className="main-text">{pred.structured_formatting.main_text}</span>
                <span className="secondary-text">{pred.structured_formatting.secondary_text}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .autocomplete-container {
          position: relative;
          width: 100%;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background-color: var(--surface-container);
          border-radius: var(--radius-sm);
          border-bottom: 2px solid var(--outline-variant);
          transition: border-bottom-color var(--transition-normal), background-color var(--transition-normal);
        }
        .input-wrapper :global(svg) {
          position: absolute;
          left: 0.9rem;
          color: var(--on-surface-variant);
          transition: color var(--transition-normal);
        }
        .input-wrapper input {
          width: 100%;
          padding: 0.9rem 2.8rem 0.9rem 2.8rem;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--on-surface);
          background: transparent;
          border: none;
          outline: none;
        }
        .input-wrapper.focused,
        .input-wrapper:focus-within {
          background-color: var(--surface-container-low);
          border-bottom-color: var(--primary);
        }
        .input-wrapper.focused :global(svg),
        .input-wrapper:focus-within :global(svg) {
          color: var(--primary);
        }
        .loader-spinner {
          position: absolute;
          right: calc(0.9rem + 8px);
          animation: spin 1s linear infinite;
          color: var(--primary) !important;
        }
        .clear-btn {
          position: absolute;
          right: calc(0.9rem + 8px);
          background: none;
          border: none;
          color: var(--on-surface-variant);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: var(--radius-full);
          transition: color var(--transition-fast);
        }
        .clear-btn:hover {
          color: var(--on-surface);
        }
        .predictions-dropdown {
          position: absolute;
          top: 105%;
          left: 0;
          right: 0;
          z-index: 50;
          background-color: var(--surface-container-lowest);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-ambient);
          padding: 0.5rem 0;
          max-height: 280px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .prediction-row {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.75rem 1.2rem;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }
        .prediction-row:hover {
          background-color: var(--surface-container-high);
        }
        .current-location-row {
          color: var(--primary);
        }
        .current-loc-icon {
          color: var(--primary) !important;
          opacity: 1 !important;
        }
        .current-loc-title {
          color: var(--primary) !important;
        }
        .loader-spinner-inline {
          animation: spin 1s linear infinite;
          color: var(--primary) !important;
        }
        .dropdown-divider {
          height: 1px;
          background-color: var(--outline-variant);
          margin: 0.35rem 0;
          opacity: 0.5;
        }
        .location-error-banner {
          padding: 0.5rem 1.2rem;
          font-size: 0.75rem;
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
          border-radius: 4px;
          margin: 0.25rem 0.75rem;
        }
        .location-pin-icon {
          color: var(--on-surface) !important;
          opacity: 0.8 !important;
          flex-shrink: 0;
          transition: color var(--transition-fast), opacity var(--transition-fast);
        }
        .prediction-row:hover .location-pin-icon {
          color: var(--primary) !important;
          opacity: 1 !important;
        }
        .prediction-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .main-text {
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--on-surface);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .secondary-text {
          font-family: var(--font-body);
          font-weight: 400;
          font-size: 0.75rem;
          color: var(--on-surface-variant);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          margin-top: 1px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

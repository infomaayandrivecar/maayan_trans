"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  const handleClear = () => {
    setQuery("");
    setPredictions([]);
    onSelect(null);
  };

  return (
    <div className="autocomplete-container" ref={dropdownRef}>
      <div className={`input-wrapper ${showDropdown ? "focused" : ""}`}>
        {icon}
        <input
          type="text"
          id={id}
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
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

      {showDropdown && predictions.length > 0 && (
        <div className="predictions-dropdown card-lowest animate-fade-in">
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
          max-height: 260px;
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

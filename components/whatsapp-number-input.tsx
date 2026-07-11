"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { callingCodeForCountry, countryCallingCodes } from "@/lib/country-calling-codes";

type WhatsAppNumberInputProps = {
  label: string;
  countryIso: string;
  localNumber: string;
  onCountryChange: (countryIso: string) => void;
  onLocalNumberChange: (localNumber: string) => void;
};

export default function WhatsAppNumberInput({
  label,
  countryIso,
  localNumber,
  onCountryChange,
  onLocalNumberChange
}: WhatsAppNumberInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = callingCodeForCountry(countryIso);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCountries = useMemo(() => {
    if (!normalizedSearch) return countryCallingCodes;
    return countryCallingCodes.filter((country) =>
      [country.iso, country.name, country.dialCode, ...(country.aliases || [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function selectCountry(iso: string) {
    onCountryChange(iso);
    setSearch("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative grid gap-1.5 text-sm font-semibold text-[#101216]">
      <label htmlFor="source-whatsapp-number">{label}</label>
      <div className="flex min-w-0 gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`WhatsApp country code ${selected.dialCode}`}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-11 w-[108px] shrink-0 items-center justify-between rounded-2xl border border-[#dfe6ef] bg-white px-3 text-sm font-semibold outline-none transition hover:border-[#b8c5d8] focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
        >
          <span className="flex items-center gap-2"><span aria-hidden="true">{selected.flag}</span><span>{selected.dialCode}</span></span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        <input
          id="source-whatsapp-number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={localNumber}
          onChange={(event) => onLocalNumberChange(event.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-2xl border border-[#dfe6ef] bg-white px-3 text-sm font-medium text-[#101216] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
          placeholder="WhatsApp number"
        />
      </div>

      {open ? (
        <div className="absolute top-full z-30 mt-2 w-full min-w-[280px] overflow-hidden rounded-2xl border border-[#dfe6ef] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-[#dfe6ef] px-3 text-[#69707d] focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#2563eb]/10">
            <Search size={15} aria-hidden="true" />
            <span className="sr-only">Search countries</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#101216] outline-none"
              placeholder="Search country or +code"
            />
          </label>
          <div role="listbox" aria-label="WhatsApp country codes" className="mt-2 max-h-64 overflow-y-auto overscroll-contain">
            {filteredCountries.length > 0 ? filteredCountries.map((country) => (
              <button
                key={country.iso}
                type="button"
                role="option"
                aria-selected={country.iso === selected.iso}
                onClick={() => selectCountry(country.iso)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-[#f2f7ff]"
              >
                <span className="text-base" aria-hidden="true">{country.flag}</span>
                <span className="min-w-0 flex-1 truncate">{country.name}</span>
                <span className="font-semibold text-[#315fbd]">{country.dialCode}</span>
                {country.iso === selected.iso ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            )) : (
              <p className="px-3 py-4 text-center text-sm font-medium text-[#69707d]">No country found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

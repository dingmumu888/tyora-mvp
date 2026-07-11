const countryHeaderNames = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-ip-country"
];

export function getDetectedCountry(headers: Headers) {
  for (const headerName of countryHeaderNames) {
    const country = headers.get(headerName)?.trim();
    if (country && country.toLowerCase() !== "unknown" && country.toUpperCase() !== "XX") {
      return country.toUpperCase();
    }
  }

  return "";
}

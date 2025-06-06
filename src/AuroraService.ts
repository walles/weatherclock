// AuroraService.ts
// Handles fetching and parsing aurora forecast data for WeatherClock

import AuroraForecast from './AuroraForecast';

export const AURORA_FORECAST_URL =
  'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json';

/**
 * Fetches the aurora forecast from the NOAA service and returns an AuroraForecast instance.
 * Throws an error if the fetch fails or the response is not OK.
 */
export async function fetchAuroraForecast(): Promise<AuroraForecast> {
  const response = await fetch(AURORA_FORECAST_URL);
  if (!response.ok) {
    throw new Error(`Response code from aurora upstream: ${response.status}`);
  }
  const data = await response.json();
  return new AuroraForecast(data);
}

export type Forecast = {
  timestamp: Date; // Middle of the span
  span_h: number; // Width of the span in hours
  celsius?: number; // The forecasted temperatures in centigrades
  wind_m_s?: number; // The forecasted wind speed in m/s
  symbol_code?: string; // The weather symbol code. Resolve using public/api-met-no-weathericons/png/SYMBOL_CODE.png
  precipitation_mm?: number;
};

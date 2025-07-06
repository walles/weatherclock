import { Forecast } from './Forecast';
import { WeatherLocation } from './PositionService';

export interface WeatherDownloadResult {
  forecast: Map<number, Forecast>;
  metadata: {
    timestamp: Date;
    latitude: number;
    longitude: number;
  };
}

/**
 * Parses weather XML from yr.no into a weather object that maps timestamps (in
 * milliseconds since the epoch) to forecasts.
 */
export function parseWeatherXml(weatherXmlString: string): Map<number, Forecast> {
  const weatherXml = new window.DOMParser().parseFromString(weatherXmlString, 'text/xml');
  const allPrognoses = weatherXml.getElementsByTagName('time');
  console.log(`Parsing ${allPrognoses.length} prognoses...`);

  const forecasts: Map<number, Forecast> = new Map();
  for (let i = 0; i < allPrognoses.length; i += 1) {
    const prognosis = allPrognoses[i];

    const from = new Date(prognosis.attributes.getNamedItem('from')!.value);
    const to = new Date(prognosis.attributes.getNamedItem('to')!.value);
    const dh = (to.getTime() - from.getTime()) / (3600 * 1000);
    const timestamp = new Date((from.getTime() + to.getTime()) / 2);

    let forecast = forecasts.get(timestamp.getTime());
    if (forecast !== undefined && forecast.span_h <= dh) {
      continue;
    }

    if (!forecast) {
      forecast = {
        timestamp,
        span_h: dh,
      };
    }

    const symbolNodes = prognosis.getElementsByTagName('symbol');
    if (symbolNodes && symbolNodes.length > 0) {
      const symbol_code = symbolNodes[0].attributes.getNamedItem('code')!.value;
      forecast.symbol_code = symbol_code;
    }

    const celsiusNodes = prognosis.getElementsByTagName('temperature');
    if (celsiusNodes && celsiusNodes.length > 0) {
      const celsiusValue = celsiusNodes[0].attributes.getNamedItem('value')!.value;
      forecast.celsius = parseFloat(celsiusValue);
    }

    const windNodes = prognosis.getElementsByTagName('windSpeed');
    if (windNodes && windNodes.length > 0) {
      const windValue = windNodes[0].attributes.getNamedItem('mps')!.value;
      forecast.wind_m_s = parseFloat(windValue);
    }

    const precipitationNodes = prognosis.getElementsByTagName('precipitation');
    if (precipitationNodes && precipitationNodes.length > 0) {
      const maxAttribute = precipitationNodes[0].attributes.getNamedItem('maxvalue');
      const expectedAttribute = precipitationNodes[0].attributes.getNamedItem('value');
      let precipitationValue = undefined;
      if (maxAttribute === null && expectedAttribute !== null) {
        precipitationValue = expectedAttribute.value;
      } else if (maxAttribute !== null) {
        precipitationValue = maxAttribute.value;
      }
      if (precipitationValue !== undefined) {
        forecast.precipitation_mm = parseFloat(precipitationValue);
      }
    }

    forecasts.set(timestamp.getTime(), forecast);
  }

  return forecasts;
}

export async function downloadWeather(position: WeatherLocation): Promise<WeatherDownloadResult> {
  const { latitude, longitude } = position;
  const url = `https://api-met-no-proxy-go-407804377208.europe-north1.run.app/locationforecast/2.0/classic?lat=${latitude};lon=${longitude}`;
  console.log(`Getting weather from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response code from upstream: ${response.status}`);
  }
  const weatherXmlString = await response.text();
  const forecast = parseWeatherXml(weatherXmlString);
  const metadata = {
    timestamp: new Date(),
    latitude,
    longitude,
  };
  return { forecast, metadata };
}

/**
 * Checks that the forecast has enough 1h resolution data to cover the
 * now-display.
 */
export function hasDataForNow(forecast: Map<number, Forecast>): boolean {
  // Find the last timestamp with span_h of 1 hour
  let last1hTimestamp: number | undefined;
  for (const [timestamp, data] of forecast) {
    if (data.span_h === 1 && (last1hTimestamp === undefined || timestamp > last1hTimestamp)) {
      last1hTimestamp = timestamp;
    }
  }

  if (!last1hTimestamp) {
    // The interpretation here is that we are in some place where we don't get
    // 1h resolution data ever. Just go with what we have.
    console.warn('No 1h resolution data found in forecast, displaying anyway');
    return true;
  }

  const hoursUntilLast1hTimestamp = (last1hTimestamp - Date.now()) / (3600 * 1000);
  if (hoursUntilLast1hTimestamp < 11) {
    console.warn(
      `Last 1h resolution data is ${hoursUntilLast1hTimestamp} hours away, awaiting new data`,
    );
    return false;
  }

  return true;
}

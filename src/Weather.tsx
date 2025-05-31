import React from 'react';

import Temperature from './Temperature';
import WeatherSymbol from './WeatherSymbol';
import Display from './Display';
import ClockCoordinates from './ClockCoordinates';
import { Forecast } from './Forecast';
import { AuroraForecast } from './AuroraForecast';

interface WeatherProps {
  weatherForecast: Map<number, Forecast>;
  auroraForecast?: AuroraForecast;
  latitude: number;
  now: Date;
}

/**
 * This is what the clock shows after forecasts have been downloaded,
 * up to and including the hour and minute hands.
 */
class Weather extends React.Component<WeatherProps> {
  static renderTemperatures = (renderUs: Forecast[]) => {
    return renderUs
      .filter((forecast) => forecast.celsius !== undefined)
      .map((forecast) => {
        const coords = new ClockCoordinates(forecast.timestamp);
        return (
          <Temperature
            key={`hour-${coords.decimalHour}`}
            coordinates={coords}
            degreesCelsius={forecast.celsius}
          />
        );
      });
  };

  static toWindString = (observations: Forecast[]): string => {
    let minWind: number | undefined;
    let maxWind: number | undefined;

    observations.forEach((weather) => {
      if (minWind === undefined || (weather.wind_m_s !== undefined && minWind > weather.wind_m_s)) {
        minWind = weather.wind_m_s;
      }
      if (maxWind === undefined || (weather.wind_m_s !== undefined && maxWind < weather.wind_m_s)) {
        maxWind = weather.wind_m_s;
      }
    });

    if (minWind === undefined || maxWind === undefined) {
      return '';
    }

    minWind = Math.round(minWind);
    maxWind = Math.round(maxWind);
    const windString = minWind === maxWind ? `${minWind} m/s` : `${minWind}-${maxWind} m/s`;
    console.debug(`Wind: ${windString}`);

    return windString;
  };

  renderWeathers = (renderUs: Forecast[]) => {
    const { auroraForecast, latitude } = this.props;
    return renderUs
      .filter((forecast) => forecast.symbol_code !== undefined)
      .map((forecast) => {
        const coords = new ClockCoordinates(forecast.timestamp);
        let { symbol_code } = forecast;
        if (symbol_code === 'clearsky_night' && !!auroraForecast) {
          // It's night and the sky is clear. Will there be any northern lights?
          const auroraSymbol = auroraForecast.getAuroraSymbol(forecast.timestamp, latitude);
          if (auroraSymbol !== null) {
            symbol_code = auroraSymbol;
          }
        }
        return (
          <WeatherSymbol
            key={`weather-${coords.decimalHour}`}
            coordinates={coords}
            symbol_code={symbol_code || ''}
          />
        );
      });
  };

  renderWindAndPrecipitation = (renderUs: Forecast[]) => {
    const { now } = this.props;
    let precipitation_mm = 0;

    renderUs.forEach((weather) => {
      if (weather.precipitation_mm !== undefined) {
        precipitation_mm += weather.precipitation_mm;
      }
    });

    const precipitationNumberString = new Intl.NumberFormat(navigator.language, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(precipitation_mm);

    const precipitationString = `${precipitationNumberString}mm`;
    console.debug(`Precipitation: ${precipitationString}`);

    const nowCoords = new ClockCoordinates(now);
    const bestDegrees = nowCoords.rankFreeDirections();

    // Where do we draw the wind?
    const windDegrees = bestDegrees[0];
    const windCoords = new ClockCoordinates((12.0 * windDegrees) / 360.0);

    const precipitationDegrees = bestDegrees[1];
    const precipitationCoords = new ClockCoordinates((12.0 * precipitationDegrees) / 360.0);

    const windString = Weather.toWindString(renderUs);

    return (
      <>
        <Display coords={windCoords}>{windString}</Display>
        <Display coords={precipitationCoords}>{precipitationString}</Display>
      </>
    );
  };

  getForecastsToRender = (): Forecast[] => {
    const { now, weatherForecast } = this.props;
    const renderUs = [];

    const now_ms = now.getTime();
    const start = new Date(now_ms + 0.75 * 3600 * 1000);
    const end = new Date(now_ms + 11.75 * 3600 * 1000);

    for (const [timestamp_ms, forecast] of weatherForecast.entries()) {
      const timestamp_date = new Date(timestamp_ms);

      if (timestamp_date < start) {
        continue;
      }

      if (timestamp_date > end) {
        continue;
      }

      renderUs.push(forecast);
    }

    console.debug(renderUs);
    return renderUs;
  };

  render() {
    const renderUs = this.getForecastsToRender();
    return (
      <>
        {Weather.renderTemperatures(renderUs)}
        {this.renderWeathers(renderUs)}
        {this.renderWindAndPrecipitation(renderUs)}
      </>
    );
  }
}

export default Weather;

// Accept the lint warning for toWindString and renderTemperatures as instance methods for now, as they use instance context in the class.

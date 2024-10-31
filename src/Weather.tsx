import React from 'react'

import Temperature from './Temperature.js'
import WeatherSymbol from './WeatherSymbol.js'
import Display from './Display'
import ClockCoordinates from './ClockCoordinates'
import { Forecast } from './Forecast.js'

interface WeatherProps {
  weatherForecast: Map<number, Forecast>;
  now: Date;
}

/**
 * This is what the clock shows after forecasts have been downloaded,
 * up to and including the hour and minute hands.
 */
class Weather extends React.Component<WeatherProps> {
  renderTemperatures = (renderUs: Forecast[]) => {
    return renderUs
      .filter(forecast => forecast.celsius !== undefined)
      .map(forecast => {
        const coords = new ClockCoordinates(forecast.timestamp)
        return (
          <Temperature
            key={`hour-${coords.decimalHour}`}
            coordinates={coords}
            degreesCelsius={forecast.celsius}
          />
        )
      })
  }

  renderWeathers = (renderUs: Forecast[]) => {
    return renderUs
      .filter(forecast => forecast.symbol_code !== undefined)
      .map(forecast => {
        const coords = new ClockCoordinates(forecast.timestamp)

        return (
          <WeatherSymbol
            key={`weather-${coords.decimalHour}`}
            coordinates={coords}
            symbol_code={forecast.symbol_code}
          />
        )
      })
  }

  toWindString = (observations: Forecast[]): string => {
    let minWind: (number | undefined) = undefined
    let maxWind: (number | undefined) = undefined

    observations.forEach(weather => {
      if (minWind === undefined || (weather.wind_m_s !== undefined && minWind > weather.wind_m_s)) {
        minWind = weather.wind_m_s
      }
      if (maxWind === undefined || (weather.wind_m_s !== undefined && maxWind < weather.wind_m_s)) {
        maxWind = weather.wind_m_s
      }
    })

    if (minWind === undefined || maxWind === undefined) {
      return ''
    }

    minWind = Math.round(minWind)
    maxWind = Math.round(maxWind)
    const windString =
      minWind === maxWind ? `${minWind} m/s` : `${minWind}-${maxWind} m/s`
    console.debug(`Wind: ${windString}`)

    return windString
  }

  renderWindAndPrecipitation = (renderUs: Forecast[]) => {
    let precipitation_mm = 0

    renderUs.forEach(weather => {
      if (weather.precipitation_mm !== undefined) {
        precipitation_mm += weather.precipitation_mm
      }
    })

    const precipitationNumberString = new Intl.NumberFormat(navigator.language, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(precipitation_mm)

    const precipitationString = `${precipitationNumberString}mm`
    console.debug(`Precipitation: ${precipitationString}`)

    const nowCoords = new ClockCoordinates(this.props.now)
    const bestDegrees = nowCoords.rankFreeDirections()

    // Where do we draw the wind?
    const windDegrees = bestDegrees[0]
    const windCoords = new ClockCoordinates((12.0 * windDegrees) / 360.0)

    const precipitationDegrees = bestDegrees[1]
    const precipitationCoords = new ClockCoordinates(
      (12.0 * precipitationDegrees) / 360.0
    )

    const windString = this.toWindString(renderUs)

    return (
      <React.Fragment>
        <Display coords={windCoords}>{windString}</Display>
        <Display coords={precipitationCoords}>{precipitationString}</Display>
      </React.Fragment>
    )
  }

  getForecastsToRender = (): Forecast[] => {
    const renderUs = []

    const now_ms = this.props.now.getTime()
    const start = new Date(now_ms + 0.75 * 3600 * 1000)
    const end = new Date(now_ms + 11.75 * 3600 * 1000)

    for (const [timestamp_ms, forecast] of this.props.weatherForecast.entries()) {
      const timestamp_date = new Date(timestamp_ms)

      if (timestamp_date < start) {
        continue
      }

      if (timestamp_date > end) {
        continue
      }

      renderUs.push(forecast)
    }

    console.debug(renderUs)
    return renderUs
  }

  render = () => {
    const renderUs = this.getForecastsToRender()
    return (
      <React.Fragment>
        {this.renderTemperatures(renderUs)}
        {this.renderWeathers(renderUs)}
        {this.renderWindAndPrecipitation(renderUs)}
      </React.Fragment>
    )
  }
}

export default Weather

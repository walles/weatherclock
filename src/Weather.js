import React from 'react'
import PropTypes from 'prop-types'

import Temperature from './Temperature.js'
import WeatherSymbol from './WeatherSymbol.js'
import Display from './Display.js'
import ClockCoordinates from './ClockCoordinates.js'

/**
 * This is what the clock shows after forecasts have been downloaded,
 * up to and including the hour and minute hands.
 */
class Weather extends React.Component {
  renderTemperatures = renderUs => {
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

  renderWeathers = renderUs => {
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

  renderWindAndPrecipitation = renderUs => {
    let precipitation_mm = 0
    let minWind = null
    let maxWind = null

    renderUs.forEach(weather => {
      if (minWind == null || minWind > weather.wind_m_s) {
        minWind = weather.wind_m_s
      }
      if (maxWind == null || maxWind < weather.wind_m_s) {
        maxWind = weather.wind_m_s
      }
      if (weather.precipitation_mm !== undefined) {
        precipitation_mm += weather.precipitation_mm
      }
    })

    minWind = Math.round(minWind)
    maxWind = Math.round(maxWind)
    const windString =
      minWind === maxWind ? `${minWind} m/s` : `${minWind}-${maxWind} m/s`
    console.debug(`Wind: ${windString}`)

    const locale = navigator.language || navigator.userLanguage
    const precipitationNumberString = new Intl.NumberFormat(locale, {
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

    // FIXME: Render both wind and precipitation in the same display?
    return (
      <React.Fragment>
        <Display coords={windCoords}>{windString}</Display>
        <Display coords={precipitationCoords}>{precipitationString}</Display>
      </React.Fragment>
    )
  }

  getForecastsToRender = () => {
    const renderUs = []

    const now_ms = this.props.now.getTime()
    const start = new Date(now_ms + 0.75 * 3600 * 1000)
    const end = new Date(now_ms + 11.75 * 3600 * 1000)

    for (const [timestamp_ms, forecast] of this.props.forecast.entries()) {
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

Weather.propTypes = {
  forecast: PropTypes.object,
  now: PropTypes.instanceOf(Date)
}

export default Weather

import React from 'react'

import Hand from './Hand.js'
import Temperature from './Temperature.js'
import WeatherSymbol from './WeatherSymbol.js'
import Display from './Display.js'
import ClockCoordinates from './ClockCoordinates.js'

const HOUR_HAND_LENGTH = 23
const MINUTE_HAND_LENGTH = 34

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
      .filter(forecast => forecast.symbol !== undefined)
      .map(forecast => {
        const coords = new ClockCoordinates(forecast.timestamp)

        return (
          <WeatherSymbol
            key={`weather-${coords.decimalHour}`}
            coordinates={coords}
            symbol={forecast.symbol}
          />
        )
      })
  }

  renderWind = renderUs => {
    let minWind = null
    let maxWind = null

    renderUs.forEach(weather => {
      if (minWind == null || minWind > weather.wind_m_s) {
        minWind = weather.wind_m_s
      }
      if (maxWind == null || maxWind < weather.wind_m_s) {
        maxWind = weather.wind_m_s
      }
    })

    minWind = Math.round(minWind)
    maxWind = Math.round(maxWind)

    const windString = minWind === maxWind ? `${minWind} m/s` : `${minWind}-${maxWind} m/s`
    console.log(`Wind: ${windString}`)

    // Where do we draw the wind?
    const nowCoords = new ClockCoordinates(new Date())
    const degrees = nowCoords.rankFreeDirections()[0]
    const coords = new ClockCoordinates((12.0 * degrees) / 360.0)

    return <Display coords={coords}>{windString}</Display>
  }

  renderPrecipitation = renderUs => {
    let precipitation_mm = 0
    renderUs
      .filter(forecast => forecast.precipitation_mm !== undefined)
      .forEach(forecast => {
        precipitation_mm += forecast.precipitation_mm
      })

    precipitation_mm = Math.round(precipitation_mm)

    const precipitationString = `${precipitation_mm}mm`
    console.log(`Precipitation: ${precipitationString}`)

    // Where do we draw the precipitation
    const nowCoords = new ClockCoordinates(new Date())
    const degrees = nowCoords.rankFreeDirections()[1]
    const coords = new ClockCoordinates((12.0 * degrees) / 360.0)

    return <Display coords={coords}>{precipitationString}</Display>
  }

  renderHands = () => {
    const nowCoords = new ClockCoordinates(new Date())

    // FIXME: This doubles the center circle shadow, maybe draw
    // the center circle once here to get us only one of those?
    return (
      <React.Fragment>
        <Hand
          width={2.5}
          dx={nowCoords.hourDx(HOUR_HAND_LENGTH)}
          dy={nowCoords.hourDy(HOUR_HAND_LENGTH)}
        />
        <Hand
          width={2}
          dx={nowCoords.minuteDx(MINUTE_HAND_LENGTH)}
          dy={nowCoords.minuteDy(MINUTE_HAND_LENGTH)}
        />
      </React.Fragment>
    )
  }

  getForecastsToRender = () => {
    const renderUs = []

    const now_ms = new Date().getTime()
    const start = new Date(now_ms + 0.75 * 3600 * 1000)
    const end = new Date(now_ms + 11.75 * 3600 * 1000)

    // eslint-disable-next-line
    for (const [timestamp_ms, forecast] of Object.entries(this.props.forecast)) {
      const timestamp_date = new Date(timestamp_ms)

      if (timestamp_date < start) {
        continue
      }

      if (timestamp_date > end) {
        continue
      }

      renderUs.push(forecast)
    }

    console.log(renderUs)
    return renderUs
  }

  render = () => {
    // FIXME: After rendering, send stats to Google Analytics

    const renderUs = this.getForecastsToRender()
    return (
      <React.Fragment>
        {this.renderTemperatures(renderUs)}
        {this.renderWeathers(renderUs)}
        {this.renderWind(renderUs)}
        {this.renderPrecipitation(renderUs)}
        {this.renderHands()}
      </React.Fragment>
    )
  }
}

export default Weather

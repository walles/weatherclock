import React from 'react'

import Temperature from './Temperature.js'
import WeatherSymbol from './WeatherSymbol.js'
import ClockCoordinates from './ClockCoordinates.js'

const WIND_TEXT_RADIUS = 13

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

    // Where do we draw the wind?
    const nowCoords = new ClockCoordinates(new Date())
    const degrees = nowCoords.rankFreeDirections()[0]
    const coords = new ClockCoordinates((12.0 * degrees) / 360.0)

    // FIXME: Draw the wind!
    console.log(`Wind: ${windString}`)

    return (
      <text x={coords.hourDx(WIND_TEXT_RADIUS)} y={coords.hourDy(WIND_TEXT_RADIUS)}>
        {windString}
      </text>
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
      </React.Fragment>
    )
  }
}

export default Weather

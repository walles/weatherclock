import React from 'react'
import PropTypes from 'prop-types'

const DISTANCE_FROM_CENTER = 29
const SIZE = 10

class WeatherSymbol extends React.Component {
  render = () => {
    // Note that we *could* download an SVG weather symbol, but that doesn't
    // work on Firefox 38.0.5 so we do PNG instead. And since cell phone screens
    // are what we're aiming for, PNG should be fine.
    const url =
      'https://api.met.no/weatherapi/weathericon/1.1/?symbol=' +
      this.props.symbol +
      ';content_type=image/png;is_night=' +
      (this.props.isNight ? 1 : 0)

    // FIXME: The symbol we're getting has a start time and a span.
    // We should think of how to place it mid-span, rather than just
    // placing it at the start of the span like we do here.
    const radians = 2 * Math.PI * (this.props.hour / 12.0)
    const x = Math.round(Math.sin(radians) * DISTANCE_FROM_CENTER) - (SIZE - 1) / 2
    const y = -Math.round(Math.cos(radians) * DISTANCE_FROM_CENTER) - (SIZE - 1) / 2

    return <image className='symbol' x={x} y={y} width={SIZE} height={SIZE} href={url} />
  }
}

WeatherSymbol.propTypes = {
  hour: PropTypes.number,
  night: PropTypes.bool,
  symbol: PropTypes.string
}

export default WeatherSymbol

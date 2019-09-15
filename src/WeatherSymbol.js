import React from 'react'
import PropTypes from 'prop-types'

import ClockCoordinates from './ClockCoordinates'

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
      (this.props.coordinates.isNight() ? 1 : 0)

    const x = this.props.coordinates.symbolDx(DISTANCE_FROM_CENTER, SIZE)
    const y = this.props.coordinates.symbolDy(DISTANCE_FROM_CENTER, SIZE)

    return <image className='symbol' x={x} y={y} width={SIZE} height={SIZE} href={url} />
  }
}

WeatherSymbol.propTypes = {
  coordinates: PropTypes.instanceOf(ClockCoordinates),
  symbol: PropTypes.string
}

export default WeatherSymbol

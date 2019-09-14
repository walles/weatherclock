import React from 'react'
import PropTypes from 'prop-types'

import './Display.css'

import ClockCoordinates from './ClockCoordinates'

const WIND_TEXT_RADIUS = 13

/**
 * This is supposed to mimic a display on the clock face.
 */
class Display extends React.Component {
  render = () => {
    const x = this.props.coords.hourDx(WIND_TEXT_RADIUS)
    const y = this.props.coords.hourDy(WIND_TEXT_RADIUS)

    return (
      <text x={x} y={y} className='wind'>
        {this.props.children}
      </text>
    )
  }
}

Display.propTypes = {
  coordinates: PropTypes.instanceOf(ClockCoordinates)
}

export default Display

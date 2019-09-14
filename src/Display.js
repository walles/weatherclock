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
      <React.Fragment>
        {/* FIXME: Adapt rect dimensions to text */}
        <rect x='0' y='0' width='10' height='10' rx='2' ry='2' className='wind' />
        <text x={x} y={y} className='wind' dominant-baseline='middle' text-anchor='middle'>
          {this.props.children}
        </text>
      </React.Fragment>
    )
  }
}

Display.propTypes = {
  coordinates: PropTypes.instanceOf(ClockCoordinates)
}

export default Display

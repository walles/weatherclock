import React from 'react'
import PropTypes from 'prop-types'

import './Temperature.css'
import ClockCoordinates from './ClockCoordinates'

const DISTANCE_FROM_CENTER = 39

class Temperature extends React.Component {
  render = () => {
    // Truncate decimals
    const temperature = this.props.degreesCelsius | 0

    const x = this.props.coordinates.hourDx(DISTANCE_FROM_CENTER)
    const y = this.props.coordinates.hourDy(DISTANCE_FROM_CENTER)

    return (
      <text className='hour' x={x} y={y}>
        {temperature}&deg;
      </text>
    )
  }
}

Temperature.propTypes = {
  degreesCelsius: PropTypes.number,
  coordinates: PropTypes.instanceOf(ClockCoordinates)
}

export default Temperature

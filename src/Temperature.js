import React from 'react'
import PropTypes from 'prop-types'

import './Temperature.css'

const DISTANCE_FROM_CENTER = 39

class Temperature extends React.Component {
  render = () => {
    // Truncate decimals
    const temperature = this.props.degreesCelsius | 0

    const radians = 2 * Math.PI * (this.props.hour / 12.0)
    const x = Math.round(Math.sin(radians) * DISTANCE_FROM_CENTER)
    const y = -Math.round(Math.cos(radians) * DISTANCE_FROM_CENTER)

    return (
      <text className='hour' x={x} y={y}>
        {temperature}&deg;
      </text>
    )
  }
}

Temperature.propTypes = {
  degreesCelsius: PropTypes.number,
  hour: PropTypes.number
}

export default Temperature

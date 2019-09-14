import React from 'react'
import PropTypes from 'prop-types'

import './Hand.css'

class Hand extends React.Component {
  // FIXME: Hands should protrude 2 units in the wrong direction as well
  render = () => {
    return (
      <React.Fragment>
        <line
          className='hand shadow'
          x1='0'
          y1='0'
          x2={this.props.dx}
          y2={this.props.dy}
          strokeWidth={this.props.width}
        />
        <circle className='shadow' cx='0' cy='0' r='2' />

        <line
          className='hand'
          x1='0'
          y1='0'
          x2={this.props.dx}
          y2={this.props.dy}
          strokeWidth={this.props.width}
        />
        <circle cx='0' cy='0' r='2' />
      </React.Fragment>
    )
  }
}

Hand.propTypes = {
  width: PropTypes.number,
  dx: PropTypes.number,
  dy: PropTypes.number
}

export default Hand

import React from 'react'
import PropTypes from 'prop-types'

import './Hand.css'

class Hand extends React.Component {
  // FIXME: Hands should protrude 2 units in the wrong direction as well
  render = () => {
    return (
      <React.Fragment>
        <line
          class='hand shadow'
          x1='0'
          y1='0'
          x2={this.props.dx}
          y2={this.props.dy}
          stroke-width={this.props.width}
        />
        <circle class='shadow' cx='0' cy='0' r='2' />

        <line
          class='hand'
          x1='0'
          y1='0'
          x2={this.props.dx}
          y2={this.props.dy}
          stroke-width={this.props.width}
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

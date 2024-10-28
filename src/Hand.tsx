import React from 'react'

import './Hand.css'

interface HandProps {
  width: number
  dx: number
  dy: number
}

class Hand extends React.Component<HandProps> {
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

export default Hand

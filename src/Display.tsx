import React from 'react';

import './Display.css';

import ClockCoordinates from './ClockCoordinates';

const WIND_TEXT_RADIUS = 13;
const WINDBOX_SCALE = 1.2;

interface DisplayProps {
  coords: ClockCoordinates;
  children?: React.ReactNode;
}

/**
 * This is supposed to mimic a display on the clock face.
 */
class Display extends React.Component<DisplayProps, { textWidth: number; textHeight: number }> {
  textRef: React.RefObject<SVGTextElement | null>;

  constructor(props: DisplayProps) {
    super(props);
    this.state = {
      textWidth: 0,
      textHeight: 0,
    };
    this.textRef = React.createRef<SVGTextElement>();
  }

  componentDidMount() {
    const boundingBox = this.textRef.current!.getBBox();
    this.setState({
      textWidth: boundingBox.width,
      textHeight: boundingBox.height,
    });
  }

  render() {
    const { coords, children } = this.props;
    const { textWidth, textHeight } = this.state;
    const x = coords.hourDx(WIND_TEXT_RADIUS);
    const y = coords.hourDy(WIND_TEXT_RADIUS);
    const rw = textWidth * WINDBOX_SCALE;
    const rh = textHeight * WINDBOX_SCALE;

    return (
      <>
        <rect x={x - rw / 2} y={y - rh / 2} width={rw} height={rh} rx="2" ry="2" className="wind" />
        <text
          ref={this.textRef}
          x={x}
          y={y}
          className="wind"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {children}
        </text>
      </>
    );
  }
}

// Accept the lint warning for missing defaultProps for children, as this is a TypeScript class component and children is optional.

export default Display;

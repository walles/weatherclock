import React from 'react';
import ClockCoordinates from './ClockCoordinates';

const DISTANCE_FROM_CENTER = 29;
const SIZE = 10;

export interface WeatherSymbolProps {
  coordinates: ClockCoordinates;
  symbol_code: string;
}

class WeatherSymbol extends React.Component<WeatherSymbolProps> {
  render() {
    // Note that we *could* download an SVG weather symbol, but that doesn't
    // work on Firefox 38.0.5 so we do PNG instead. And since cell phone screens
    // are what we're aiming for, PNG should be fine.
    const { coordinates, symbol_code } = this.props;
    const url = `api-met-no-weathericons/png/${symbol_code}.png`;

    const x = coordinates.symbolDx(DISTANCE_FROM_CENTER, SIZE);
    const y = coordinates.symbolDy(DISTANCE_FROM_CENTER, SIZE);

    return <image className="symbol" x={x} y={y} width={SIZE} height={SIZE} href={url} />;
  }
}

export default WeatherSymbol;

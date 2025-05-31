import React from 'react';
import './Temperature.css';
import ClockCoordinates from './ClockCoordinates';

const DISTANCE_FROM_CENTER = 39;

interface TemperatureProps {
  degreesCelsius?: number;
  coordinates: ClockCoordinates;
}

function Temperature({ degreesCelsius, coordinates }: TemperatureProps) {
  if (degreesCelsius === undefined || degreesCelsius === null) {
    return null;
  }

  // Truncate decimals
  const temperature = Math.trunc(degreesCelsius);
  const x = coordinates.hourDx(DISTANCE_FROM_CENTER);
  const y = coordinates.hourDy(DISTANCE_FROM_CENTER);

  return (
    <text className="hour" x={x} y={y}>
      {temperature}&deg;
    </text>
  );
}

export default Temperature;

import React from 'react';
import PropTypes from 'prop-types';

import './Temperature.css';
import ClockCoordinates from './ClockCoordinates';

const DISTANCE_FROM_CENTER = 39;

function Temperature({ degreesCelsius = 0, coordinates }) {
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

Temperature.propTypes = {
  degreesCelsius: PropTypes.number,
  coordinates: PropTypes.instanceOf(ClockCoordinates),
};

export default Temperature;

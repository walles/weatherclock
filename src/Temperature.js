import React from 'react';
import PropTypes from 'prop-types';

import './Temperature.css'

const HOUR_RADIUS = 39;

class Temperature extends React.Component {
    render = () => {
        // Truncate decimals
        const temperature = this.props.degreesCelsius | 0;

        const radians = 2 * Math.PI * (this.props.hour / 12.0);
        const x =  Math.round(Math.sin(radians) * HOUR_RADIUS);
        const y = -Math.round(Math.cos(radians) * HOUR_RADIUS);

        return (
            <text className="hour" x={x} y={y}>{temperature}&deg;</text>
        );
    }
}

Temperature.propTypes = {
    degreesCelsius: PropTypes.number,
    hour: PropTypes.number,
}

export default Temperature;

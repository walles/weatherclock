import React from 'react';

import Temperature from './Temperature.js';

class Weather extends React.Component {
    render = () => {
        // FIXME: After rendering, send stats to Google Analytics

        // FIXME: Add the actual temperatures
        return (
            <Temperature degreesCelsius={25} hour={12}></Temperature>
        );
    }
}

export default Weather;

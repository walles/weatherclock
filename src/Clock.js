import React from 'react';
import './Clock.css';

class Clock extends React.Component {
    constructor(props) {
        super(props);

        if (navigator.geolocation) {
            this.state = {
                'geolocation_excuse': 'pending',
                'geolocation_error': null,
                'position': null,
            }
        } else {
            this.state = {
                'geolocation_excuse': 'unsupported',
                'geolocation_error': null,
                'position': null,
            }
        }
    }

    componentDidMount = () => {
        if (this.state.geolocation_excuse === 'pending') {
            navigator.geolocation.getCurrentPosition(this.setPosition, this.geoError);
        }
    }

    setPosition = (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log(`got position: ${latitude} ${longitude}`);
        this.setState({
            'geolocation_excuse': null,
            'geolocation_error': null,
            'position': position.coords,
        });
    }

    geoError = (error) => {
        this.setState({
            'geolocation_excuse': 'failed',
            'geolocation_error': error.message,
            'position': null,
        });
    }

    render = () => {
        if (this.state.geolocation_excuse === 'unsupported') {
            // FIXME: Do something more informative here
            return (
                <p>Geolocation not supported</p>
            );
        }

        if (this.state.geolocation_excuse === 'pending') {
            // FIXME: Do something better looking here
            return (
                <p>Geolocating...</p>
            );
        }

        if (this.state.geolocation_error !== null) {
            // FIXME: Do something better looking here
            return (
                <p>Geolocation failed: {this.state.geolocation_error}</p>
            );
        }

        return (
            <svg
            id="weatherclock"
            xmlns="http://www.w3.org/2000/svg" version="1.1"
            viewBox="-50 -50 100 100">

            <image id="clock-frame" x="-50" y="-50" width="100" height="100" xlinkHref="clock-frame.png" />

            {/*
            <g id="hands" visibility="hidden">
                <line id="hour-hand" class="hand" x1="0" y1="2" x2="0" y2="-23" stroke-width="2.5" />
                <line id="minute-hand" class="hand" x1="0" y1="3" x2="0" y2="-34" stroke-width="2" />
                <circle id="hand-center" cx="0" cy="0" r="2" fill="black"/>
            </g>
            */}
            </svg>
        );
    }
}

export default Clock;

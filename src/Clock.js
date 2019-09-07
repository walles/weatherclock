import React from 'react';
import './Clock.css';

class Clock extends React.Component {
    constructor(props) {
        super(props);

        if (navigator.geolocation) {
            this.state = {
                'status': 'pending',
                'error_message': null,
                'position': null,
            }
        } else {
            this.state = {
                'status': 'geolocation_unsupported',
                'error_message': null,
                'position': null,
            }
        }
    }

    componentDidMount = () => {
        if (this.state.status === 'pending') {
            console.log("Geolocating...");
            navigator.geolocation.getCurrentPosition(this.setPosition, this.geoError);
        }
    }

    setPosition = (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log(`got position: ${latitude} ${longitude}`);
        this.setState({
            'status': 'forecast pending',
            'error_message': null,
            'position': position.coords,
        });

        this.download_weather(latitude, longitude);
    }

    download_weather = (latitude, longitude) => {
        const url =
            `https://api-met-no-proxy.appspot.com/weatherapi/locationforecast/1.9/?lat=${latitude};lon=${longitude}`;
        console.log("Getting weather from: " + url);

        // FIXME: Handle fetch() error
        // FIXME: Handle JSON parsing error
        fetch(url).then(function(response) {
            return response.text();
        }).then(function(weatherXmlString) {
            // FIXME: Somehow handle the weather XML
            console.log(weatherXmlString);
        });
    }

    geoError = (error) => {
        console.log("Geolocation failed");
        this.setState({
            'status': 'geolocation_failed',
            'error_message': error.message,
            'position': null,
        });
    }

    render = () => {
        if (this.state.error_message !== null) {
            // FIXME: Do something better looking here
            return (
                <p>Error: {this.state.error_message}</p>
            );
        }

        if (this.state.status === 'geolocation_unsupported') {
            // FIXME: Do something more informative here
            return (
                <p>Geolocation not supported</p>
            );
        }

        if (this.state.status === 'pending') {
            // FIXME: Do something better looking here
            // FIXME: Maybe inspired by this? https://stackoverflow.com/a/30933053/473672
            return (
                <p>Geolocating...</p>
            );
        }

        if (this.state.status === 'forecast pending') {
            // FIXME: Do something better looking here
            // FIXME: Maybe inspired by this? https://stackoverflow.com/a/30933053/473672
            return (
                <p>Downloading weather forecast...</p>
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

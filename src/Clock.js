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

        const self = this;

        // FIXME: Handle fetch() error
        // FIXME: Handle JSON parsing error
        fetch(url).then(function(response) {
            return response.text();
        }).then(function(weatherXmlString) {
            // FIXME: Somehow handle the weather XML
            console.log(weatherXmlString);

            self.setState({
                'status': 'got forecast',
                'error_message': null,
                'position': self.state.position,
            });
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

    textElement = (text) => {
        // FIXME: Make sure the text fits in the circle
        // FIXME: Maybe inspired by this? https://stackoverflow.com/a/30933053/473672
        return (
            <text x="0" y="0">{text}</text>
        )
    }

    render = () => {
        return (
            <svg
            id="weatherclock"
            xmlns="http://www.w3.org/2000/svg" version="1.1"
            viewBox="-50 -50 100 100">

            <image id="clock-frame" x="-50" y="-50" width="100" height="100" xlinkHref="clock-frame.png" />

            {this.getClockContents()}

            </svg>
        );
    }

    getClockContents = () => {
        if (this.state.error_message !== null) {
            return this.textElement("Error: " + this.state.error_message);
        }

        if (this.state.status === 'geolocation_unsupported') {
            return this.textElement("Geolocation not supported");
        }

        if (this.state.status === 'pending') {
            return this.textElement("Locating phone...");
        }

        if (this.state.status === 'forecast pending') {
            return this.textElement("Downloading weather forecast...")
        }

        return this.textElement("Imagine a weather forecast here");
    }
}

export default Clock;

import React from 'react';
import './Clock.css';

function Clock() {
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

export default Clock;

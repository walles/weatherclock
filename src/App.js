import React from 'react';
import './App.css';
import Clock from './Clock.js';

function App() {
  return (
    <div className="App">
      <Clock></Clock>

      {/*
      If you add a Weatherclock launcher to your home screen on an iPhone,
      the page opened will not be in a web-browser (or at least look like
      it's not).

      So we add a reload button of our own here.
      */}
      <button type="button" onclick="location.reload();">Update forecast FIXME: Handler doesnt work</button>

      <p>Weather forecast from <a href="yr.no">yr.no</a>, delivered by the
      <a href="http://met.no/English/">Norwegian Meteorological Institute</a>
      and the <a href="http://www.nrk.no/">NRK</a>.</p>

      <p>Imagine a share-on-Facebook button here</p>

      <p>
        <a href="https://github.com/walles/weatherclock">Source code on GitHub</a>
      </p>
    </div>
  );
}

export default App;

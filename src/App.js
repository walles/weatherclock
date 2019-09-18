import React from 'react'
import './App.css'

import Clock from './Clock.js'

import PageVisibility from 'react-page-visibility'

class App extends React.Component {
  state = {
    now: new Date()
  }

  setTimeToNow = () => {
    this.setState({
      now: new Date()
    })
  }

  handleVisibilityChange = isVisible => {
    console.debug(`Page visibility changed: ${isVisible}`)
    if (isVisible) {
      this.setTimeToNow()
    }
  }

  render = () => {
    return (
      <PageVisibility onChange={this.handleVisibilityChange}>
        <div className='App'>
          <Clock now={this.state.now} reload={this.setTimeToNow} />

          {/*
          If you add a Weatherclock launcher to your home screen on an iPhone,
          the page opened will not be in a web-browser (or at least look like
          it's not).

          So we add a reload button of our own here.
          */}
          <button type='button' onClick={this.setTimeToNow}>
            Update forecast
          </button>

          <p>
            Weather forecast from <a href='yr.no'>yr.no</a>, delivered by the{' '}
            <a href='https://met.no/English/'>Norwegian Meteorological Institute</a> and the{' '}
            <a href='https://www.nrk.no/'>NRK</a>.
          </p>

          <p>
            <a
              href={`https://github.com/walles/weatherclock/tree/${process.env.REACT_APP_GIT_SHA}`}
            >
              Source code on GitHub
            </a>
          </p>
        </div>
      </PageVisibility>
    )
  }
}

export default App

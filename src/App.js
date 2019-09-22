import React from 'react'
import './App.css'

import Clock from './Clock.js'

import PageVisibility from 'react-page-visibility'

import ReactGA from 'react-ga'
if (process.env.NODE_ENV === 'production') {
  // To prevent bad data from dev and test runs we only enable Google Analytics
  // in production
  ReactGA.initialize('UA-59702036-2', {
    gaOptions: {
      // IPs are personally identifiable according to GDPR:
      // https://eugdprcompliant.com/personal-data/
      anonymizeIp: true
    }
  })
}
ReactGA.pageview(window.location.pathname + window.location.search)

class App extends React.Component {
  state = {
    now: new Date(),
    nowOrTomorrow: 'now'
  }

  setTimeToNow = () => {
    this.setState({
      now: new Date(),
      nowOrTomorrow: 'now'
    })
  }

  handleVisibilityChange = isVisible => {
    console.debug(`Page visibility changed: ${isVisible}`)
    if (isVisible) {
      this.setTimeToNow()
    }
  }

  onSetTimespan = timespan => {
    if (timespan === 'now') {
      this.setState({
        nowOrTomorrow: 'now',
        now: new Date()
      })
    } else {
      let tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1 /* days */)
      tomorrow.setHours(8)
      tomorrow.setMinutes(0)
      tomorrow.setSeconds(0)
      tomorrow.setMilliseconds(0)

      this.setState({
        nowOrTomorrow: 'tomorrow',
        now: tomorrow
      })
    }
  }

  render = () => {
    return (
      <PageVisibility onChange={this.handleVisibilityChange}>
        <div className='App'>
          <Clock
            now={this.state.now}
            reload={this.setTimeToNow}
            onSetTimespan={this.onSetTimespan}
            nowOrTomorrow={this.state.nowOrTomorrow}
          />

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

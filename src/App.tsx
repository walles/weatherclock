import React from 'react'
import './App.css'

import Clock from './Clock'
import { NamedStartTime } from './TimeSelect'

import PageVisibility from 'react-page-visibility'

import ReactGA from 'react-ga'
if (process.env.NODE_ENV === 'production') {
  // To prevent bad data from dev and test runs we only enable Google Analytics
  // in production
  ReactGA.initialize('UA-59702036-2')

  // IPs are personally identifiable according to GDPR:
  // https://eugdprcompliant.com/personal-data/
  ReactGA.set({ anonymizeIp: true })
}
ReactGA.pageview(window.location.pathname + window.location.search)

type AppState = {
  startTime: NamedStartTime
}

class App extends React.Component<{}, AppState> {
  state = {
    startTime: new NamedStartTime(0)
  }

  setTimeToNow = () => {
    this.setState({
      startTime: new NamedStartTime(0)
    })
  }

  handleVisibilityChange = (isVisible: boolean) => {
    console.debug(`Page visibility changed: ${isVisible}`)
    if (isVisible) {
      this.setTimeToNow()
    }
  }

  onSetStartTime = (startTime: NamedStartTime) => {
    if (!startTime) {
      throw new Error(`Start time not set: ${startTime}`)
    }
    this.setState({
      startTime: startTime
    })
  }

  render = () => {
    return (
      <PageVisibility onChange={this.handleVisibilityChange}>
        <div className='App'>
          <Clock
            startTime={this.state.startTime}
            reload={this.setTimeToNow}
            onSetStartTime={this.onSetStartTime}
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
            <a href='https://met.no/English/'>
              Norwegian Meteorological Institute
            </a>{' '}
            and the <a href='https://www.nrk.no/'>NRK</a>. Northern lights forecasts based on{' '}
            <a href="https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json">NOAA's
            Planetary K Index forecast</a> together with{' '}
            <a href="https://hjelp.yr.no/hc/en-us/articles/4411702484754-Aurora-forecast-on-Yr">YR's{' '}
            interpretation thereof</a>.
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

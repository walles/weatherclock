import React from 'react'
import PropTypes from 'prop-types'

import './Clock.css'

import Weather from './Weather.js'
import Hand from './Hand.js'
import Error from './Error.js'
import ClockCoordinates from './ClockCoordinates.js'

const HOUR_HAND_LENGTH = 23
const MINUTE_HAND_LENGTH = 34

class Clock extends React.Component {
  constructor (props) {
    super(props)

    this.state = this._getInitialState()
  }

  _getInitialState = () => {
    if (navigator.geolocation) {
      return {
        now: this.props.now,
        position: null,
        progress: null,
        forecast: null,
        error: null
      }
    }

    return {
      now: this.props.now,
      position: null,
      progress: null,
      forecast: null,

      // FIXME: Add a link for contacting me with browser information
      error: (
        <Error title='Geolocation unsupported' reload={this.props.reload}>
          Your browser does not support geolocation. Without knowing your current position, showing
          your local weather forecast is not possible.
          <p>Please try another browser.</p>
        </Error>
      )
    }
  }

  componentDidMount = () => {
    this.startGeolocationIfNeeded()
  }

  componentDidUpdate = () => {
    if (this.props.now !== this.state.now) {
      this.setState(this._getInitialState())
    }

    this.startGeolocationIfNeeded()
  }

  startGeolocationIfNeeded = () => {
    if (this.state.position) {
      // Already know where we are, never mind
      return
    }

    if (this.state.progress) {
      // Something is already in progress, never mind
      return
    }

    if (this.state.error) {
      // Something has gone wrong, never mind
      return
    }

    console.log('Geolocating...')
    this.setState({
      progress: <text className='progress'>Locating phone...</text>
    })
    navigator.geolocation.getCurrentPosition(this.setPosition, this.geoError)
  }

  setPosition = position => {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    console.log(`got position: ${latitude} ${longitude}`)
    this.setState({
      progress: <text className='progress'>Downloading weather...</text>,
      position: position.coords
    })

    this.download_weather(latitude, longitude)
  }

  download_weather = (latitude, longitude) => {
    const url = `https://api-met-no-proxy.appspot.com/weatherapi/locationforecast/1.9/?lat=${latitude};lon=${longitude}`
    console.log('Getting weather from: ' + url)

    const self = this

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Response code from upstream: ${response.status}`)
        }
        return response.text()
      })
      .then(weatherXmlString => {
        const forecast = self.parseWeatherXml(weatherXmlString)

        self.setState({ forecast: forecast })
      })
      .catch(error => {
        this.setState({
          error: (
            <Error title='Downloading weather failed' reload={this.props.reload}>
              {error.message}
            </Error>
          )
        })
      })
  }

  /* Parses weather XML from yr.no into a weather object that maps timestamps (in
   * seconds since the epoch) to forecasts. A forecast has these fields:
   *
   * .celsius: The forecasted temperatures in centigrades
   *
   * .wind_m_s: The forecasted wind speed
   *
   * .symbol: The weather symbol index. Resolve using
   *         https://api.yr.no/weatherapi/weathericon
   */
  parseWeatherXml = weatherXmlString => {
    const weatherXml = new window.DOMParser().parseFromString(weatherXmlString, 'text/xml')
    const allPrognoses = weatherXml.getElementsByTagName('time')
    console.log('Parsing ' + allPrognoses.length + ' prognoses...')

    const forecasts = {}
    for (var i = 0; i < allPrognoses.length; i++) {
      const prognosis = allPrognoses[i]

      const from = new Date(prognosis.attributes.from.value)
      const to = new Date(prognosis.attributes.to.value)
      const dh = (to.getTime() - from.getTime()) / (3600 * 1000)
      const timestamp = new Date((from.getTime() + to.getTime()) / 2)

      var forecast = forecasts[timestamp]
      if (!forecast) {
        forecast = {}
      }

      forecast.timestamp = timestamp

      if (forecast.span_h !== undefined && forecast.span_h <= dh) {
        // There's already better data here
        continue
      }

      forecast.span_h = dh

      const symbolNodes = prognosis.getElementsByTagName('symbol')
      if (symbolNodes && symbolNodes.length > 0) {
        const symbolNumber = symbolNodes[0].attributes.number.value
        forecast.symbol = symbolNumber
      }

      const celsiusNodes = prognosis.getElementsByTagName('temperature')
      if (celsiusNodes && celsiusNodes.length > 0) {
        const celsiusValue = celsiusNodes[0].attributes.value.value
        forecast.celsius = parseFloat(celsiusValue)
      }

      const windNodes = prognosis.getElementsByTagName('windSpeed')
      if (windNodes && windNodes.length > 0) {
        const windValue = windNodes[0].attributes.mps.value
        forecast.wind_m_s = parseFloat(windValue)
      }

      const precipitationNodes = prognosis.getElementsByTagName('precipitation')
      if (precipitationNodes && precipitationNodes.length > 0) {
        const precipitationValue = precipitationNodes[0].attributes.value.value
        forecast.precipitation_mm = parseFloat(precipitationValue)
      }

      forecasts[timestamp] = forecast
    }

    return forecasts
  }

  geoError = error => {
    console.log('Geolocation failed')
    this.setState({
      // FIXME: Add a report-problem link?
      // FIXME: Make the error message text clickable and link it to a Google search
      // Reload trickery from: https://stackoverflow.com/a/10840058/473672

      // Note that at least on desktop Firefox 69.0 for Mac, this JS-triggered reload
      // won't re-ask the positioning question, but if the user manually reloads that
      // will re-ask the question.
      error: (
        <Error title={error.message} reload={window.location.reload.bind(window.location, [true])}>
          If you are asked whether to allow the Weather Clock to know your current location, please
          say "yes".
        </Error>
      )
    })
  }

  renderHands = () => {
    const nowCoords = new ClockCoordinates(this.state.now)

    // FIXME: This doubles the center circle shadow, maybe draw
    // the center circle once here to get us only one of those?
    return (
      <React.Fragment>
        <Hand
          width={2.5}
          dx={nowCoords.hourDx(HOUR_HAND_LENGTH)}
          dy={nowCoords.hourDy(HOUR_HAND_LENGTH)}
        />
        <Hand
          width={2}
          dx={nowCoords.minuteDx(MINUTE_HAND_LENGTH)}
          dy={nowCoords.minuteDy(MINUTE_HAND_LENGTH)}
        />
      </React.Fragment>
    )
  }

  render = () => {
    return (
      <React.Fragment>
        <svg
          id='weatherclock'
          xmlns='http://www.w3.org/2000/svg'
          version='1.1'
          viewBox='-50 -50 100 100'
        >
          <image x='-50' y='-50' width='100' height='100' xlinkHref='clock-frame.png' />

          {this.getClockContents()}
        </svg>
        {this.state.error}
      </React.Fragment>
    )
  }

  getClockContents = () => {
    if (this.state.error) {
      // The hands will show up behind the error dialog
      return this.renderHands()
    }

    if (this.state.forecast) {
      return (
        <React.Fragment>
          <Weather forecast={this.state.forecast} now={this.state.now} />
          {this.renderHands()}
        </React.Fragment>
      )
    }

    if (this.state.progress) {
      return this.state.progress
    }

    // Most likely the initial state
    return null
  }
}

Clock.propTypes = {
  now: PropTypes.instanceOf(Date).isRequired,
  reload: PropTypes.func.isRequired
}

export default Clock

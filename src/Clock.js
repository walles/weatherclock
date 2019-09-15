import React from 'react'
import PropTypes from 'prop-types'

import './Clock.css'

import Weather from './Weather.js'
import Hand from './Hand.js'
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
        status: 'pending',
        error_message: null,
        position: null,
        forecast: null
      }
    }

    return {
      now: this.props.now,
      status: 'geolocation_unsupported',
      error_message: null,
      position: null,
      forecast: null
    }
  }

  componentDidMount = () => {
    if (this.state.status === 'pending') {
      console.log('Geolocating...')
      navigator.geolocation.getCurrentPosition(this.setPosition, this.geoError)
    }
  }

  componentDidUpdate = () => {
    if (this.props.now !== this.state.now) {
      this.setState(this._getInitialState())
    }

    if (this.state.status === 'pending') {
      console.log('Geolocating...')
      navigator.geolocation.getCurrentPosition(this.setPosition, this.geoError)
    }
  }

  setPosition = position => {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    console.log(`got position: ${latitude} ${longitude}`)
    this.setState({
      now: this.props.now,
      status: 'forecast pending',
      error_message: null,
      position: position.coords,
      forecast: null
    })

    this.download_weather(latitude, longitude)
  }

  download_weather = (latitude, longitude) => {
    const url = `https://api-met-no-proxy.appspot.com/weatherapi/locationforecast/1.9/?lat=${latitude};lon=${longitude}`
    console.log('Getting weather from: ' + url)

    const self = this

    // FIXME: Handle fetch() error
    // FIXME: Handle JSON parsing error
    fetch(url)
      .then(function (response) {
        return response.text()
      })
      .then(function (weatherXmlString) {
        const forecast = self.parseWeatherXml(weatherXmlString)

        self.setState({
          now: self.props.now,
          status: 'got forecast',
          error_message: null,
          position: self.state.position,
          forecast: forecast
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
      now: this.props.now,
      status: 'geolocation_failed',
      error_message: error.message,
      position: null,
      forecast: null
    })
  }

  textElement = text => {
    console.log(text)

    // FIXME: Make sure the text fits in the circle
    // FIXME: Maybe inspired by this? https://stackoverflow.com/a/30933053/473672
    return (
      <text x='0' y='0' className='progress'>
        {text}
      </text>
    )
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
          <image
            id='clock-frame'
            x='-50'
            y='-50'
            width='100'
            height='100'
            xlinkHref='clock-frame.png'
          />

          {this.getClockContents()}
        </svg>
        {this.getExcuses()}
      </React.Fragment>
    )
  }

  getExcuses = () => {
    if (this.state.error_message !== null) {
      // FIXME: Turn this into an error dialog
      return <p>Error: {this.state.error_message}</p>
    }

    if (this.state.status === 'geolocation_unsupported') {
      // FIXME: Turn this into an error dialog
      return <p>Error: Geolocation not supported</p>
    }

    return null
  }

  getClockContents = () => {
    const excuses = this.getExcuses()
    if (excuses != null) {
      // Excuses schmexcuses, no forecast for you
      return this.renderHands()
    }

    if (this.state.status === 'pending') {
      return this.textElement('Locating phone...')
    }

    if (this.state.status === 'forecast pending') {
      return this.textElement('Downloading forecast...')
    }

    return (
      <React.Fragment>
        <Weather forecast={this.state.forecast} now={this.state.now} />
        {this.renderHands()}
      </React.Fragment>
    )
  }
}

Clock.propTypes = {
  now: PropTypes.instanceOf(Date)
}

export default Clock

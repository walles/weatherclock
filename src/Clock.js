import React from 'react'
import PropTypes from 'prop-types'

import ReactGA from 'react-ga'

import './Clock.css'

import Weather from './Weather.js'
import Hand from './Hand.js'
import Error from './Error.js'
import ClockCoordinates from './ClockCoordinates.js'
import TimeSelect from './TimeSelect'

const HOUR_HAND_LENGTH = 23
const MINUTE_HAND_LENGTH = 34

/** Cache positions for this long */
const POSITION_CACHE_MS = 5 * 60 * 1000

/** Cache forecasts for this long */
const FORECAST_CACHE_MS = 2 * 60 * 60 * 1000

/** If we move less than this, assume forecast is still valid */
const FORECAST_CACHE_KM = 5

class Clock extends React.Component {
  constructor (props) {
    super(props)

    this.state = this._getInitialState()
  }

  _getInitialState = () => {
    if (navigator.geolocation) {
      // FIXME: Invalidate forecast if it's too old (and decide what "too old" means)
      return {
        now: this.props.now,
        progress: null,
        error: null
      }
    }

    ReactGA.exception({
      description: 'Geolocation unsupported',
      fatal: true
    })

    return {
      now: this.props.now,
      progress: null,

      // FIXME: Add a link for contacting me with browser information
      error: (
        <Error title='Geolocation unsupported' reload={this.props.reload}>
          Please try <a href='https://getfirefox.com'>another browser</a>.
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

    if (this.startGeolocationIfNeeded()) {
      // If / when we get the new position, that will in turn trigger a forecast
      // update, so our work here is done.
      return
    }

    if (this.state.progress) {
      // Something is already happening, don't interrupt it by getting a new forecast
      return
    }

    if (this.forecastIsCurrent()) {
      // Forecast already current, never mind
      return
    }

    this.download_weather()
  }

  startGeolocationIfNeeded = () => {
    if (this.state.progress) {
      // Something is already in progress, never mind
      return false
    }

    if (this.state.error) {
      // Something has gone wrong, never mind
      return false
    }

    if (this.state.position) {
      const position_age_ms = new Date() - this.state.positionTimestamp

      if (position_age_ms < POSITION_CACHE_MS) {
        // Already know where we are, never mind
        console.debug(`Retaining cached position of ${position_age_ms}ms age`)
        return false
      }
    }

    console.log('Geolocating...')
    this.setState({
      progress: <text className='progress'>Locating phone...</text>
    })
    navigator.geolocation.getCurrentPosition(this.setPosition, this.geoError)

    return true
  }

  setPosition = position => {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    console.log(`got position: ${latitude} ${longitude}`)

    this.setState({
      position: position.coords,
      positionTimestamp: new Date()
    })

    if (!this.forecastIsCurrent()) {
      this.download_weather()
    }
  }

  // From: https://stackoverflow.com/a/27943/473672
  getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const EARTH_RADIUS_KM = 6371
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c
  }

  deg2rad = deg => {
    return deg * (Math.PI / 180)
  }

  forecastIsCurrent = () => {
    if (!this.state.forecast) {
      // No forecast at all, that's not current
      return false
    }

    const metadata = this.state.forecastMetadata
    const ageMs = new Date() - metadata.timestamp
    if (ageMs > FORECAST_CACHE_MS) {
      // Forecast too old, that's not current
      return false
    }

    const kmDistance = this.getDistanceFromLatLonInKm(
      metadata.latitude,
      metadata.longitude,
      this.state.position.latitude,
      this.state.position.longitude
    )
    if (kmDistance > FORECAST_CACHE_KM) {
      // Forecast from too far away, that's not current
      return false
    }

    console.debug(`Forecast considered current: ${ageMs}ms old and ${kmDistance}km away`)
    return true
  }

  download_weather = () => {
    const latitude = this.state.position.latitude
    const longitude = this.state.position.longitude

    this.setState({
      progress: <text className='progress'>Downloading weather...</text>
    })

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

        self.setState({
          forecast: forecast,
          forecastMetadata: {
            // FIXME: Rather than the current timestamp, maybe track when yr.no
            // thinks the next forecast will be available? That information is
            // available in the XML.
            timestamp: new Date(),
            latitude: latitude,
            longitude: longitude
          }
        })
      })
      .catch(error => {
        ReactGA.exception({
          description: `Downloading weather failed: ${error.message}`,
          fatal: !this.state.forecast
        })

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
    for (let i = 0; i < allPrognoses.length; i++) {
      const prognosis = allPrognoses[i]

      const from = new Date(prognosis.attributes.from.value)
      const to = new Date(prognosis.attributes.to.value)
      const dh = (to.getTime() - from.getTime()) / (3600 * 1000)
      const timestamp = new Date((from.getTime() + to.getTime()) / 2)

      let forecast = forecasts[timestamp]
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
        const maxAttribute = precipitationNodes[0].attributes.maxvalue
        const expectedAttribute = precipitationNodes[0].attributes.value
        const precipitationValue = (maxAttribute === undefined) ? expectedAttribute.value : maxAttribute.value
        forecast.precipitation_mm = parseFloat(precipitationValue)
      }

      forecasts[timestamp] = forecast
    }

    console.log(forecasts)
    return forecasts
  }

  geoError = error => {
    console.log('Geolocation failed')
    ReactGA.exception({
      description: `Geolocation failed: ${error.message}`,
      fatal: !this.state.forecast
    })
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
        {this.state.forecast ? (
          <TimeSelect value={this.props.nowOrTomorrow} onSetTimespan={this.props.onSetTimespan} />
        ) : null}
      </React.Fragment>
    )
  }

  getClockContents = () => {
    if (this.state.forecast) {
      if (this.props.nowOrTomorrow === 'tomorrow') {
        return (
          <React.Fragment>
            <Weather forecast={this.state.forecast} now={this.state.now} />
            <text className='tomorrow'>Tomorrow</text>
          </React.Fragment>
        )
      } else {
        // Now
        return (
          <React.Fragment>
            <Weather forecast={this.state.forecast} now={this.state.now} />
            {this.renderHands()}
          </React.Fragment>
        )
      }
    }

    if (this.state.error) {
      // These hands will show up behind the error dialog
      return this.renderHands()
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
  reload: PropTypes.func.isRequired,
  nowOrTomorrow: PropTypes.string.isRequired,
  onSetTimespan: PropTypes.func.isRequired
}

export default Clock

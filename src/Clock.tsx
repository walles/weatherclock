import React from 'react'
import PropTypes from 'prop-types'

import ReactGA from 'react-ga'

import './Clock.css'

import Weather from './Weather'
import Hand from './Hand'
import ErrorDialog from './ErrorDialog'
import ClockCoordinates from './ClockCoordinates'
import TimeSelect, { NamedStartTime } from './TimeSelect'
import { Forecast } from './Forecast'

const HOUR_HAND_LENGTH = 23
const MINUTE_HAND_LENGTH = 34

/** Cache positions for this long */
const POSITION_CACHE_MS = 5 * 60 * 1000

/** Cache forecasts for this long */
const FORECAST_CACHE_MS = 2 * 60 * 60 * 1000

/** If we move less than this, assume forecast is still valid */
const FORECAST_CACHE_KM = 5

type ClockProps = {
  startTime: NamedStartTime
  reload: () => void
  onSetStartTime: (startTime: NamedStartTime) => void
}

type ClockState = {
  startTime: NamedStartTime

  error?: JSX.Element
  progress?: JSX.Element

  position?: {
    latitude: number
    longitude: number
  }
  positionTimestamp?: Date

  forecast?: Map<number, Forecast>
  forecastMetadata?: {
    // FIXME: Rather than the current timestamp, maybe track when yr.no
    // thinks the next forecast will be available? That information is
    // available in the XML.
    timestamp: Date
    latitude: number
    longitude: number
  }
}

class Clock extends React.Component<ClockProps, ClockState> {
  static propTypes = {
    startTime: PropTypes.instanceOf(NamedStartTime).isRequired,
    reload: PropTypes.func.isRequired,
    onSetStartTime: PropTypes.func.isRequired
  }

  constructor (props: ClockProps) {
    super(props)

    this.state = this._getInitialState()
  }

  _getInitialState = (): ClockState => {
    if (navigator.geolocation) {
      // FIXME: Invalidate forecast if it's too old (and decide what "too old" means)
      return {
        startTime: this.props.startTime,
        progress: undefined,
        error: undefined
      }
    }

    ReactGA.exception({
      description: 'Geolocation unsupported',
      fatal: true
    })

    return {
      startTime: this.props.startTime,
      progress: undefined,

      // FIXME: Add a link for contacting me with browser information
      error: (
        <ErrorDialog title='Geolocation unsupported' reload={this.props.reload}>
          Please try <a href='https://getfirefox.com'>another browser</a>.
        </ErrorDialog>
      )
    }
  }

  componentDidMount = () => {
    this.startGeolocationIfNeeded()
  }

  componentDidUpdate = () => {
    if (this.props.startTime.startTime !== this.state.startTime.startTime) {
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
      const position_age_ms =
        Date.now() - this.state.positionTimestamp!.getTime()

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

  setPosition = (position: Position) => {
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
  getDistanceFromLatLonInKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
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

  deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  forecastIsCurrent = () => {
    if (!this.state.forecast) {
      // No forecast at all, that's not current
      return false
    }

    const metadata = this.state.forecastMetadata!
    const ageMs = Date.now() - metadata.timestamp.getTime()
    if (ageMs > FORECAST_CACHE_MS) {
      // Forecast too old, that's not current
      return false
    }

    const kmDistance = this.getDistanceFromLatLonInKm(
      metadata.latitude,
      metadata.longitude,
      this.state.position!.latitude,
      this.state.position!.longitude
    )
    if (kmDistance > FORECAST_CACHE_KM) {
      // Forecast from too far away, that's not current
      return false
    }

    console.debug(
      `Forecast considered current: ${ageMs}ms old and ${kmDistance}km away`
    )
    return true
  }

  download_weather = () => {
    const latitude = this.state.position!.latitude
    const longitude = this.state.position!.longitude

    this.setState({
      progress: <text className='progress'>Downloading weather...</text>
    })

    const url = `https://europe-west2-api-met-no-proxy.cloudfunctions.net/api-met-no-proxy/locationforecast/2.0/classic?lat=${latitude};lon=${longitude}`
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
            timestamp: new Date(),
            latitude: latitude,
            longitude: longitude
          }
        })
      })
      .catch(error => {
        console.error(error)

        ReactGA.exception({
          description: `Downloading weather failed: ${error.message}`,
          fatal: !this.state.forecast
        })

        this.setState({
          error: (
            <ErrorDialog
              title='Downloading weather failed'
              reload={this.props.reload}
            >
              {error.message}
            </ErrorDialog>
          )
        })
      })
  }

  /* Parses weather XML from yr.no into a weather object that maps timestamps (in
   * milliseconds since the epoch) to forecasts. */
  parseWeatherXml = (weatherXmlString: string): Map<number, Forecast> => {
    const weatherXml = new window.DOMParser().parseFromString(
      weatherXmlString,
      'text/xml'
    )
    const allPrognoses = weatherXml.getElementsByTagName('time')
    console.log('Parsing ' + allPrognoses.length + ' prognoses...')

    const forecasts: Map<number, Forecast> = new Map()
    for (let i = 0; i < allPrognoses.length; i++) {
      const prognosis = allPrognoses[i]

      const from = new Date(prognosis.attributes.getNamedItem('from')!.value)
      const to = new Date(prognosis.attributes.getNamedItem('to')!.value)
      const dh = (to.getTime() - from.getTime()) / (3600 * 1000)
      const timestamp = new Date((from.getTime() + to.getTime()) / 2)

      let forecast = forecasts.get(timestamp.getTime())
      if (forecast !== undefined && forecast.span_h <= dh) {
        // There's already higher resolution data here
        continue
      }

      if (!forecast) {
        forecast = {
          timestamp: timestamp,
          span_h: dh
        }
      }

      const symbolNodes = prognosis.getElementsByTagName('symbol')
      if (symbolNodes && symbolNodes.length > 0) {
        const symbol_code = symbolNodes[0].attributes.getNamedItem('code')!.value
        forecast.symbol_code = symbol_code
      }

      const celsiusNodes = prognosis.getElementsByTagName('temperature')
      if (celsiusNodes && celsiusNodes.length > 0) {
        const celsiusValue = celsiusNodes[0].attributes.getNamedItem('value')!
          .value
        forecast.celsius = parseFloat(celsiusValue)
      }

      const windNodes = prognosis.getElementsByTagName('windSpeed')
      if (windNodes && windNodes.length > 0) {
        const windValue = windNodes[0].attributes.getNamedItem('mps')!.value
        forecast.wind_m_s = parseFloat(windValue)
      }

      const precipitationNodes = prognosis.getElementsByTagName('precipitation')
      if (precipitationNodes && precipitationNodes.length > 0) {
        const maxAttribute = precipitationNodes[0].attributes.getNamedItem(
          'maxvalue'
        )!
        const expectedAttribute = precipitationNodes[0].attributes.getNamedItem(
          'value'
        )!
        const precipitationValue =
          maxAttribute === null
            ? expectedAttribute.value
            : maxAttribute.value
        forecast.precipitation_mm = parseFloat(precipitationValue)
      }

      forecasts.set(timestamp.getTime(), forecast)
    }

    console.log(forecasts)
    return forecasts
  }

  geoError = (error: PositionError) => {
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
        <ErrorDialog
          title={error.message}
          reload={window.location.reload.bind(window.location, true)}
        >
          If you are asked whether to allow the Weather Clock to know your
          current location, please say "yes".
        </ErrorDialog>
      )
    })
  }

  renderHands = () => {
    const nowCoords = new ClockCoordinates(this.state.startTime.startTime)

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
            x='-50'
            y='-50'
            width='100'
            height='100'
            xlinkHref={process.env.PUBLIC_URL + '/clock-frame.png'}
          />

          {this.getClockContents()}
        </svg>
        {this.state.error}
        {this.state.forecast ? (
          <TimeSelect
            daysFromNow={this.props.startTime.daysFromNow}
            onSetStartTime={this.props.onSetStartTime}
          />
        ) : null}
      </React.Fragment>
    )
  }

  getClockContents = () => {
    if (this.state.forecast) {
      if (this.props.startTime.daysFromNow !== 0) {
        return (
          <React.Fragment>
            <Weather
              forecast={this.state.forecast}
              now={this.state.startTime.startTime}
            />
            <text className='tomorrow'>{this.state.startTime.name}</text>
          </React.Fragment>
        )
      } else {
        // Now
        return (
          <React.Fragment>
            <Weather
              forecast={this.state.forecast}
              now={this.state.startTime.startTime}
            />
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

export default Clock

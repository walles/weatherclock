import React from 'react'
import PropTypes from 'prop-types'

import ReactGA from 'react-ga'

import './Clock.css'

import Weather from './Weather'
import Hand from './Hand'
import ErrorDialog from './ErrorDialog'
import ClockCoordinates from './ClockCoordinates'
import { NamedStartTime } from './TimeSelect'
import { Forecast } from './Forecast'
import { AuroraForecast } from './AuroraForecast'

const HOUR_HAND_LENGTH = 23
const MINUTE_HAND_LENGTH = 34

const MINUTE_MS = 60 * 1000

/** Cache positions for this long */
const POSITION_CACHE_MS = 5 * MINUTE_MS

const HOUR_MS = 60 * MINUTE_MS

/** Cache weather forecasts for two hours */
const FORECAST_CACHE_MS = 2 * HOUR_MS

/** Cache aurora forecasts for seven hours. The resolution is 3h over a couple
 * of days, so we won't win much from fetching it more often. */
const AURORA_FORECAST_CACHE_MS = 7 * HOUR_MS

/** If we move less than this, assume forecast is still valid */
const FORECAST_CACHE_KM = 5

type ClockProps = {
  startTime: NamedStartTime
  reload: () => void
}

type WeatherLocation = {
  latitude: number
  longitude: number
}

type ClockState = {
  startTime: NamedStartTime

  error?: JSX.Element
  progress?: JSX.Element

  position?: WeatherLocation
  positionTimestamp?: Date

  weatherForecast?: Map<number, Forecast>
  weatherForecastMetadata?: {
    // FIXME: Rather than the current timestamp, maybe track when yr.no
    // thinks the next forecast will be available? That information is
    // available in the XML.
    timestamp: Date
    latitude: number
    longitude: number
  }

  auroraForecast?: AuroraForecast
  auroraForecastMetadata?: {
    timestamp: Date
  }
}

class Clock extends React.Component<ClockProps, ClockState> {
  static propTypes = {
    startTime: PropTypes.instanceOf(NamedStartTime).isRequired,
    reload: PropTypes.func.isRequired,
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
    const forecastString = localStorage.getItem('forecast')
    const metadataString = localStorage.getItem('metadata')
    const positionString = localStorage.getItem('position')
    if (forecastString && metadataString && positionString) {
      // Recreate the map from our pair wise JSON representation
      const forecastArray = JSON.parse(forecastString)
      const forecast = new Map<number, Forecast>()
      forecastArray.forEach((pair: [number, Forecast]) => {
        const key = pair[0]
        const value = pair[1]
        const timestamp = new Date(value.timestamp)
        value.timestamp = timestamp

        forecast.set(key, value)
      })

      const metadataFromJson = JSON.parse(metadataString)
      const metadata = {
        timestamp: new Date(metadataFromJson.timestamp),
        latitude: metadataFromJson.latitude,
        longitude: metadataFromJson.longitude
      }

      const position = JSON.parse(positionString)

      console.log("Restoring data from local storage:", forecast, metadata, position)

      this.setState({
        weatherForecast: forecast,
        weatherForecastMetadata: metadata,
        position: position,
      })
    } else {
      console.log('No forecast found in local storage')
    }

    this.startGeolocationIfNeeded()
  }

  componentDidUpdate = () => {
    if (this.props.startTime.startTime !== this.state.startTime.startTime) {
      this.setState(this._getInitialState())
    }

    if (this.startGeolocationIfNeeded()) {
      // Wait for a new location to show up in our state
      return
    }

    if (this.state.progress) {
      // Something is already happening, don't interrupt it by getting a new forecast
      return
    }

    if (!this.forecastIsCurrent()) {
      this.download_weather()
    }

    if (!this.auroraForecastIsCurrent()) {
      this.bump_aurora_forecast()
    }
  }

  getFixedPosition = (): WeatherLocation | null => {
    const params = new URLSearchParams(window.location.search);
    const latitude = params.get('latitude');
    const longitude = params.get('longitude');

    if (!latitude && !longitude) {
      console.log('Set fixed position with query parameters ?latitude=...&longitude=...')
      return null;
    }

    if (!(latitude && longitude)) {
      console.error(`Fixed position is missing one number: latitude=${latitude}, longitude=${longitude}`)
      return null
    }

    const latitudeNumber = parseFloat(latitude)
    const longitudeNumber = parseFloat(longitude)
    if (isNaN(latitudeNumber) || isNaN(longitudeNumber)) {
      console.error(`Fixed position must get two numbers, not this: latitude=${latitude}, longitude=${longitude}`)
      return null
    }

    console.log(`Using fixed position: latitude=${latitudeNumber}, longitude=${longitudeNumber}`)

    return {
      latitude: latitudeNumber,
      longitude: longitudeNumber
    }
  }

  /**
   * Returns true if a new geolocation request was made, false otherwise.
   */
  startGeolocationIfNeeded = (): boolean => {
    if (this.state.progress) {
      // Something is already in progress, never mind
      return false
    }

    if (this.state.error) {
      // Something has gone wrong, never mind
      return false
    }

    if (this.state.position && this.state.positionTimestamp) {
      const position_age_ms =
        Date.now() - this.state.positionTimestamp!.getTime()

      if (position_age_ms < POSITION_CACHE_MS) {
        // Already know where we are, never mind
        console.debug(`Retaining cached position of ${position_age_ms}ms age`)
        return false
      }
    }

    const fixedPosition = this.getFixedPosition()
    if (fixedPosition != null) {
      this.setState({
        progress: undefined,
        position: fixedPosition,
        positionTimestamp: new Date()
      })
      return true
    }

    console.log('Geolocating...')
    this.setState({
      progress: <text className='progress'>Locating phone...</text>
    })
    navigator.geolocation.getCurrentPosition(this.setPosition, this.geoError)

    return true
  }

  setPosition = (position: Position) => {
    const weatherLocation = position.coords
    console.log(`got position: latitude=${weatherLocation.latitude}, longitude=${weatherLocation.longitude}`)

    this.setState({
      progress: undefined,
      position: weatherLocation,
      positionTimestamp: new Date()
    })
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

  /**
   * Relates to the weather forecast, not any other forecast.
   */
  forecastIsCurrent = () => {
    if (!this.state.weatherForecast) {
      // No forecast at all, that's not current
      return false
    }

    const metadata = this.state.weatherForecastMetadata!
    const ageMs = Date.now() - metadata.timestamp.getTime()
    if (ageMs > FORECAST_CACHE_MS) {
      // Forecast too old, that's not current
      return false
    }

    if (!this.state.position) {
      // No position, can't check distance
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

    console.debug(
      `Forecast considered current: ${ageMs / 1000.0}s old and ${kmDistance}km away`
    )
    return true
  }

  auroraForecastIsCurrent = () => {
    if (!this.state.auroraForecast) {
      // No forecast at all, that's not current
      return false
    }

    const metadata = this.state.auroraForecastMetadata!
    const ageMs = Date.now() - metadata.timestamp.getTime()
    if (ageMs > AURORA_FORECAST_CACHE_MS) {
      // Forecast too old, that's not current
      return false
    }

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
        const metadata = {
          timestamp: new Date(),
          latitude: latitude,
          longitude: longitude
        }

        console.log("Writing data to local storage:", forecast, metadata, self.state.position)
        localStorage.setItem('forecast', JSON.stringify(Array.from(forecast)))
        localStorage.setItem('metadata', JSON.stringify(metadata))
        localStorage.setItem('position', JSON.stringify(self.state.position))

        self.setState({
          weatherForecast: forecast,
          weatherForecastMetadata: metadata
        })
      })
      .catch(error => {
        console.error(error)

        ReactGA.exception({
          description: `Downloading weather failed: ${error.message}`,
          fatal: !this.state.weatherForecast
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

  bump_aurora_forecast = () => {
    const url = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json'
    console.log('Getting aurora forecast from: ' + url)

    const self = this
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Response code from aurora upstream: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        const forecast = new AuroraForecast(data)

        self.setState({
          auroraForecast: forecast,
          auroraForecastMetadata: {
            timestamp: new Date()
          }
        })
      })
      .catch(error => {
        console.error(error)

        ReactGA.exception({
          description: `Downloading aurora forecast failed: ${error.message}`,
          fatal: !this.state.auroraForecast
        })

        // Let's not tell the user, aurora forecasts not showing is a corner case
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
      fatal: !this.state.weatherForecast
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
        <svg className='clockSvg'
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
            xlinkHref={process.env.PUBLIC_URL + '/clock-frame.webp'}
          />

          {this.getClockContents()}
        </svg>
        {this.state.error}
      </React.Fragment>
    )
  }

  getClockContents = () => {
    if (this.state.weatherForecast) {
      if (this.props.startTime.daysFromNow !== 0) {
        return (
          <React.Fragment>
            <Weather
              weatherForecast={this.state.weatherForecast}
              auroraForecast={this.state.auroraForecast}
              latitude={this.state.position!.latitude}
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
              weatherForecast={this.state.weatherForecast}
              auroraForecast={this.state.auroraForecast}
              latitude={this.state.position!.latitude}
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

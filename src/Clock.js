import React from 'react'
import './Clock.css'

import Weather from './Weather.js'

class Clock extends React.Component {
  constructor (props) {
    super(props)

    if (navigator.geolocation) {
      this.state = {
        status: 'pending',
        error_message: null,
        position: null,
        forecast: null
      }
    } else {
      this.state = {
        status: 'geolocation_unsupported',
        error_message: null,
        position: null,
        forecast: null
      }
    }
  }

  componentDidMount = () => {
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

  render = () => {
    return (
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
    )
  }

  getClockContents = () => {
    if (this.state.error_message !== null) {
      return this.textElement('Error: ' + this.state.error_message)
    }

    if (this.state.status === 'geolocation_unsupported') {
      return this.textElement('Geolocation not supported')
    }

    if (this.state.status === 'pending') {
      return this.textElement('Locating phone...')
    }

    if (this.state.status === 'forecast pending') {
      return this.textElement('Downloading weather forecast...')
    }

    return <Weather forecast={this.state.forecast} />
  }
}

export default Clock

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import Temperature from './Temperature.jsx'
import WeatherSymbol from './WeatherSymbol.jsx'

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<App />, div)
  ReactDOM.unmountComponentAtNode(div)
})

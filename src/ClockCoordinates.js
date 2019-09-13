class ClockCoordinates {
  constructor (time) {
    if (typeof time === 'number') {
      this.decimalHour = time
    } else if (typeof time === 'object' && time.constructor.name === 'Date') {
      this.decimalHour = time.getHours() + time.getMinutes() / 60.0
    } else {
      throw new TypeError('Expected number (decimal hours) or Date')
    }
  }

  hourDx = radius => {
    const radians = 2 * Math.PI * (this.decimalHour / 12.0)
    return Math.sin(radians) * radius
  }

  hourDy = radius => {
    const radians = 2 * Math.PI * (this.decimalHour / 12.0)
    return -Math.cos(radians) * radius
  }
}

export default ClockCoordinates

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

  symbolDx = (radius, size) => {
    const radians = 2 * Math.PI * (this.decimalHour / 12.0)
    return Math.sin(radians) * radius - (size - 1) / 2
  }

  symbolDy = (radius, size) => {
    const radians = 2 * Math.PI * (this.decimalHour / 12.0)
    return -Math.cos(radians) * radius - (size - 1) / 2
  }

  isNight = () => {
    // FIXME: Actually compute this based on latitude and longitude?
    return this.decimalHour < 7 || this.decimalHour > 20
  }
}

export default ClockCoordinates

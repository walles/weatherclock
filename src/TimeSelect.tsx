import React from 'react'
import PropTypes from 'prop-types'
import CSS from 'csstype'

import NativeSelect from '@material-ui/core/NativeSelect'

type TimeSelectProps = {
  value: string
  onSetStartTime: (startTime: NamedStartTime) => void
}

export class NamedStartTime {
  private _startTime: Date
  private _name: string
  private _isNow: boolean

  constructor (daysFromNow: number) {
    if (daysFromNow === 0) {
      this._startTime = new Date()
      this._name = 'Now'
      this._isNow = true
      return
    }

    this._isNow = false

    let otherDay = new Date()
    otherDay.setDate(otherDay.getDate() + 1 /* days */)
    otherDay.setHours(7)
    otherDay.setMinutes(0)
    otherDay.setSeconds(0)
    otherDay.setMilliseconds(0)
    this._startTime = otherDay

    if (daysFromNow === 1) {
      this._name = 'Tomorrow'
      return
    }

    this._name = otherDay.toLocaleDateString(navigator.language, {
      weekday: 'long'
    })
  }

  get name (): string {
    return this._name
  }

  get startTime (): Date {
    return this._startTime
  }

  get isNow (): boolean {
    return this._isNow
  }
}

class TimeSelect extends React.Component<TimeSelectProps, {}> {
  static propTypes = {
    onSetStartTime: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired
  }

  namedStartTimes: NamedStartTime[] = [
    new NamedStartTime(0),
    new NamedStartTime(1),
    new NamedStartTime(2)
  ]

  render = () => {
    const topRight: CSS.Properties = {
      position: 'absolute',
      right: '0px',
      top: '0px'
    }

    // Inspired by: https://material-ui.com/components/selects/#native-select
    return (
      <NativeSelect
        style={topRight}
        value={this.props.value}
        onChange={this.onChange}
      >
        <option value={this.namedStartTimes[0].name}>
          {this.namedStartTimes[0].name}
        </option>
        <option value={this.namedStartTimes[1].name}>
          {this.namedStartTimes[1].name}
        </option>
        <option value={this.namedStartTimes[2].name}>
          {this.namedStartTimes[2].name}
        </option>
      </NativeSelect>
    )
  }

  onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.props.onSetStartTime(
      this.namedStartTimes[parseInt(event.target.value)]
    )
  }
}

export default TimeSelect

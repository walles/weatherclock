import React from 'react'
import PropTypes from 'prop-types'
import CSS from 'csstype'

import NativeSelect from '@material-ui/core/NativeSelect'

type TimeSelectProps = {
  value: string
  onSetStartTime: (startTime: NamedStartTime) => void
}

interface NamedStartTime {
  readonly name: string
  readonly startTime: Date
}

class Now implements NamedStartTime {
  get name (): string {
    return 'Now'
  }

  get startTime (): Date {
    return new Date()
  }
}

class InDaysFromNow implements NamedStartTime {
  private _daysFromNow: number
  constructor (daysFromNow: number) {
    this._daysFromNow = daysFromNow
  }

  get name (): string {
    if (this._daysFromNow === 1) {
      return 'Tomorrow'
    }

    const when = this.startTime
    return when.toLocaleDateString(navigator.language, { weekday: 'long' })
  }

  get startTime (): Date {
    let otherDay = new Date()
    otherDay.setDate(otherDay.getDate() + 1 /* days */)
    otherDay.setHours(7)
    otherDay.setMinutes(0)
    otherDay.setSeconds(0)
    otherDay.setMilliseconds(0)
    return otherDay
  }
}

class TimeSelect extends React.Component<TimeSelectProps, {}> {
  static propTypes = {
    onSetStartTime: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired
  }

  namedStartTimes: NamedStartTime[] = [
    new Now(),
    new InDaysFromNow(1),
    new InDaysFromNow(2)
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
        <option value={'0'}>namedStartTimes[0].name</option>
        <option value={'1'}>namedStartTimes[1].name</option>
        <option value={'2'}>namedStartTimes[2].name</option>
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

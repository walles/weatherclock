import React from 'react'
import PropTypes from 'prop-types'
import CSS from 'csstype'

import NativeSelect from '@material-ui/core/NativeSelect'

type TimeSelectProps = {
  value: string
  onSetTimespan: (timespan: string) => void
}

class TimeSelect extends React.Component<TimeSelectProps, {}> {
  static propTypes = {
    onSetTimespan: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired
  }

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
        <option value={'now'}>Now</option>
        <option value={'tomorrow'}>Tomorrow</option>
      </NativeSelect>
    )
  }

  onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.props.onSetTimespan(event.target.value)
  }
}

export default TimeSelect

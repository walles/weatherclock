import React from 'react'
import PropTypes from 'prop-types'

import NativeSelect from '@material-ui/core/NativeSelect'

class TimeSelect extends React.Component {
  render = () => {
    // Inspired by: https://material-ui.com/components/selects/#native-select
    return (
      <NativeSelect value={this.props.value} onChange={this.onChange}>
        <option value={'now'}>Now</option>
        <option value={'tomorrow'}>Tomorrow</option>
      </NativeSelect>
    )
  }

  onChange = event => {
    this.props.onSetTimespan(event.target.value)
  }
}

TimeSelect.propTypes = {
  onSetTimespan: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
}

export default TimeSelect

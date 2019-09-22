import React from 'react'
import PropTypes from 'prop-types'

import NativeSelect from '@material-ui/core/NativeSelect'

class TimeSelect extends React.Component {
  render = () => {
    const topRight = { position: 'absolute', right: '0px', top: '0px' }

    // Inspired by: https://material-ui.com/components/selects/#native-select
    return (
      <NativeSelect style={topRight} value={this.props.value} onChange={this.onChange}>
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

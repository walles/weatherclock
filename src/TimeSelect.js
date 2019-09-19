import React from 'react'
import PropTypes from 'prop-types'

import NativeSelect from '@material-ui/core/NativeSelect'

class TimeSelect extends React.Component {
  render = () => {
    // Inspired by: https://material-ui.com/components/selects/#native-select
    return (
      <NativeSelect value={'now'}>
        <option value={'now'}>Now</option>
        <option value={'tomorrow'}>Tomorrow</option>
      </NativeSelect>
    )
  }
}

TimeSelect.propTypes = {
  onSelect: PropTypes.func.isRequired
}

export default TimeSelect

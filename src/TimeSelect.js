import React from 'react'
import PropTypes from 'prop-types'

import NativeSelect from '@material-ui/core/NativeSelect'

class TimeSelect extends React.Component {
  render = () => {
    const topRight = { position: 'absolute', right: '0px', top: '0px' }

    // Inspired by: https://material-ui.com/components/selects/#native-select
    return (
      <NativeSelect style={topRight} value={'now'}>
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

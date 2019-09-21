import React from 'react'
import PropTypes from 'prop-types'

import NativeSelect from '@material-ui/core/NativeSelect'

class TimeSelect extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      value: 'now'
    }
  }

  render = () => {
    const topRight = { position: 'absolute', right: '0px', top: '0px' }

    // Inspired by: https://material-ui.com/components/selects/#native-select
    return (
      <NativeSelect style={topRight} value={this.state.value} onChange={this.onChange}>
        <option value={'now'}>Now</option>
        <option value={'tomorrow'}>Tomorrow</option>
      </NativeSelect>
    )
  }

  onChange = event => {
    this.setState({ value: event.target.value })

    // FIXME: Report to this.props.onSelect!
  }
}

TimeSelect.propTypes = {
  onSelect: PropTypes.func.isRequired
}

export default TimeSelect

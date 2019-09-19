import React from 'react'
import PropTypes from 'prop-types'

class TimeSelect extends React.Component {
  render = () => {
    // FIXME: Do a Simple Select here:
    // https://material-ui.com/components/selects/#simple-select
    return <p>Imagine a dropdown here</p>
  }
}

TimeSelect.propTypes = {
  onSelect: PropTypes.func.isRequired
}

export default TimeSelect

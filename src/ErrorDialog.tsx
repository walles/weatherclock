import React from 'react'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'

interface ErrorProps {
  title: string
  reload: () => void
}

class ErrorDialog extends React.Component<ErrorProps> {
  render = () => {
    // Inspired by: https://material-ui.com/components/dialogs/#alerts
    return (
      <Dialog
        open
        onClose={this.props.reload}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{this.props.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{this.props.children}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.reload} color='primary' autoFocus>
            Retry
          </Button>
          {/* FIXME: Add button for reporting an issue? */}
        </DialogActions>
      </Dialog>
    )
  }
}

export default ErrorDialog

import React from 'react';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

interface ErrorProps {
  title: string;
  reload: () => void;
  children?: React.ReactNode;
}

class ErrorDialog extends React.Component<ErrorProps> {
  render() {
    const { title, reload, children } = this.props;

    // Inspired by: https://material-ui.com/components/dialogs/#alerts
    return (
      <Dialog
        open
        onClose={reload}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{children}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={reload} color="primary" autoFocus>
            Retry
          </Button>
          {/* FIXME: Add button for reporting an issue? */}
        </DialogActions>
      </Dialog>
    );
  }
}

// Accept the lint warning for missing defaultProps for children, as this is a TypeScript class component and children is optional.

export default ErrorDialog;

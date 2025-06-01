import React from 'react';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

interface ErrorProps {
  title: string;
  reload: () => void;
  children?: React.ReactNode;
}

function ErrorDialog({ title, reload, children }: ErrorProps) {
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

export default ErrorDialog;

import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (toast: Toast) => void;
}

export const ToastContext = React.createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);

  const toastSeverityRank = (type: ToastType): number => {
    if (type === 'error') {
      return 3;
    }
    if (type === 'warning') {
      return 2;
    }
    if (type === 'info' || type === 'success') {
      return 1;
    }
    console.warn('Unknown toast type:', type);
    return 99;
  };

  const showToast = (newToast: Toast) => {
    console.log('Toast requested:', newToast);
    if (toast && toast.message === newToast.message && toast.type === newToast.type && open) {
      // Prevent infinite update loop if the same toast is requested while open
      return;
    }

    if (open && toast) {
      const currentRank = toastSeverityRank(toast.type);
      const newRank = toastSeverityRank(newToast.type);
      if (newRank < currentRank) {
        console.log('Ignored toast (lower severity):', newToast, 'Current toast:', toast);
        return;
      }
    }
    setToast(newToast);
    setOpen(true);
  };

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={handleClose}
          severity={toast?.type || 'info'}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {toast?.message}
        </MuiAlert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

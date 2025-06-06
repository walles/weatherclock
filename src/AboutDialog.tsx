import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>About the Weather Clock</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Weather forecast from{' '}
          <Link href="https://www.yr.no/" target="_blank" rel="noopener">
            yr.no
          </Link>
          , delivered by the{' '}
          <Link href="https://met.no/English/" target="_blank" rel="noopener">
            Norwegian Meteorological Institute
          </Link>{' '}
          and the{' '}
          <Link href="https://www.nrk.no/" target="_blank" rel="noopener">
            NRK
          </Link>
          .
        </Typography>
        <Typography gutterBottom>
          Northern lights forecasts based on{' '}
          <Link
            href="https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
            target="_blank"
            rel="noopener"
          >
            NOAA's Planetary K Index forecast
          </Link>{' '}
          together with{' '}
          <Link
            href="https://hjelp.yr.no/hc/en-us/articles/4411702484754-Aurora-forecast-on-Yr"
            target="_blank"
            rel="noopener"
          >
            YR's interpretation thereof
          </Link>
          .
        </Typography>
        <Typography gutterBottom>
          <Link
            href={`https://github.com/walles/weatherclock/tree/${import.meta.env.VITE_GIT_SHA}`}
            target="_blank"
            rel="noopener"
          >
            Source code on GitHub
          </Link>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AboutDialog;

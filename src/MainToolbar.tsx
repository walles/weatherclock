import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import UpdateIcon from '@mui/icons-material/Update';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import NamedStartTime from './NamedStartTime';

interface MainToolbarProps {
  daysFromNow: number;
  onSetStartTime: (startTime: NamedStartTime) => void;
}

const MainToolbar: React.FC<MainToolbarProps> = ({ daysFromNow, onSetStartTime }) => {
  const handleMenuOpen = () => {};

  const handleTimeChange = (event: SelectChangeEvent<number>) => {
    const value = Number(event.target.value);
    onSetStartTime(new NamedStartTime(value));
  };

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 0, marginRight: 2 }}>
          WeatherClock
        </Typography>
        <Select
          value={daysFromNow}
          onChange={handleTimeChange}
          size="small"
          sx={{ minWidth: 120, marginRight: 2 }}
        >
          <MenuItem value={0}>Now</MenuItem>
          <MenuItem value={1}>Tomorrow</MenuItem>
          <MenuItem value={2}>
            {(() => {
              const day = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(
                navigator.language,
                {
                  weekday: 'long',
                },
              );
              return day.charAt(0).toUpperCase() + day.slice(1);
            })()}
          </MenuItem>
        </Select>
        <IconButton color="primary" sx={{ marginRight: 2 }}>
          <UpdateIcon />
        </IconButton>
        <IconButton color="inherit" onClick={handleMenuOpen}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default MainToolbar;

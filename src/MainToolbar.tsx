import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ReplayIcon from '@mui/icons-material/Replay';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import NamedStartTime from './NamedStartTime';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import AboutDialog from './AboutDialog';

interface MainToolbarProps {
  daysFromNow: number;
  onSetStartTime: (startTime: NamedStartTime) => void;
}

const MainToolbar: React.FC<MainToolbarProps> = ({ daysFromNow, onSetStartTime }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleAboutOpen = () => {
    setAboutOpen(true);
    handleMenuClose();
  };

  const handleAboutClose = () => {
    setAboutOpen(false);
  };

  const handleTimeChange = (event: SelectChangeEvent<number>) => {
    const value = Number(event.target.value);
    onSetStartTime(new NamedStartTime(value));
  };

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 0, marginRight: 2 }}>
          Weather Clock
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
        <Tooltip title="Update forecast">
          <IconButton
            color="primary"
            sx={{ marginRight: 2 }}
            onClick={() => onSetStartTime(new NamedStartTime(0))}
          >
            <ReplayIcon />
          </IconButton>
        </Tooltip>
        <IconButton color="inherit" onClick={handleMenuOpen}>
          <MenuIcon />
        </IconButton>
        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleAboutOpen}>About</MenuItem>
        </Menu>
        <AboutDialog open={aboutOpen} onClose={handleAboutClose} />
      </Toolbar>
    </AppBar>
  );
};

export default MainToolbar;

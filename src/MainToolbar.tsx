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
import './MainToolbar.css';

interface MainToolbarProps {
  daysFromNow: number;
  onSetStartTime: (startTime: NamedStartTime) => void;
}

export function getNotificationsEnabled(): boolean {
  const stored = localStorage.getItem('notificationsEnabled');
  if (stored === 'true') {
    return true;
  }
  return false;
}

const MainToolbar: React.FC<MainToolbarProps> = ({ daysFromNow, onSetStartTime }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(getNotificationsEnabled);

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

  const handleToggleNotifications = () => {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('notificationsEnabled', next ? 'true' : 'false');
      return next;
    });
    handleMenuClose();
  };

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar className="main-toolbar">
        <Typography variant="h6" className="main-toolbar-title">
          Weather Clock
        </Typography>
        <div className="main-toolbar-actions">
          <Tooltip title="Update forecast">
            <IconButton
              color="primary"
              className="main-toolbar-refresh"
              onClick={() => onSetStartTime(new NamedStartTime(0))}
            >
              <ReplayIcon />
            </IconButton>
          </Tooltip>
          <Select
            value={daysFromNow}
            onChange={handleTimeChange}
            size="small"
            className="main-toolbar-select"
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
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleToggleNotifications}>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                readOnly
                style={{ marginRight: 8 }}
              />
              Notifications
            </MenuItem>
            <MenuItem onClick={handleAboutOpen}>About</MenuItem>
          </Menu>
          <AboutDialog open={aboutOpen} onClose={handleAboutClose} />
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default MainToolbar;

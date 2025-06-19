import React from 'react';
import Clock from './Clock';
import NamedStartTime from './NamedStartTime';
import MainToolbar, { getNotificationsEnabled } from './MainToolbar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import './App.css';
import { ToastProvider } from './ToastContext';
import { PageVisibilityHandler } from './PageVisibilityHandler';

function AppWithTheme() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={(theme) => ({
          body: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
          },
        })}
      />
      <ToastProvider notificationsEnabled={getNotificationsEnabled()}>
        <App />
      </ToastProvider>
    </ThemeProvider>
  );
}

class App extends React.Component<{}, { startTime: NamedStartTime }> {
  constructor(props: {}) {
    super(props);
    this.state = {
      startTime: new NamedStartTime(0),
    };
  }

  componentDidMount() {
    // Attempt to lock orientation to portrait if supported and allowed
    const orientation = window.screen.orientation;
    if (orientation && (orientation as any).lock) {
      (orientation as any)
        .lock('portrait')
        .then(() => {
          console.log('Orientation lock to portrait succeeded.');
        })
        .catch((err: any) => {
          // "The operation is insecure" is commonly logged here (at least on
          // desktop), it just means the browser does not allow this operation.
          console.warn('Orientation lock to portrait failed or is not allowed.', err?.message);
        });
    } else {
      console.info('Orientation lock is not supported by this browser.');
    }
  }

  setTimeToNow = () => {
    this.setState({
      startTime: new NamedStartTime(0),
    });
  };

  handleVisibilityChange = (isVisible: boolean) => {
    console.debug(`Page visibility changed: ${isVisible}`);
    if (!isVisible) {
      return;
    }

    this.setTimeToNow();
  };

  onSetStartTime = (startTime: NamedStartTime) => {
    if (!startTime) {
      throw new Error(`Start time not set: ${startTime}`);
    }
    this.setState({
      startTime,
    });
  };

  render() {
    const { startTime } = this.state;
    return (
      <PageVisibilityHandler onChange={this.handleVisibilityChange}>
        <>
          <div className="toolbar-area">
            <MainToolbar daysFromNow={startTime.daysFromNow} onSetStartTime={this.onSetStartTime} />
          </div>
          <div className="clock-area">
            <Clock startTime={startTime} reload={this.setTimeToNow} />
          </div>
        </>
      </PageVisibilityHandler>
    );
  }
}

export default AppWithTheme;

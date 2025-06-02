import React from 'react';

import PageVisibility from 'react-page-visibility';
import Clock from './Clock';
import NamedStartTime from './NamedStartTime';
import MainToolbar from './MainToolbar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';

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
      <App />
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

  setTimeToNow = () => {
    this.setState({
      startTime: new NamedStartTime(0),
    });
  };

  handleVisibilityChange = (isVisible: boolean) => {
    console.debug(`Page visibility changed: ${isVisible}`);
    if (isVisible) {
      this.setTimeToNow();
    }
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
      <PageVisibility onChange={this.handleVisibilityChange}>
        <>
          <MainToolbar daysFromNow={startTime.daysFromNow} onSetStartTime={this.onSetStartTime} />
          <Clock startTime={startTime} reload={this.setTimeToNow} />
        </>
      </PageVisibility>
    );
  }
}

export default AppWithTheme;

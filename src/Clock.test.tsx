// Suppress 'not wrapped in act(...)' warnings from MUI TouchRipple. This is a
// known issue with MUI and React Testing Library, and does not affect test
// correctness.
//
// See: https://github.com/mui/material-ui/issues/13394 and
// https://github.com/testing-library/react-testing-library/issues/281 (Note:
// these tickets are stale/closed, but the warning may still appear in some
// setups.)
//
// Remove this if/when MUI or React Testing Library fixes the warning in future
// versions.
beforeAll(() => {
  const originalError = console.error;
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
      return;
    }
    originalError.call(console, ...args);
  });
});

afterAll(() => {
  // @ts-ignore
  console.error.mockRestore();
});

afterEach(() => {
  jest.clearAllMocks();
});

import React from 'react';
import { render, act } from '@testing-library/react';
import Clock from './Clock';
import NamedStartTime from './NamedStartTime';

describe('Clock componentDidUpdate', () => {
  it('calls download_weather if forecast is not current', () => {
    // Create a ref to access the class instance
    const ref = React.createRef<Clock>();
    const startTime = new NamedStartTime(0);
    const props = { startTime, reload: jest.fn() };
    render(<Clock ref={ref} {...props} />);

    // Access the class instance via ref
    const instance = ref.current!;

    // Mock methods
    jest.spyOn(instance, 'startGeolocationIfNeeded').mockImplementation(jest.fn());
    jest.spyOn(instance, 'forecastIsCurrent').mockReturnValue(false);
    jest.spyOn(instance, 'download_weather').mockImplementation(jest.fn());
    jest.spyOn(instance, 'auroraForecastIsCurrent').mockReturnValue(true);

    // Set state and call lifecycle in act()
    act(() => {
      instance.setState({ weatherDownloadProgress: undefined });
      instance.componentDidUpdate();
    });

    // Assert
    expect(instance.download_weather).toHaveBeenCalled();
  });
});

describe('Clock download_weather', () => {
  it('does nothing if a download is already in progress', () => {
    const ref = React.createRef<Clock>();
    const startTime = new NamedStartTime(0);
    const props = { startTime, reload: jest.fn() };
    render(<Clock ref={ref} {...props} />);

    const instance = ref.current!;

    // Set up state: position is set, but weatherDownloadProgress is set (download in progress)
    instance.setState({
      position: { latitude: 1, longitude: 2 },
      weatherDownloadProgress: <text>Downloading...</text>,
    });

    // Spy on setState and context.showToast
    const setStateSpy = jest.spyOn(instance, 'setState');
    instance.context = { showToast: jest.fn() } as any;
    const showToastSpy = jest.spyOn(instance.context, 'showToast');

    // Call download_weather directly
    instance.download_weather();

    // Should not call setState or showToast
    expect(setStateSpy).not.toHaveBeenCalled();
    expect(showToastSpy).not.toHaveBeenCalled();
  });
});

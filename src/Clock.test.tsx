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
import AuroraForecast from './AuroraForecast';

beforeAll(() => {
  // Without this the clock context roundtrip test fails with an anonymous
  // AggregateError.
  if (!(SVGElement.prototype as any).getBBox) {
    (SVGElement.prototype as any).getBBox = function () {
      return { x: 0, y: 0, width: 100, height: 20 };
    };
  }

  // Without this we big yellow warning blobs printed during testing
  if (!global.fetch) {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    ) as any;
  }
});

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
    jest.spyOn(instance, 'weatherForecastNeedsUpdating').mockReturnValue(true);
    jest.spyOn(instance, 'downloadWeatherIfNeeded').mockImplementation(jest.fn());
    jest.spyOn(instance, 'auroraForecastIsCurrent').mockReturnValue(true);

    // Set state and call lifecycle in act()
    act(() => {
      instance.setState({ weatherDownloadProgress: undefined });
      instance.componentDidUpdate();
    });

    // Assert
    expect(instance.downloadWeatherIfNeeded).toHaveBeenCalled();
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
    instance.downloadWeatherIfNeeded();

    // Should not call setState or showToast
    expect(setStateSpy).not.toHaveBeenCalled();
    expect(showToastSpy).not.toHaveBeenCalled();
  });
});

describe('Clock localStorage roundtrip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and restores all expected state', () => {
    // Subclass Clock to override side-effect methods before mount
    class TestableClock extends Clock {
      downloadWeatherIfNeeded = jest.fn();
      startGeolocationIfNeeded = jest.fn();
      bump_aurora_forecast = jest.fn();
    }

    const ref = React.createRef<TestableClock>();
    const startTime = new NamedStartTime(0);
    const props = { startTime, reload: jest.fn() };
    render(<TestableClock ref={ref} {...props} />);
    const instance = ref.current!;

    // Prepare test data
    const position = { latitude: 10, longitude: 20 };
    const positionTimestamp = new Date('2025-07-04T11:00:00Z');
    const weatherForecast = new Map([
      [
        123,
        {
          timestamp: new Date('2025-07-04T12:00:00Z'),
          symbol_code: 'clearsky_day',
          span_h: 1,
        },
      ],
    ]);
    const weatherForecastMetadata = {
      timestamp: new Date('2025-07-04T11:00:00Z'),
      latitude: 10,
      longitude: 20,
    };
    // AuroraForecast expects an array of arrays, first row is header
    const auroraForecast = new AuroraForecast([
      ['time_tag', 'kp'],
      ['2025-07-04T13:00:00', '5.00'],
    ]);
    const auroraForecastMetadata = {
      timestamp: new Date('2025-07-04T12:30:00Z'),
    };

    // Populate a fake state to persist
    instance.state = {
      startTime,
      weatherForecast,
      weatherForecastMetadata,
      position,
      positionTimestamp,
      auroraForecast,
      auroraForecastMetadata,
    };
    instance.persistToLocalStorage('roundtrip test');

    const ref2 = React.createRef<TestableClock>();
    render(<TestableClock ref={ref2} {...props} />);

    // Check restored state
    const restored = ref2.current!.state;
    expect(restored.position).toEqual(position);
    expect(restored.positionTimestamp).toEqual(positionTimestamp);
    expect(restored.weatherForecast).toEqual(weatherForecast);
    expect(restored.weatherForecastMetadata).toEqual(weatherForecastMetadata);
    expect(restored.auroraForecast).toEqual(auroraForecast);
    expect(restored.auroraForecastMetadata).toEqual(auroraForecastMetadata);
  });
});

import React, { type ReactElement } from 'react';

import './Clock.css';

import Weather from './Weather';
import Hand from './Hand';
import ErrorDialog from './ErrorDialog';
import ClockCoordinates from './ClockCoordinates';
import NamedStartTime from './NamedStartTime';
import { Forecast } from './Forecast';
import AuroraForecast from './AuroraForecast';
import { WeatherLocation, getFixedPosition, getDistanceFromLatLonInKm } from './PositionService';
import { fetchAuroraForecast } from './AuroraService';
import { downloadWeather, WeatherDownloadResult } from './WeatherService';
import { ToastContext } from './ToastContext';

const HOUR_HAND_LENGTH = 23;
const MINUTE_HAND_LENGTH = 34;

const MINUTE_MS = 60 * 1000;

/** Cache positions for this long */
const POSITION_CACHE_MS = 5 * MINUTE_MS;

const HOUR_MS = 60 * MINUTE_MS;

/** Cache weather forecasts for two hours */
const FORECAST_CACHE_MS = 2 * HOUR_MS;

/** Cache aurora forecasts for seven hours. The resolution is 3h over a couple
 * of days, so we won't win much from fetching it more often. */
const AURORA_FORECAST_CACHE_MS = 7 * HOUR_MS;

/** If we move less than this, assume forecast is still valid */
const FORECAST_CACHE_KM = 5;

type ClockProps = {
  startTime: NamedStartTime;
  reload: () => void;
};

type ClockState = {
  startTime: NamedStartTime;

  error?: ReactElement;

  position?: WeatherLocation;
  positionTimestamp?: Date;
  geoLocationProgress?: ReactElement;

  weatherForecast?: Map<number, Forecast>;
  weatherForecastMetadata?: {
    // FIXME: Rather than the current timestamp, maybe track when yr.no thinks
    // the next forecast will be available? That information is available in the
    // XML.
    timestamp: Date;
    latitude: number;
    longitude: number;
  };
  weatherDownloadProgress?: ReactElement;

  auroraForecast?: AuroraForecast;
  auroraForecastMetadata?: {
    timestamp: Date;
  };
  auroraForecastInProgress?: boolean;
};

class Clock extends React.Component<ClockProps, ClockState> {
  static contextType = ToastContext;
  context!: React.ContextType<typeof ToastContext>;

  constructor(props: ClockProps) {
    super(props);
    const { startTime } = props;
    this.state = this.getInitialState(startTime);
  }

  getInitialState(startTime: NamedStartTime) {
    if (navigator.geolocation) {
      return {
        startTime,
        progress: undefined,
        error: undefined,
      };
    }
    const { reload } = this.props;
    return {
      startTime,
      progress: undefined,
      error: (
        <ErrorDialog title="Geolocation unsupported" reload={reload}>
          Please try <a href="https://getfirefox.com">another browser</a>.
        </ErrorDialog>
      ),
    };
  }

  componentDidMount() {
    const forecastString = localStorage.getItem('forecast');
    const metadataString = localStorage.getItem('metadata');
    const positionString = localStorage.getItem('position');
    if (forecastString && metadataString && positionString) {
      // Recreate the map from our pair wise JSON representation
      const forecastArray = JSON.parse(forecastString);
      const forecast = new Map<number, Forecast>();
      forecastArray.forEach((pair: [number, Forecast]) => {
        const key = pair[0];
        const value = pair[1];
        const timestamp = new Date(value.timestamp);
        value.timestamp = timestamp;

        forecast.set(key, value);
      });

      const metadataFromJson = JSON.parse(metadataString);
      const metadata = {
        timestamp: new Date(metadataFromJson.timestamp),
        latitude: metadataFromJson.latitude,
        longitude: metadataFromJson.longitude,
      };

      const position = JSON.parse(positionString);

      console.log('Restoring data from local storage:', forecast, metadata, position);

      this.setState({
        weatherForecast: forecast,
        weatherForecastMetadata: metadata,
        position,
      });
    } else {
      console.log('No weather forecast found in local storage');
    }

    this.startGeolocationIfNeeded();
  }

  componentDidUpdate() {
    const { startTime } = this.props;
    const { startTime: stateStartTime } = this.state;
    if (startTime.startTime !== stateStartTime.startTime) {
      this.setState(this.getInitialState(startTime));
    }

    this.startGeolocationIfNeeded();

    if (!this.forecastIsCurrent()) {
      this.download_weather();
    }

    if (!this.auroraForecastIsCurrent() && !this.state.auroraForecastInProgress) {
      this.setState({ auroraForecastInProgress: true }, () => {
        this.bump_aurora_forecast();
      });
    }
  }

  /**
   * Returns true if a new geolocation request was made, false otherwise.
   */
  startGeolocationIfNeeded = (): void => {
    if (this.state.geoLocationProgress) {
      // Already geolocating, never mind
      return;
    }

    if (this.state.error) {
      // Something has gone wrong, avoid making things worse
      return;
    }

    if (this.state.position && this.state.positionTimestamp) {
      const position_age_ms = Date.now() - this.state.positionTimestamp.getTime();

      if (position_age_ms < POSITION_CACHE_MS) {
        // Already know where we are, never mind
        const position_age_s = position_age_ms / 1000;
        console.debug(`Retaining cached position of ${position_age_s}s age`);
        return;
      }
    }

    const fixedPosition = getFixedPosition();
    if (fixedPosition != null) {
      this.setState({
        geoLocationProgress: undefined,
        position: fixedPosition,
        positionTimestamp: new Date(),
      });
      return;
    }

    this.context.showToast({ message: 'Requesting geolocation…', type: 'info' });
    console.log('Geolocating position...');
    this.setState({
      geoLocationProgress: <text className="progress">Locating phone...</text>,
    });
    navigator.geolocation.getCurrentPosition(this.setPosition, this.geoError);
  };

  setPosition = (position: GeolocationPosition) => {
    const weatherLocation: WeatherLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    console.log(
      `Got position: latitude=${weatherLocation.latitude}, longitude=${weatherLocation.longitude}`,
    );
    this.context.showToast({ message: 'Geolocation succeeded', type: 'success' });
    this.setState({
      geoLocationProgress: undefined,
      position: weatherLocation,
      positionTimestamp: new Date(),
    });
  };

  /**
   * Relates to the weather forecast, not any other forecast.
   */
  forecastIsCurrent = () => {
    if (!this.state.weatherForecast) {
      // No forecast at all, that's not current
      return false;
    }

    const metadata = this.state.weatherForecastMetadata!;
    const ageMs = Date.now() - metadata.timestamp.getTime();
    if (ageMs > FORECAST_CACHE_MS) {
      // Forecast too old, that's not current
      return false;
    }

    if (!this.state.position) {
      // No position, can't check distance
      return false;
    }

    const kmDistance = getDistanceFromLatLonInKm(
      metadata.latitude,
      metadata.longitude,
      this.state.position.latitude,
      this.state.position.longitude,
    );
    if (kmDistance > FORECAST_CACHE_KM) {
      // Forecast from too far away, that's not current
      return false;
    }

    const kmDistanceRounded = Math.round(kmDistance * 1000) / 1000;
    console.debug(
      `Weather forecast considered current: ${ageMs / 1000.0}s old and ${kmDistanceRounded}km away`,
    );

    return true;
  };

  auroraForecastIsCurrent = () => {
    if (!this.state.auroraForecast) {
      // No forecast at all, that's not current
      return false;
    }

    const metadata = this.state.auroraForecastMetadata!;
    const ageMs = Date.now() - metadata.timestamp.getTime();
    if (ageMs > AURORA_FORECAST_CACHE_MS) {
      // Forecast too old, that's not current
      return false;
    }

    console.debug(`Aurora forecast considered current: ${ageMs / 1000.0}s old`);
    return true;
  };

  download_weather = () => {
    if (!this.state.position) {
      return;
    }
    if (this.state.weatherDownloadProgress) {
      // Already in progress, never mind
      return;
    }

    this.context.showToast({ message: 'Requesting weather data…', type: 'info' });
    this.setState({
      weatherDownloadProgress: <text className="progress">Downloading weather...</text>,
    });

    downloadWeather(this.state.position)
      .then(({ forecast, metadata }: WeatherDownloadResult) => {
        this.context.showToast({ message: 'Weather data download succeeded', type: 'success' });
        console.log('Writing data to local storage:', forecast, metadata, this.state.position);
        localStorage.setItem('forecast', JSON.stringify(Array.from(forecast)));
        localStorage.setItem('metadata', JSON.stringify(metadata));
        localStorage.setItem('position', JSON.stringify(this.state.position));
        this.setState({
          weatherForecast: forecast,
          weatherForecastMetadata: metadata,
        });
      })
      .catch((error) => {
        this.context.showToast({ message: 'Weather data download failed', type: 'error' });
        console.error(error);
        this.setState({
          error: (
            <ErrorDialog title="Downloading weather failed" reload={this.props.reload}>
              {error.message}
            </ErrorDialog>
          ),
        });
      });
  };

  bump_aurora_forecast = () => {
    this.context.showToast({ message: 'Requesting aurora forecast…', type: 'info' });
    fetchAuroraForecast()
      .then((forecast) => {
        this.context.showToast({ message: 'Aurora forecast download succeeded', type: 'success' });
        this.setState({
          auroraForecast: forecast,
          auroraForecastMetadata: {
            timestamp: new Date(),
          },
        });
      })
      .catch((error) => {
        this.context.showToast({ message: 'Aurora forecast download failed', type: 'error' });
        console.warn(error);
      })
      .finally(() => {
        this.setState({ auroraForecastInProgress: false });
      });
  };

  geoError = (error: GeolocationPositionError) => {
    console.log('Geolocating position failed');
    this.context.showToast({ message: 'Geolocation failed', type: 'error' });
    this.setState({
      // FIXME: Add a report-problem link?
      // FIXME: Make the error message text clickable and link it to a Google search
      // Reload trickery from: https://stackoverflow.com/a/10840058/473672

      // Note that at least on desktop Firefox 69.0 for Mac, this JS-triggered reload
      // won't re-ask the positioning question, but if the user manually reloads that
      // will re-ask the question.
      error: (
        <ErrorDialog title={error.message} reload={() => window.location.reload()}>
          If you are asked whether to allow the Weather Clock to know your current location, please
          say &dquot;yes&dquot;.
        </ErrorDialog>
      ),
    });
  };

  renderHands = () => {
    const nowCoords = new ClockCoordinates(this.state.startTime.startTime);

    // FIXME: This doubles the center circle shadow, maybe draw
    // the center circle once here to get us only one of those?
    return (
      <>
        <Hand
          width={2.5}
          dx={nowCoords.hourDx(HOUR_HAND_LENGTH)}
          dy={nowCoords.hourDy(HOUR_HAND_LENGTH)}
        />
        <Hand
          width={2}
          dx={nowCoords.minuteDx(MINUTE_HAND_LENGTH)}
          dy={nowCoords.minuteDy(MINUTE_HAND_LENGTH)}
        />
      </>
    );
  };

  getClockContents = () => {
    if (this.state.weatherForecast) {
      if (this.props.startTime.daysFromNow !== 0) {
        return (
          <>
            <Weather
              weatherForecast={this.state.weatherForecast}
              auroraForecast={this.state.auroraForecast}
              latitude={this.state.position!.latitude}
              now={this.state.startTime.startTime}
            />
            <text className="tomorrow">{this.state.startTime.name}</text>
          </>
        );
      }
      // Now
      return (
        <>
          <Weather
            weatherForecast={this.state.weatherForecast}
            auroraForecast={this.state.auroraForecast}
            latitude={this.state.position!.latitude}
            now={this.state.startTime.startTime}
          />
          {this.renderHands()}
        </>
      );
    }

    if (this.state.error) {
      // These hands will show up behind the error dialog
      return this.renderHands();
    }

    if (this.state.geoLocationProgress) {
      return this.state.geoLocationProgress;
    }

    if (this.state.weatherDownloadProgress) {
      return this.state.weatherDownloadProgress;
    }

    // Most likely the initial state
    return null;
  };

  render() {
    return (
      <>
        <svg
          className="clockSvg"
          id="weatherclock"
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="-50 -50 100 100"
        >
          <image x="-50" y="-50" width="100" height="100" xlinkHref="clock-frame.webp" />

          {this.getClockContents()}
        </svg>
        {this.state.error}
      </>
    );
  }
}

export default Clock;

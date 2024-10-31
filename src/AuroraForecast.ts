/**
 * One forecasted KP value.
 */
type Datapoint = {
  timestamp: Date;
  kpValue: number;
};

export class AuroraForecast {
  data: Datapoint[];

  /**
   * The incoming data is a JSON array.
   *
   * The first element contains header information for the other elements:
   * ["time_tag","kp","observed","noaa_scale"]
   *
   * The other elements are the forecasted KP values. Timestamps are in UTC:
   * ["2024-10-24 00:00:00","3.00","observed",null]
   */
  constructor(data: any) {
    let forecast = [];

    for (let i = 1; i < data.length; i++) {
      const [timestamp, kpValue] = data[i];
      forecast.push({
        timestamp: new Date(`${timestamp}Z`),
        kpValue: parseFloat(kpValue),
      });
    }

    this.data = forecast;

    console.log("AuroraForecast created with", this.data.length, "datapoints");
    console.log(forecast);
  }

  /**
   * Return the forecasted KP value for the given time. If we don't have a value
   * for a precise time, we interpolate between the two closest values.
   */
  getKpValue(time: Date): number {
    if (this.data.length === 0) {
      return 0;
    }

    if (time < this.data[0].timestamp) {
      return this.data[0].kpValue;
    }

    if (time > this.data[this.data.length - 1].timestamp) {
      return this.data[this.data.length - 1].kpValue;
    }

    for (let i = 0; i < this.data.length - 1; i++) {
      if (time >= this.data[i].timestamp && time < this.data[i + 1].timestamp) {
        const timeDiff = this.data[i + 1].timestamp.getTime() - this.data[i].timestamp.getTime();
        const timeDiffNow = time.getTime() - this.data[i].timestamp.getTime();
        const kpDiff = this.data[i + 1].kpValue - this.data[i].kpValue;
        const kpNow = this.data[i].kpValue + (kpDiff * timeDiffNow) / timeDiff;
        return kpNow;
      }
    }

    return 0;
  }

  /**
   * Return the forecasted KP value for the given time, adjusted for the
   * latitude according to the table on this page:
   * https://hjelp.yr.no/hc/en-us/articles/4411702484754-Aurora-forecast-on-Yr.
   */
  getAdjustedKpValue(time: Date, latitude: number): number {
    let adjustment: number;
    if (latitude >= 75) {
      adjustment = 1;
    } else if (latitude >= 66) {
      adjustment = 0;
    } else if (latitude >= 64.5) {
      adjustment = 1;
    } else if (latitude >= 62.5) {
      adjustment = 2;
    } else if (latitude >= 60.4) {
      adjustment = 3;
    } else if (latitude >= 58.3) {
      adjustment = 4;
    } else if (latitude >= 56.3) {
      adjustment = 5;
    } else if (latitude >= 54.2) {
      adjustment = 6;
    } else if (latitude >= 52.2) {
      adjustment = 7;
    } else if (latitude >= 50.1) {
      adjustment = 8;
    } else if (latitude >= 48) {
      adjustment = 9;
    } else {
      // Not part of the table, use some big value
      adjustment = 10;
    }

    return this.getKpValue(time) - adjustment;
  }

  /**
   * Return an aurora symbol based on the forecasted KP value.
   *
   * Based on the second table on this page:
   * https://hjelp.yr.no/hc/en-us/articles/4411702484754-Aurora-forecast-on-Yr.
   */
  getAuroraSymbol(time: Date, latitude: number): string | null {
    const kpValue = this.getAdjustedKpValue(time, latitude);

    if (kpValue >= 4) {
      return "../../aurora-high";
    }

    if (kpValue >= 1) {
      return "../../aurora-low";
    }

    return null;
  }
}

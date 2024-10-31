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
}

class ClockCoordinates {
  decimalHour: number;

  constructor(time: number | Date) {
    if (typeof time === "number") {
      this.decimalHour = time;
    } else if (typeof time === "object" && time.constructor.name === "Date") {
      this.decimalHour = time.getHours() + time.getMinutes() / 60.0 + time.getSeconds() / 3600.0;
    } else {
      throw new TypeError("Expected number (decimal hours) or Date");
    }
  }

  hourDx = (radius: number) => {
    const radians = 2 * Math.PI * (this.decimalHour / 12.0);
    return Math.sin(radians) * radius;
  };

  hourDy = (radius: number) => {
    const radians = 2 * Math.PI * (this.decimalHour / 12.0);
    return -Math.cos(radians) * radius;
  };

  minuteDx = (radius: number) => {
    const radians = 2 * Math.PI * (this.decimalHour % 12.0);
    return Math.sin(radians) * radius;
  };

  minuteDy = (radius: number) => {
    const radians = 2 * Math.PI * (this.decimalHour % 12.0);
    return -Math.cos(radians) * radius;
  };

  symbolDx = (radius: number, size: number) => {
    const radians = 2 * Math.PI * (this.decimalHour / 12.0);
    return Math.sin(radians) * radius - (size - 1) / 2;
  };

  symbolDy = (radius: number, size: number) => {
    const radians = 2 * Math.PI * (this.decimalHour / 12.0);
    return -Math.cos(radians) * radius - (size - 1) / 2;
  };

  _degreesDistance = (d0: number, d1: number) => {
    const distance = Math.abs(d1 - d0);
    if (distance > 180) {
      return 360 - distance;
    }
    return distance;
  };

  /**
   * Return an array of directions (0-360 degrees). The first direction
   * is the one that is most clear of the clock hands, second one is second
   * most clear and so on.
   */
  rankFreeDirections = () => {
    const degreeCandidates = [0, 90, 180, 270];
    const minuteDegrees = 360 * (this.decimalHour % 1.0);
    const hourDegrees = 360 * ((this.decimalHour % 12.0) / 12.0);

    let degreesToRank: Map<number, number> = new Map();
    degreeCandidates.forEach((degrees) => {
      const minDistance = this._degreesDistance(degrees, minuteDegrees);
      const hourDistance = this._degreesDistance(degrees, hourDegrees);
      degreesToRank.set(degrees, Math.min(minDistance, hourDistance));
    });

    degreeCandidates.sort((degree1, degree2) => {
      const rank1 = degreesToRank.get(degree1)!;
      const rank2 = degreesToRank.get(degree2)!;
      if (rank1 < rank2) {
        return 1;
      }
      if (rank1 > rank2) {
        return -1;
      }
      return 0;
    });

    return degreeCandidates;
  };
}

export default ClockCoordinates;

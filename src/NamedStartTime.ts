// From: https://stackoverflow.com/a/53930826/473672
function capitalizeFirstLetter(s: string) {
  const firstCodeUnit = s[0];

  if (firstCodeUnit < '\uD800' || firstCodeUnit > '\uDFFF') {
    return s[0].toUpperCase() + s.slice(1);
  }

  return s.slice(0, 2).toUpperCase() + s.slice(2);
}

class NamedStartTime {
  private _startTime: Date;

  private _name: string;

  private _daysFromNow: number;

  constructor(daysFromNow: number) {
    this._daysFromNow = daysFromNow;

    if (daysFromNow === 0) {
      this._startTime = new Date();
      this._name = 'Now';
      return;
    }

    const otherDay = new Date();
    otherDay.setDate(otherDay.getDate() + daysFromNow /* days */);
    otherDay.setHours(7);
    otherDay.setMinutes(0);
    otherDay.setSeconds(0);
    otherDay.setMilliseconds(0);
    this._startTime = otherDay;

    if (daysFromNow === 1) {
      this._name = 'Tomorrow';
      return;
    }

    const dayname = otherDay.toLocaleDateString(navigator.language, {
      weekday: 'long',
    });

    this._name = capitalizeFirstLetter(dayname);
  }

  get name(): string {
    return this._name;
  }

  get startTime(): Date {
    return this._startTime;
  }

  get daysFromNow(): number {
    return this._daysFromNow;
  }
}

export default NamedStartTime;

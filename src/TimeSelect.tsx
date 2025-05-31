import React from 'react';
import PropTypes from 'prop-types';

type TimeSelectProps = {
  daysFromNow: number; // 0, 1 or 2 for how many days out we want
  onSetStartTime: (startTime: NamedStartTime) => void;
};

// From: https://stackoverflow.com/a/53930826/473672
function capitalizeFirstLetter(s: string) {
  const firstCodeUnit = s[0];

  if (firstCodeUnit < '\uD800' || firstCodeUnit > '\uDFFF') {
    return s[0].toUpperCase() + s.slice(1);
  }

  return s.slice(0, 2).toUpperCase() + s.slice(2);
}

export class NamedStartTime {
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

    let otherDay = new Date();
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

class TimeSelect extends React.Component<TimeSelectProps, {}> {
  static propTypes = {
    onSetStartTime: PropTypes.func.isRequired,
    daysFromNow: PropTypes.number.isRequired,
  };

  render = () => {
    // Populate select
    let options = [];
    for (let i = 0; i < 3; i++) {
      const namedStartTime = new NamedStartTime(i);
      const name = namedStartTime.name;
      options.push(
        <option key={name} value={String(i)}>
          {name}
        </option>,
      );
    }

    // Inspired by: https://material-ui.com/components/selects/#native-select
    return (
      <select className="timeSelect" value={this.props.daysFromNow} onChange={this.onChange}>
        {options}
      </select>
    );
  };

  onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.props.onSetStartTime(new NamedStartTime(parseInt(event.target.value)));
  };
}

export default TimeSelect;

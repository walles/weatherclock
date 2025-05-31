import React from 'react';

import './Hand.css';

interface HandProps {
  width: number;
  dx: number;
  dy: number;
}

function Hand({ width, dx, dy }: HandProps) {
  // FIXME: Hands should protrude 2 units in the wrong direction as well
  return (
    <>
      <line className="hand shadow" x1="0" y1="0" x2={dx} y2={dy} strokeWidth={width} />
      <circle className="shadow" cx="0" cy="0" r="2" />

      <line className="hand" x1="0" y1="0" x2={dx} y2={dy} strokeWidth={width} />
      <circle cx="0" cy="0" r="2" />
    </>
  );
}

export default Hand;

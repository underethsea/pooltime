import React from "react";
import Countdown from "react-countdown";

type Prizes = {
  drawPeriodSeconds: number;
  firstDrawTime: number;
};

type PendingPrizeData = {
  [chain: string]: {
    prizes: Prizes;
  };
};

type Props = {
  pendingPrize: PendingPrizeData;
  chainName: string;
  shortForm?: boolean;
};

const DrawCountdown = ({ pendingPrize, chainName, shortForm }: Props) => {
  const prizeData = pendingPrize?.[chainName]?.prizes;
  if (!prizeData) return null;

  const { drawPeriodSeconds, firstDrawTime } = prizeData;
  const now = Math.floor(Date.now() / 1000);
  const secondsSinceFirst = now - firstDrawTime;

  const periodsPassed = Math.ceil(secondsSinceFirst / drawPeriodSeconds);
  const nextDrawTimeUnix = firstDrawTime + periodsPassed * drawPeriodSeconds;

  const date = new Date(nextDrawTimeUnix * 1000);

  const fullRenderer = ({
    days,
    hours,
    minutes,
    seconds,
  }: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }) => (
    <div className="draw-countdown-container">
      {days > 0 && <div className="count-segment">{days}d</div>}
      {hours > 0 && <div className="count-segment">{hours}h</div>}
      <div className="count-segment">{minutes}m</div>
      <div className="count-segment">{seconds}s</div>
    </div>
  );

  const shortRenderer = ({
    days,
    hours,
    minutes,
  }: {
    days: number;
    hours: number;
    minutes: number;
    completed: boolean;
  }) => {
    return (
      <div className="draw-countdown-container">
        {days > 2 ? (
          <div className="count-segment">{days}d</div>
        ) : days >= 1 ? (
          <>
            <div className="count-segment">{days}d</div>
            <div className="count-segment">{hours}h</div>
          </>
        ) : (
          <div className="count-segment">
            {hours > 0 ? `${hours}h` : `${minutes}m`}
          </div>
        )}
      </div>
    );
  };

  return (
    <Countdown
      key={date.getTime()}
      date={date}
      renderer={shortForm ? shortRenderer : fullRenderer}
      zeroPadTime={2}
    />
  );
};

export default DrawCountdown;

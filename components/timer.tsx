import React from "react";
import Countdown from "react-countdown";

const Completionist = ({ openAward }: { openAward: () => void }) => (
  <span className="open-wallet" onClick={() => openAward()}>
    &nbsp; Draw is being awarded
  </span>
);

const getTargetDate = (unixTimestamp: number) => {
  return new Date(unixTimestamp * 1000);
};

const Timer = ({ seconds, onEnd, shortForm, openAward }: {
  seconds: number,
  onEnd: () => void,
  shortForm?: boolean,
  openAward: () => void
}) => {
  const date = seconds > 0 ? getTargetDate(seconds) : new Date(0);

  const renderer = ({ days, hours, minutes, seconds, completed }: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }) => {
    if (completed) {
      // Here you could also directly call onEnd if not using a Completionist component
      return <Completionist openAward={openAward} />;
    } else {
      return (
        <div className="top-margin-10">
          <span>
            {days > 0 && <><div className="time-number">{days}d</div>&nbsp;</>}
            {hours > 0 && <>
            &nbsp;<div className="time-number">{hours}h</div>&nbsp;</>}
            <div className="time-number">{minutes}m</div>&nbsp;
            <div className="time-number">{seconds}s</div>
          </span>
        </div>
      );
    }
  };

  const shortFormatRenderer = ({ days, hours, minutes, completed }: {
    days: number;
    hours: number;
    minutes: number;
    completed: boolean;
  }) => {
    if (completed) {
      // Handling completion in short format
      return <Completionist openAward={openAward} />;
    }

    // Other formatting logic remains the same
    if (days > 2) {
      return <div><span>{days}d</span></div>;
    } else if (days >= 1) {
      return <div><span>{days}d&nbsp;{hours}h</span></div>;
    } else {
      return (
        <div>
          <span>
            {days > 0 && <>{days}d&nbsp;</>}
            {hours > 0 ? hours + 'h' : minutes + 'm'}
          </span>
        </div>
      );
    }
  };

  return (
    <Countdown
      key={date.getTime()}
      date={date}
      renderer={shortForm ? shortFormatRenderer : renderer}
      onComplete={onEnd} // This triggers the onEnd callback when countdown ends
      zeroPadTime={2}
    />
  );
};

export default Timer;

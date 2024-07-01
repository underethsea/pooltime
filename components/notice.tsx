import { useState } from 'react';

const Notice = () => {
  const [isNoticeVisible, setIsNoticeVisible] = useState(true); // State for controlling the visibility of the notice

  const handleNoticeDismiss = () => {
    setIsNoticeVisible(false);
  };

  if (!isNoticeVisible) {
    return null; // If the notice is not visible, render nothing
  }

  return (
    <div className="notice-bar">
      <span>Get ready to have fun! Click here.</span>
      <button className="dismiss-button" onClick={handleNoticeDismiss}>
        X
      </button>
      <style jsx>{`
        .notice-bar {
          background-color: #f8f8f8; // Adjust the background color to your desired color
          color: #333; // Adjust the text color to your desired color
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .notice-bar span {
          margin-right: 10px;
        }

        .dismiss-button {
          border: none;
          background: none;
          color: #333; // Adjust the text color to your desired color
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Notice;

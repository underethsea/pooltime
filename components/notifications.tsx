import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  content: JSX.Element;
  start?: string; // ISO date string, optional
  end?: string; // ISO date string, optional
}

const messages: Message[] = [
  {
    id: "message1",
    content: <div key="message1">Notice 1: This is an important message.</div>,
    start: "2023-01-01T00:00:00Z", // Example start date
    end: "2023-12-31T23:59:59Z" // Example end date
  },
  {
    id: "message2",
    content: <div key="message2">Notice 2: Please pay attention to this announcement.</div>,
    // This message has no start or end, so it's always active
  },
  {
    id: "message3",
    content: <div key="message3">Notice 3: Dont forget to check out our latest updates!</div>,
    start: "2023-01-01T00:00:00Z",
    // This message has no end, so it remains active indefinitely after the start
  },
  // Add more messages as needed
];

const Notifications: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);

  useEffect(() => {
    const filterMessages = (): void => {
      const now = new Date();
      const filteredMessages = messages.filter(message => {
        const startTime = message.start ? new Date(message.start) : null;
        const endTime = message.end ? new Date(message.end) : null;
        return (!startTime || now >= startTime) && (!endTime || now <= endTime);
      });
      setActiveMessages(filteredMessages);
    };

    filterMessages(); // Initial filter on mount

    // Change the current message every 5 seconds
    const interval = setInterval(() => {
      setCurrentMessageIndex(prevIndex => (prevIndex + 1) % activeMessages.length);
    }, 5000);

    // Re-filter messages every minute to ensure timely updates
    const minuteInterval = setInterval(filterMessages, 60000);

    // Cleanup intervals on unmount
    return () => {
      clearInterval(interval);
      clearInterval(minuteInterval);
    };
  }, [activeMessages.length]); // Dependency ensures re-evaluation when active messages update

  return (
    <div className="div-text">
      {activeMessages.length > 0 ? activeMessages[currentMessageIndex % activeMessages.length].content : <div>No active notices</div>}
    </div>
  );
};

export default Notifications;

import React, { useState, useEffect } from 'react';

const Stowing = () => {
  const totalRows = 120;
  const maxPackages = 550;
  const minInterval = 6000; // 6 seconds in milliseconds
  const maxInterval = 12000; // 12 seconds in milliseconds

  const [rows, setRows] = useState(Array(totalRows).fill(0));
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const intervalIds = rows.map((_, index) => {
      const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
      return setInterval(() => {
        setRows(prevRows => {
          const newRows = [...prevRows];
          if (newRows[index] < maxPackages) {
            newRows[index] += Math.floor(Math.random() * 10) + 1; // Increment by 1 to 10 packages
            if (newRows[index] > maxPackages) {
              newRows[index] = maxPackages; // Cap at maxPackages
            }
          }
          return newRows;
        });
      }, interval);
    });

    return () => {
      intervalIds.forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000); // 1 second interval

    return () => clearInterval(timerInterval);
  }, []);

  return (
    <div>
      <h1>Stowing</h1>
      <div>
        {rows.map((packages, index) => (
          <div key={index}>
            Row {index + 1}: {packages} packages
          </div>
        ))}
      </div>
      <h2>Elapsed Time: {elapsedTime} seconds</h2>
    </div>
  );
};

export default Stowing;
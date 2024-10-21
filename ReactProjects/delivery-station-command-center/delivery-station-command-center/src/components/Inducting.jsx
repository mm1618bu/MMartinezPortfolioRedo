import React, { useState, useEffect } from 'react';
import '../styles/main.scss';

const Inducting = ({ totalPackages }) => {
  const [unloadedPackages, setUnloadedPackages] = useState(0);
  const [inductRows, setInductRows] = useState(Array(8).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setInductRows((prevInductRows) => {
        const newInductRows = prevInductRows.map((packages) => {
          if (unloadedPackages < totalPackages) {
            const randomPackages = Math.floor(Math.random() * (14 - 2 + 1)) + 2;
            const packagesPerSecond = randomPackages / 60;
            const remainingPackages = totalPackages - unloadedPackages;
            const packagesToAdd = Math.min(packagesPerSecond, remainingPackages);
            return packages + packagesToAdd;
          }
          return packages;
        });
        const totalUnloaded = newInductRows.reduce((acc, curr) => acc + curr, 0);
        setUnloadedPackages(totalUnloaded);
        return newInductRows;
      });
    }, 100); // 0.1 second interval

    return () => clearInterval(interval);
  }, [unloadedPackages, totalPackages]);

  const totalInductedPackages = inductRows.reduce((acc, curr) => acc + curr, 0);

  return (
    <div className='page'>
      <h1>Inducting</h1>
      <table>
        <thead>
          <tr>
            <th>Induct Row</th>
            <th>Number of Packages</th>
          </tr>
        </thead>
        <tbody>
          {inductRows.map((packages, index) => (
            <tr key={index}>
              <td>Induct Row {index + 1}</td>
              <td>{Math.floor(packages)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Total Packages Inducted: {Math.floor(totalInductedPackages)}</h2>
    </div>
  );
};

export default Inducting;
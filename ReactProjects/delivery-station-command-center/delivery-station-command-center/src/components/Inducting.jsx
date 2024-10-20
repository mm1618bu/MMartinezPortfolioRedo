import React, { useState, useEffect } from 'react';

const Inducting = ({ totalPackages }) => {
  const [unloadedPackages, setUnloadedPackages] = useState(0);
  const [inductRows, setInductRows] = useState(Array(8).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setInductRows((prevInductRows) => {
        const newInductRows = prevInductRows.map((packages) => {
          if (unloadedPackages < totalPackages) {
            const randomPackages = Math.floor(Math.random() * (12 - 8 + 1)) + 8;
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
    }, 1000); // 1 second interval

    return () => clearInterval(interval);
  }, [unloadedPackages, totalPackages]);

  return (
    <div>
      <h1>Inducting</h1>
      <div>
        {inductRows.map((packages, index) => (
          <div key={index}>
            Induct Row {index + 1}: {Math.floor(packages)} packages
          </div>
        ))}
      </div>
      <h2>Total Unloaded Packages: {Math.floor(unloadedPackages)}</h2>
    </div>
  );
};

export default Inducting;
import React, { useState } from 'react';
import TruckUnloading from './TruckUnloading';
import Inducting from './Inducting';

const ParentComponent = () => {
  const [totalPackages, setTotalPackages] = useState(0);

  const handleTotalPackagesChange = (newTotal) => {
    setTotalPackages(newTotal);
  };

  return (
    <div>
      <TruckUnloading onTotalPackagesChange={handleTotalPackagesChange} />
      <Inducting totalPackages={totalPackages} />
    </div>
  );
};

export default ParentComponent;
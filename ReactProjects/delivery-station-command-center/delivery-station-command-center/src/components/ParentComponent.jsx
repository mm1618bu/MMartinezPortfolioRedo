import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TruckUnloading from './TruckUnloading';
import Inducting from './Inducting';
import Stowing from './Stowing';
import '../styles/main.scss';

const ParentComponent = () => {
  const [totalPackages, setTotalPackages] = useState(0);

  const handleTotalPackagesChange = (newTotal) => {
    setTotalPackages(newTotal);
  };

  return (
    <span className='page parent-component'>
      <TruckUnloading onTotalPackagesChange={handleTotalPackagesChange} />
      <Inducting totalPackages={totalPackages} />
      <Stowing />
    </span>
  );
};

ParentComponent.propTypes = {
  totalPackages: PropTypes.number,
  handleTotalPackagesChange: PropTypes.func,
};

export default ParentComponent;
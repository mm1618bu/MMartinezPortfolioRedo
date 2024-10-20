import React, { useState } from 'react';

const TruckUnloading = ({ onTotalPackagesChange }) => {
  const [truckId, setTruckId] = useState('');
  const [trucks, setTrucks] = useState([]);
  const [totalPackages, setTotalPackages] = useState(0);

  const handleAddTruck = () => {
    const randomPackages = Math.floor(Math.random() * (12000 - 7000 + 1)) + 7000;
    const newTruck = { id: truckId, packages: randomPackages };
    const newTotalPackages = totalPackages + randomPackages;
    setTrucks([...trucks, newTruck]);
    setTotalPackages(newTotalPackages);
    onTotalPackagesChange(newTotalPackages);
    setTruckId('');
  };

  return (
    <div>
      <h1>Truck Unloading</h1>
      <input
        type="text"
        placeholder="Enter Truck ID"
        value={truckId}
        onChange={(e) => setTruckId(e.target.value)}
      />
      <button onClick={handleAddTruck}>Add Truck</button>
      <div>
        <h2>Truck List</h2>
        <ul>
          {trucks.map((truck, index) => (
            <li key={index}>
              Truck ID: {truck.id}, Number of Packages: {truck.packages}
            </li>
          ))}
        </ul>
        <h2>Total Packages: {totalPackages}</h2>
      </div>
    </div>
  );
};

export default TruckUnloading;
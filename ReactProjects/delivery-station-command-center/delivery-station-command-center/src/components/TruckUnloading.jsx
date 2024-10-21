import React, { useState } from 'react';
import '../styles/main.scss';

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
    <div className='page'>
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
    <table>
        <thead>
            <tr>
                <th>Truck ID</th>
                <th>Number of Packages</th>
            </tr>
        </thead>
        <tbody>
            {trucks.map((truck, index) => (
                <tr key={index}>
                    <td>{truck.id}</td>
                    <td>{truck.packages}</td>
                </tr>
            ))}
        </tbody>
    </table>
    <h2 className='total'>Total Packages <br></br> {totalPackages}</h2>
</div>
    </div>
  );
};

export default TruckUnloading;
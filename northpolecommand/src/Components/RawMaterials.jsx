import React, { useState } from 'react';

const RawMaterials = () => {
  const [materials, setMaterials] = useState([
    // Example data
      { name: "Wood Plank (Oak)", qtyNeeded: 10, qtyOnHand: 0, qtyOnOrder: 0, price: 20, shelfLocation: 'A1' },
      { name: "Wood Plank (Pine)", qtyNeeded: 15, qtyOnHand: 0, qtyOnOrder:0, price: 12, shelfLocation: 'A2' },
      { name: "Metal Sheets (Aluminum)", qtyNeeded: 20, qtyOnHand: 0, qtyOnOrder: 0, price: 30, shelfLocation: 'A3' },
      { name: "Plastic Sheets (Acrylic)", qtyNeeded: 25, qtyOnHand: 0, qtyOnOrder: 0, price: 15, shelfLocation: 'A4' },
      { name: "Fabric (Cotton)", qtyNeeded: 30, qtyOnHand: 0, qtyOnOrder: 0, price: 5, shelfLocation: 'A5' },
      { name: "Paint (Gloss White)", qtyNeeded: 40, qtyOnHand: 0, qtyOnOrder: 0, price: 8, shelfLocation: 'A6' },
      { name: "Glue (Woodworking)", qtyNeeded: 45, qtyOnHand: 0, qtyOnOrder: 0, price: 3, shelfLocation: 'A7' },
      { name: "Screws (Wooden)", qtyNeeded: 50, qtyOnHand: 0, qtyOnOrder: 0, price: 1, shelfLocation: 'A8' },
      { name: "Nails (Metal)", qtyNeeded: 60, qtyOnHand: 0, qtyOnOrder: 0, price: 1, shelfLocation: 'A9' },
    
      { name: "LEDs (Red, Standard)", qtyNeeded: 1000, qtyOnHand: 0, qtyOnOrder: 0, price: 0.1, shelfLocation: 'A10' },
      { name: "Resistors (100 Ohm)", qtyNeeded: 1000, qtyOnHand: 0, qtyOnOrder: 0, price: 0.05, shelfLocation: 'A11' },
      { name: "Capacitors (10uF, Electrolytic)", qtyNeeded: 500, qtyOnHand: 0, qtyOnOrder: 0, price: 0.15, shelfLocation: 'A12' },
      { name: "Transistors (NPN, BC547)", qtyNeeded: 200, qtyOnHand: 0, qtyOnOrder: 0, price: 0.5, shelfLocation:'A13' },
      { name: "Diodes (1N4007)", qtyNeeded: 1500, qtyOnHand: 0, qtyOnOrder: 0, price: 0.2, shelfLocation: 'A14' },
      { name: "Microcontrollers (Arduino Uno)", qtyNeeded: 50, qtyOnHand: 0, qtyOnOrder: 0, price: 25, shelfLocation: 'A15' },
      { name: "Switches (SPDT)", qtyNeeded: 500, qtyOnHand: 0, qtyOnOrder: 0, price: 1.5, shelfLocation: 'A16' },
      { name: "Sensors (Temperature, DHT22)", qtyNeeded: 200, qtyOnHand: 0, qtyOnOrder: 0, price: 5, shelfLocation: 'A17' },
      { name: "Motors (DC 12V)", qtyNeeded: 50, qtyOnHand: 0, qtyOnOrder: 0, price: 10, shelfLocation: 'A18' },
      { name: "Servos (SG90)", qtyNeeded: 60, qtyOnHand: 0, qtyOnOrder: 0, price: 6, shelfLocation: 'R19' },
    
      { name: "Gears (Plastic, 10mm)", qtyNeeded: 100, qtyOnHand: 90, qtyOnOrder: 0, price: 2, shelfLocation: 'S20' },
      { name: "Bearings (8mm, Metal)", qtyNeeded: 150, qtyOnHand: 140, qtyOnOrder: 0, price: 3, shelfLocation: 'T21' },
      { name: "Belts (V-Belt, 30mm)", qtyNeeded: 200, qtyOnHand: 190, qtyOnOrder: 0, price: 4, shelfLocation: 'U22' },
      { name: "Pulleys (Aluminum, 20mm)", qtyNeeded: 150, qtyOnHand: 140, qtyOnOrder: 0, price: 5, shelfLocation: 'V23' },
      { name: "Springs (Compression, 100mm)", qtyNeeded: 250, qtyOnHand: 240, qtyOnOrder: 0, price: 2, shelfLocation: 'W24' },
      { name: "Shafts (Stainless Steel, 50mm)", qtyNeeded: 300, qtyOnHand: 290, qtyOnOrder: 0, price: 6, shelfLocation: 'X25' },
      { name: "Valves (Pneumatic)", qtyNeeded: 200, qtyOnHand: 190, qtyOnOrder: 0, price: 8, shelfLocation: 'Y26' },
      { name: "Pipes (PVC, 1 inch)", qtyNeeded: 400, qtyOnHand: 380, qtyOnOrder: 0, price: 3, shelfLocation: 'Z27' },
      { name: "Tubes (PVC, 1 inch)", qtyNeeded: 500, qtyOnHand: 480, qtyOnOrder: 0, price: 2, shelfLocation: 'AA28' },
      { name: "Fittings (PVC, 1 inch)", qtyNeeded: 600, qtyOnHand: 590, qtyOnOrder: 0, price: 2, shelfLocation: 'AB29' },
      { name: "Hoses (Rubber, 10mm)", qtyNeeded: 700, qtyOnHand: 690, qtyOnOrder: 0, price: 4, shelfLocation: 'AC30' },
    ]
    

  );

  const handleChange = (e, field, index) => {
    const newMaterials = [...materials];
    newMaterials[index][field] = e.target.value;
    setMaterials(newMaterials);
  };

  const calculateTotalValue = () => {
    return materials.reduce((total, material) => total + material.price * material.qtyOnHand, 0);
  };

  return (
    <div>
      <style>
        {`
          .inventory-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 18px;
            text-align: left;
          }

          .inventory-table th, .inventory-table td {
            padding: 12px 15px;
            border: 1px solid #ddd;
          }

          .inventory-table th {
            background-color: #f4f4f4;
          }

          .inventory-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }

          .inventory-table tr:hover {
            background-color: #f1f1f1;
          }

          .inventory-container {
            padding: 20px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
          }

          .inventory-title {
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: bold;
          }

          input{
            width: 100%;
            padding: 5px;
            border: none;
            background-color: transparent;
          }
        `}
      </style>
      <div className="inventory-container">
        <h2 className="inventory-title">Inventory Management</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Qty Needed</th>
              <th>Qty on Hand</th>
              <th>Qty on Order</th>
              <th>Price</th>
              <th>Shelf Location</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, index) => (
              <tr key={index}>
                <td>{material.name}</td>
                <td>
                  <input
                    type="number"
                    value={material.qtyNeeded}
                    onChange={(e) => handleChange(e, 'qtyNeeded', index)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={material.qtyOnHand}
                    onChange={(e) => handleChange(e, 'qtyOnHand', index)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={material.qtyOnOrder}
                    onChange={(e) => handleChange(e, 'qtyOnOrder', index)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={material.price}
                    onChange={(e) => handleChange(e, 'price', index)}
                  />
                </td>
                <td>{material.shelfLocation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Total Inventory Value: ${calculateTotalValue().toFixed(2)}</h3>
      </div>
    </div>
  );
};

export default RawMaterials;
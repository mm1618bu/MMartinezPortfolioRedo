import React, { useState, useEffect } from 'react';

function App() {
  const [forecastPackages, setForecastPackages] = useState(0);
  const [arrivals, setArrivals] = useState(0);
  const [intakes, setIntakes] = useState(0);
  const [compliance, setCompliance] = useState(0);
  const [simulationStarted, setSimulationStarted] = useState(false);

  useEffect(() => {
    let arrivalsInterval;
    let intakesInterval;

    if (simulationStarted && forecastPackages > 0 && arrivals < forecastPackages) {
      // Increment arrivals by 240 every minute
      arrivalsInterval = setInterval(() => {
        setArrivals(prevArrivals => {
          const newArrivals = prevArrivals + 240;
          return newArrivals > forecastPackages ? forecastPackages : newArrivals;
        });
      }, 60000);
    }

    if (simulationStarted && arrivals > 0 && intakes < arrivals) {
      // Increment intakes every 2 seconds
      intakesInterval = setInterval(() => {
        setIntakes(prevIntakes => prevIntakes + 1);
      }, 2000);
    }

    return () => {
      clearInterval(arrivalsInterval);
      clearInterval(intakesInterval);
    };
  }, [simulationStarted, forecastPackages, arrivals, intakes]);

  useEffect(() => {
    if (arrivals > 0) {
      const compliancePercentage = (intakes / arrivals) * 100;
      setCompliance(compliancePercentage.toFixed(2));
    }
  }, [arrivals, intakes]);

  const handleStartSimulation = () => {
    setSimulationStarted(true);
    setArrivals(0); // Reset arrivals
    setIntakes(0);  // Reset intakes
    setCompliance(0); // Reset compliance
  };

  return (
    <div>
      <input
        type="number"
        value={forecastPackages}
        onChange={(e) => setForecastPackages(parseInt(e.target.value) || 0)}
        placeholder="Forecast Packages"
      />
      <button onClick={handleStartSimulation}>
        Start Simulation
      </button>

      <p>Arrivals: {arrivals}</p>
      <p>Intakes: {intakes}</p>
      <p>Compliance: {compliance}%</p>
    </div>
  );
}

export default App;

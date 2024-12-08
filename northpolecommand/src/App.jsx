import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';
import AdminDashboard from './Components/AdminDashboard';
import RawMaterials from './Components/RawMaterials';
import ToyAssembly from './Components/ToyProcessing';

// Register the components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

const App = () => {
  // Initial data setup
  const [wishlistData, setWishlistData] = useState({
    received: 0,
    processed: 0,
    rejected: 0,
  });

  const [toysData, setToysData] = useState({
    ordered: 0,
    acknowledged: 0,
    beingWorkedOn: 0,
    sentToQA: 0,
    acceptedByQA: 0,
    rejectedByQA: 0,
  });

  const [orderPickData, setOrderPickData] = useState({
    ordersInQueue: 0,
    ordersBeingPicked: 0,
    ordersCompleted: 0,
    ratePerHour: 0,
  });

  const [orderPackData, setOrderPackData] = useState({
    picksInQueue: 0,
    currentlyPacking: 0,
    packCompleted: 0,
    ratePerHour: 0,
  });

  const [routeAssemblyData, setRouteAssemblyData] = useState({
    routesInQueue: 0,
    currentlyBeingAssembled: 0,
    routeCompleted: 0,
  });

  const [toyStowData, setToyStowData] = useState({
    arrived: 0,
    processed: 0,
    stowRatePerHour: 0,
    flaggedForHelp: 0,
  });

  // Function to increment data values over time
  const incrementData = () => {
    setWishlistData(prevData => ({
      received: prevData.received + Math.floor(Math.random() * 10),
      processed: prevData.processed + Math.floor(Math.random() * 6),
      rejected: prevData.rejected + Math.floor(Math.random() * 2),
    }));

    setToysData(prevData => ({
      ordered: prevData.ordered + Math.floor(Math.random() * 10),
      acknowledged: prevData.acknowledged + Math.floor(Math.random() * 9),
      beingWorkedOn: prevData.beingWorkedOn + Math.floor(Math.random() * 7),
      sentToQA: prevData.sentToQA + Math.floor(Math.random() * 5),
      acceptedByQA: prevData.acceptedByQA + Math.floor(Math.random() * 4),
      rejectedByQA: prevData.rejectedByQA + Math.floor(Math.random() * 2),
    }));

    setOrderPickData(prevData => ({
      ordersInQueue: prevData.ordersInQueue + Math.floor(Math.random() * 10),
      ordersBeingPicked: prevData.ordersBeingPicked + Math.floor(Math.random() * 8),
      ordersCompleted: prevData.ordersCompleted + Math.floor(Math.random() * 6),
      ratePerHour: prevData.ratePerHour + Math.floor(Math.random() * 2),
    }));

    setOrderPackData(prevData => ({
      picksInQueue: prevData.picksInQueue + Math.floor(Math.random() * 8),
      currentlyPacking: prevData.currentlyPacking + Math.floor(Math.random() * 6),
      packCompleted: prevData.packCompleted + Math.floor(Math.random() * 4),
      ratePerHour: prevData.ratePerHour + Math.floor(Math.random() * 2),
    }));

    setRouteAssemblyData(prevData => ({
      routesInQueue: prevData.routesInQueue + Math.floor(Math.random() * 3),
      currentlyBeingAssembled: prevData.currentlyBeingAssembled + Math.floor(Math.random() * 2),
      routeCompleted: prevData.routeCompleted + Math.floor(Math.random() * 1),
    }));

    setToyStowData(prevData => ({
      arrived: prevData.arrived + Math.floor(Math.random() * 3),
      processed: prevData.processed + Math.floor(Math.random() * 2),
      stowRatePerHour: prevData.stowRatePerHour + Math.floor(Math.random() * 1),
      flaggedForHelp: prevData.flaggedForHelp + Math.floor(Math.random() * 1),
    }));
  };

  // Use useEffect to start the incrementation every few seconds (e.g., every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      incrementData();
    }, 2000); // Updates every 3 seconds

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Data for Wishlist Chart
  const wishlistChartData = {
    labels: ['Received', 'Processed', 'Rejected'],
    datasets: [
      {
        label: 'Wishlist',
        data: [wishlistData.received, wishlistData.processed, wishlistData.rejected],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Data for Toys Chart
  const toysChartData = {
    labels: ['Ordered', 'Acknowledged', 'Being Worked On', 'Sent to QA', 'Accepted by QA', 'Rejected by QA'],
    datasets: [
      {
        label: 'Toys',
        data: [
          toysData.ordered,
          toysData.acknowledged,
          toysData.beingWorkedOn,
          toysData.sentToQA,
          toysData.acceptedByQA,
          toysData.rejectedByQA,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Data for Order Pick Chart
  const orderPickChartData = {
    labels: ['In Queue', 'Being Picked', 'Completed'],
    datasets: [
      {
        label: 'Order Pick',
        data: [
          orderPickData.ordersInQueue,
          orderPickData.ordersBeingPicked,
          orderPickData.ordersCompleted,
        ],
        backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Data for Order Pack Chart
  const orderPackChartData = {
    labels: ['Picks in Queue', 'Currently Packing', 'Pack Completed'],
    datasets: [
      {
        label: 'Order Pack',
        data: [
          orderPackData.picksInQueue,
          orderPackData.currentlyPacking,
          orderPackData.packCompleted,
        ],
        backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Data for Route Assembly Chart
  const routeAssemblyChartData = {
    labels: ['Routes in Queue', 'Currently Being Assembled', 'Route Completed'],
    datasets: [
      {
        label: 'Route Assembly',
        data: [
          routeAssemblyData.routesInQueue,
          routeAssemblyData.currentlyBeingAssembled,
          routeAssemblyData.routeCompleted,
        ],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Data for Toy Stow Chart
  const toyStowChartData = {
    labels: ['Arrived', 'Processed', 'Flagged for Help'],
    datasets: [
      {
        label: 'Toy Stow',
        data: [
          toyStowData.arrived,
          toyStowData.processed,
          toyStowData.flaggedForHelp,
        ],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const chartContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  };

  const chartItemStyle = {
    border: '1px solid #ccc',
    padding: '10px',
    backgroundColor: '#fff',
  };

  return (

    <div className="dashboard">
        <AdminDashboard />
        <RawMaterials />
        <ToyAssembly />
    <h1>Dashboard</h1>

    <div style={chartContainerStyle}>
      <div style={chartItemStyle}>
        <h2>Wishlist</h2>
        <Bar data={wishlistChartData} />
      </div>

      <div style={chartItemStyle}>
        <h2>Toys</h2>
        <Bar data={toysChartData} />
      </div>

      <div style={chartItemStyle}>
        <h2>Order Pick</h2>
        <Bar data={orderPickChartData} />
      </div>

      <div style={chartItemStyle}>
        <h2>Order Pack</h2>
        <Bar data={orderPackChartData} />
      </div>

      <div style={chartItemStyle}>
        <h2>Route Assembly</h2>
        <Bar data={routeAssemblyChartData} />
      </div>

      {/* Add more charts as needed */}
    </div>
  </div>  
  );
};

export default App;

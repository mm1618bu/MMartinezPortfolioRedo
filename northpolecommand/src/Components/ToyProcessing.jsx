import React, { useState, useEffect } from "react";
import ReactFlow, { Handle } from "react-flow-renderer";
import { useSpring, animated } from "react-spring"; // For animations

// Sample list of toys
const toyList = [
  { isbn: "978-3-16-148410-0", name: "Toy A", description: "A fun action figure" },
  { isbn: "978-1-23-456789-0", name: "Toy B", description: "A cute stuffed animal" },
  { isbn: "978-9-87-654321-0", name: "Toy C", description: "A robotic car" },
];

// Assembly stages
const assemblyStages = [
  { id: "1", label: "Waiting", color: "yellow" },
  { id: "2", label: "In Process", color: "blue" },
  { id: "3", label: "Completed", color: "green" },
];

// Function to simulate toy flow
const getToyFlow = (isbn, currentStage) => {
  const stages = [
    { id: "1", label: "Waiting", color: "yellow", position: { x: 250, y: 0 } },
    { id: "2", label: "In Process", color: "blue", position: { x: 250, y: 100 } },
    { id: "3", label: "Completed", color: "green", position: { x: 250, y: 200 } },
  ];

  const flow = [
    { id: "1", type: "input", position: { x: 250, y: 0 }, data: { label: "Waiting" } },
    { id: "2", position: { x: 250, y: 100 }, data: { label: "In Process" } },
    { id: "3", position: { x: 250, y: 200 }, data: { label: "Completed" } },
  ];

  if (currentStage === 0) {
    flow.push({ id: "e1", source: "1", target: "2", animated: true });
  }
  if (currentStage === 1) {
    flow.push({ id: "e2", source: "2", target: "3", animated: true });
  }

  return flow;
};

// Custom Node Component with Animation
const AnimatedNode = ({ data, currentStage }) => {
  const nodeAnimation = useSpring({
    opacity: currentStage === data.label ? 1 : 0.5, // Fade out other stages
    transform: currentStage === data.label ? "scale(1)" : "scale(0.9)", // Scale down inactive stages
  });

  return (
    <animated.div
      style={{
        backgroundColor: data.color,
        borderRadius: "10px",
        padding: "10px",
        boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
        ...nodeAnimation,
      }}
    >
      {data.label}
      <Handle type="source" position="right" />
      <Handle type="target" position="left" />
    </animated.div>
  );
};

const ToyAssembly = () => {
  const [selectedToy, setSelectedToy] = useState(null);
  const [toyFlows, setToyFlows] = useState([]);
  const [currentStage, setCurrentStage] = useState(0); // Track the current stage of the selected toy

  // Simulate the progress of the toy assembly every 5 seconds
  useEffect(() => {
    if (selectedToy) {
      const interval = setInterval(() => {
        setCurrentStage((prevStage) => {
          const nextStage = (prevStage + 1) % 3; // Loop through 3 stages
          return nextStage;
        });
      }, 5000); // 5 seconds per stage for simulation

      return () => clearInterval(interval);
    }
  }, [selectedToy]);

  useEffect(() => {
    if (selectedToy) {
      const flow = getToyFlow(selectedToy, currentStage);
      setToyFlows(flow);
    }
  }, [currentStage, selectedToy]);

  const handleToySelection = (isbn) => {
    setSelectedToy(isbn);
    setCurrentStage(0); // Reset to "Waiting" when a new toy is selected
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div style={{ width: "250px", marginRight: "20px" }}>
        <h3>Toy List</h3>
        <ul>
          {toyList.map((toy) => (
            <li key={toy.isbn}>
              <button onClick={() => handleToySelection(toy.isbn)}>
                {toy.name} (ISBN: {toy.isbn})
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ width: "600px", height: "400px" }}>
        <h3>Assembly Journey for {selectedToy ? selectedToy : "Select a Toy"}</h3>
        {selectedToy && (
          <>
            <div>
              <p><strong>Name:</strong> {toyList.find((toy) => toy.isbn === selectedToy)?.name}</p>
              <p><strong>Description:</strong> {toyList.find((toy) => toy.isbn === selectedToy)?.description}</p>
              <p><strong>Status:</strong> {assemblyStages[currentStage]?.label}</p>
            </div>

            <ReactFlow
              elements={toyFlows}
              style={{ width: "100%", height: "100%" }}
              nodeTypes={{
                animatedNode: AnimatedNode, // Use custom animated node
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ToyAssembly;

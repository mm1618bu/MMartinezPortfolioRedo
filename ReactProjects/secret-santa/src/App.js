import React, { useState } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

function App() {
  const [names, setNames] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [pairings, setPairings] = useState([]);

  const handleAddOrEditName = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      const lowerCaseNames = names.map(name => name.toLowerCase());
      if (editingIndex !== null) {
        // Edit existing name
        const updatedNames = [...names];
        updatedNames[editingIndex] = trimmedValue;
        setNames(updatedNames);
        setEditingIndex(null);
      } else if (!lowerCaseNames.includes(trimmedValue.toLowerCase())) {
        // Add new name
        setNames([...names, trimmedValue]);
      } else {
        alert('Please enter a valid name that is not a duplicate.');
      }
      setInputValue('');
    }
  };

  const handleEditName = (index) => {
    setInputValue(names[index]);
    setEditingIndex(index);
  };

  const handleRemoveName = (index) => {
    const updatedNames = names.filter((_, i) => i !== index);
    setNames(updatedNames);
    if (editingIndex === index) {
      setEditingIndex(null); // Clear editing state if removing the edited name
      setInputValue(''); // Clear input field
    }
  };

  const handleGeneratePairings = () => {
    const shuffledNames = [...names].sort(() => Math.random() - 0.5);
    const newPairings = shuffledNames.map((name, index) => ({
      giver: name,
      receiver: shuffledNames[(index + 1) % shuffledNames.length], // pair with next person
    }));
    setPairings(newPairings);
  };

  return (
    <div className="App">
      <h1>Secret Santa Pairing Generator</h1>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter a name"
      />
      <button onClick={handleAddOrEditName}>
        {editingIndex !== null ? 'Update Name' : 'Add Name'}
      </button>
      <h2>Names List:</h2>
      <ul>
        {names.map((name, index) => (
          <li key={index}>
            {name}
            <button onClick={() => handleEditName(index)} aria-label="Edit">
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button onClick={() => handleRemoveName(index)} aria-label="Remove">
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </li>
        ))}
      </ul>
      <button onClick={handleGeneratePairings} disabled={names.length < 2}>
        Generate Pairings
      </button>
      {pairings.length > 0 && (
        <div>
          <h2>Pairings:</h2>
          <ul>
            {pairings.map((pairing, index) => (
              <li key={index}>
                {pairing.giver} ➜ {pairing.receiver}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

// src/App.js
import React from 'react';
import PasswordGenerator from './PasswordGenerator';

const App = () => {
    return (
        <div style={{ textAlign: 'center' }}>
            <h1>Password Generator App</h1>
            <PasswordGenerator />
        </div>
    );
};

export default App;

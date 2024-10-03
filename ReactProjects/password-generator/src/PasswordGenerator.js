// src/PasswordGenerator.js
import React, { useState } from 'react';
import './App.css';
const PasswordGenerator = () => {
    const [length, setLength] = useState(8);
    const [includeUppercase, setIncludeUppercase] = useState(false);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSpecialChars, setIncludeSpecialChars] = useState(false);
    const [password, setPassword] = useState('');

    const generatePassword = () => {
        const upperCaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowerCaseLetters = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const specialChars = '!@#$%^&*()_+-=[]{}|;:",.<>?';

        let characterSet = lowerCaseLetters;

        if (includeUppercase) characterSet += upperCaseLetters;
        if (includeNumbers) characterSet += numbers;
        if (includeSpecialChars) characterSet += specialChars;

        let generatedPassword = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characterSet.length);
            generatedPassword += characterSet[randomIndex];
        }

        setPassword(generatedPassword);
    };

    return (
        <div className="container">
            <h2>Password Generator</h2>
            <label>
                Length:
                <input
                    type="number"
                    min="1"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                />
            </label>
            <label>
                Include Uppercase Letters
                <input
                    type="checkbox"
                    checked={includeUppercase}
                    onChange={() => setIncludeUppercase(!includeUppercase)}
                />
            </label>
            <label>
                Include Lowercase Letters
                <input
                    type="checkbox"
                    checked={includeLowercase}
                    onChange={() => setIncludeLowercase(!includeLowercase)}
                />
            </label>
            <label>
                Include Numbers
                <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={() => setIncludeNumbers(!includeNumbers)}
                />
            </label>
            <label>
                Include Special Characters
                <input
                    type="checkbox"
                    checked={includeSpecialChars}
                    onChange={() => setIncludeSpecialChars(!includeSpecialChars)}
                />
            </label>
            <button onClick={generatePassword}>Generate Password</button>
            <h3>Your Password: <br/> {password}</h3>
        </div>
    );
};

export default PasswordGenerator;

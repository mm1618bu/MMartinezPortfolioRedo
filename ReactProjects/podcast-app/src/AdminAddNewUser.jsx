import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';


export default function AdminAddNewUser() {
    return (
        <div>
        <h1>Add New User</h1>
        <form>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" />
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" />
            <label htmlFor="password">Semd Email to setup password prior to login:</label>
            <input type="checkbox" name="password" />
            <button type="submit">Add User</button>
        </form>
        </div>
    );
}
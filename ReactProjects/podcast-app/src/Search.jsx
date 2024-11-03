import React from "react";
import "./App.css";

const Search = () => {
    return (
        <div className="search-container">
            <h2>Search for broadcasts</h2>
            <form className="search-form">
                <label htmlFor="search">Search</label>
                <input type="text" id="search" name="search" required />
                <button type="submit" className='sso-button'>Search</button>
            </form>
        </div>
    );
    }

export default Search;
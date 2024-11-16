import React from "react";
import "./App.css";

const Search = () => {
    return (
        <>
            <style>
                {`
                    .search-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        max-width: 600px;
                        margin: auto;
                        color: #333;
                    }
                    .search-container h2 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #007bff;
                    }
                    .search-form {
                        display: flex;
                        width: 100%;
                    }
                    .search-form input {
                        flex: 1;
                        height: 40px;
                        margin-top: 10px;
                        padding: 10px;
                        border: 1px solid #ccc;
                        border-radius: 4px 0 0 4px;
                        font-size: 16px;
                    }
                    .search-form input:focus {
                        border-color: #007bff;
                        outline: none;
                        box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
                    }
                    .sso-button {
                        margin-top: 10px;
                        padding: 11px 20px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 0 4px 4px 0;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .sso-button:hover {
                        background-color: #0056b3;
                    }
                `}
            </style>
            <div className="search-container">
                <h2>Find Broadcasts, Friends</h2>
                <form className="search-form">
                    <input type="text" id="search" name="search" required placeholder="broadcasts, friends and more ..." />
                    <button type="submit" className='sso-button'>Search</button>
                </form>
            </div>
        </>
    );
}

export default Search;
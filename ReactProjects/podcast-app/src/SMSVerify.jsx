import React from "react";

const SMSVerify = () => {
    const handleInput = (e, index) => {
        const value = e.target.value;
        if (value.length === 1 && index < 5) {
            document.getElementById(`digit-${index + 1}`).focus();
        }
    };

    return (
        <>
            <style>
                {`
                    .sms-verify-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        margin: auto;
                    }
                    .sms-verify-form {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                    }
                    .sms-inputs {
                        display: flex;
                        justify-content: space-between;
                        width: 100%;
                        margin-bottom: 15px;
                    }
                    .sms-inputs input {
                        width: 40px;
                        height: 40px;
                        text-align: center;
                        font-size: 18px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                    }
                    .sso-button {
                        padding: 10px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .sso-button:hover {
                        background-color: #0056b3;
                    }
                    .sms-verify-container p {
                        margin-top: 15px;
                        color: #333;
                    }
                `}
            </style>
            <div className="sms-verify-container">
                <h2>Verify your phone number</h2>
                <form className="sms-verify-form">
                    <div className="sms-inputs">
                        {[...Array(6)].map((_, index) => (
                            <input
                                key={index}
                                type="text"
                                id={`digit-${index}`}
                                maxLength="1"
                                onInput={(e) => handleInput(e, index)}
                                required
                            />
                        ))}
                    </div>
                    <button type="submit" className='sso-button'>Verify</button>
                    <p>I can't access my phone</p>
                </form>
            </div>
        </>
    );
}

export default SMSVerify;
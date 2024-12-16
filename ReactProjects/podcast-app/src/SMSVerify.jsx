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
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    .sms-verify-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background-color: #000000; /* Black background */
                        color: #fff; /* White text */
                    }

                    .sms-verify-container h2 {
                        font-size: 28px;
                        color: #ff4500; /* Orange color */
                        margin-bottom: 20px;
                        text-align: center;
                    }

                    .sms-verify-form {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                        max-width: 400px;
                        margin-top: 20px;
                    }

                    .sms-inputs {
                        display: flex;
                        justify-content: space-between;
                        width: 100%;
                        margin-bottom: 20px;
                    }

                    .sms-inputs input {
                        width: 50px;
                        height: 50px;
                        text-align: center;
                        font-size: 20px;
                        border: 1px solid #444;
                        border-radius: 8px;
                        background-color: #333;
                        color: #fff;
                        transition: border-color 0.3s ease, box-shadow 0.3s ease;
                    }

                    .sms-inputs input:focus {
                        border-color: #ff4500; /* Orange border on focus */
                        box-shadow: 0 0 8px rgba(255, 69, 0, 0.5);
                        outline: none;
                    }

                    .sso-button {
                        padding: 14px;
                        background-color: #ff4500; /* Orange button */
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 18px;
                        cursor: pointer;
                        width: 100%;
                        transition: background-color 0.3s ease, transform 0.2s ease;
                    }

                    .sso-button:hover {
                        background-color: #e03e00; /* Darker orange on hover */
                        transform: translateY(-2px);
                    }

                    .sms-verify-container p {
                        margin-top: 20px;
                        color: #ccc;
                    }

                    .sms-verify-container p a {
                        color: #ff4500; /* Orange link */
                        text-decoration: none;
                        font-weight: bold;
                    }

                    .sms-verify-container p a:hover {
                        text-decoration: underline;
                    }

                    /* Responsive Design */
                    @media (max-width: 768px) {
                        .sms-inputs input {
                            font-size: 18px;
                            width: 45px;
                            height: 45px;
                        }

                        .sso-button {
                            font-size: 16px;
                        }
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
                    <button type="submit" className="sso-button">Verify</button>
                    <p>I can't access my phone</p>
                </form>
            </div>
        </>
    );
};

export default SMSVerify;

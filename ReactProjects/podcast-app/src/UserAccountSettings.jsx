import React from 'react';

const UserAccountSettings = () => {
    return (
        <div className="user-account-settings-container">
            <button>Back</button>
            <h2>Account Settings</h2>
            <form className="user-account-settings-form">
                <input type="text" placeholder="Full Name" />
                <input type="text" placeholder="Alias" />
                <input type="tel" placeholder="Phone Number" />
                <input type="email" placeholder="Email" />
                <input type="text" placeholder="Username" />
            </form>
            <button>Connect Instagram</button>
            <button>Connect Twitter</button>
            <button>Save Changes</button>
            <button>Sync Contacts</button>
            <button>Log Out</button>
            <button>Delete Account</button>

            <style jsx>{`
                .user-account-settings-container {
                    padding: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .user-account-settings-form {
                    display: flex;
                    flex-direction: column;
                }

                .user-account-settings-form input {
                    margin-bottom: 15px;
                    padding: 10px;
                    font-size: 16px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }

                @media (max-width: 600px) {
                    .user-account-settings-container {
                        padding: 10px;
                    }

                    .user-account-settings-form input {
                        font-size: 14px;
                        padding: 8px;
                    }

                    button {
                        font-size: 14px;
                        margin: 8px 16px 8px 16px;
                        margin-top: 2px;
                        width: 90%;
                        align-self: center;
                        position: relative;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default UserAccountSettings;
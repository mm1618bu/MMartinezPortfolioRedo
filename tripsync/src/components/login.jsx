import React from 'react';
import '../design/main.css';

export default function Login() {

    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle login logic here
    };

    return (

        <div className="loginBox">
            <div>
                <h1>TripSync Login</h1>
            </div>
            <br/>
            <form>
                <h3>Username</h3>
                <div className="inputBox">
                    <input type="text" required="required" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <br />
                <h3>Password</h3>
                <div className="inputBox">
                    <input type="password" required="required" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <br />
                <div className="inputBox">
                    <button type="submit" value="Login" onSubmit={handleSubmit}>Login</button>
                </div>
                <br/>
                <div>
                    <p><a href="">Forgot Password?</a> | <a href=""> Register</a></p>
                </div>

            </form>
        </div>
    );
}
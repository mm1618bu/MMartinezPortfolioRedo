import react from 'react';
import '../design/main.css';

export default function Register() {
    
    const [username, setUsername] = react.useState('');
    const [email, setEmail] = react.useState('');
    const [password, setPassword] = react.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle registration logic here
    }

    return (
        
        <div className="registerBox">
            <div>
                <h1>TripSync Register</h1>
            </div>
            <br/>
            <form>
                <h3>Username</h3>
                <div className="inputBox">
                    <input type="text" required="required" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <br />
                <h3>Email</h3>
                <div className="inputBox">
                    <input type="email" required="required" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <br />
                <h3>Password</h3>
                <div className="inputBox">
                    <input type="password" required="required" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <br />
                <div className="inputBox">
                    <button
    type="submit" value="Register" onSubmit={handleSubmit}>Register</button>



                </div>
                <br/>
                <div>
                    <p>Already have an account? <a href=""> Login</a></p>
                </div>
                
            </form>
        </div>
    );
}

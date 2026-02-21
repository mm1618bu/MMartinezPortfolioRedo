import react from 'react';
import '../design/main.css';

export default function ForgotPassword() {
    
    const [email, setEmail] = react.useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle forgot password logic here
    }
    
    return (
        <div className="forgotPasswordBox">
            <div>
                <h1>TripSync Forgot Password</h1>
            </div>
            <br/>
            <form>
                <h3>Email</h3>
                <div className="inputBox">
                    <input type="email" required="required" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <br />
                <div className="inputBox">
                    <button type="submit" value="Submit" onSubmit={handleSubmit}>Submit</button>
                </div>
                <br/>
                <div>
                    <p>Remembered your password? <a href=""> Login</a></p>
                </div>
            </form>
        </div>
    );
}

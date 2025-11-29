import '../../styles/main.css';

export default function LoginPage() {
    return(
            <div className='User-Form'>
                <form>
                    <input type='text' placeholder='Username or Email' required></input>
                    <br />
                    <input type='password' placeholder='Password' required></input>
                    <br />
                    <button type='submit'>Login</button>
                    <br />
                    <br />
                    <p><a href='/ForgotPassword'>Forgot Password?</a> | <a href='/RegisterPage'>Register</a></p>
                </form>
            </div>
    );
};
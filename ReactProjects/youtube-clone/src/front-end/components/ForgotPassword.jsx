import '../../styles/main.css';

export default function ForgotPassword(){
    return (
        <div className='User-Form'>
            <form>
                <input type='text' placeholder='Username or Email' required></input>
                <br />
                <button type='submit'>Reset</button>
                <br />
                <br />
                <p><a href='/LoginPage'>Back to Login</a></p>
            </form>
        </div>
    );
}
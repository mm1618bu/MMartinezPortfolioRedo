import '../../styles/main.css';

export default function RegisterPage() {
     return(
            <div className='User-Form'>
                <form>
                    <input type='text' placeholder='Username or Email' required></input>
                    <br />
                    <input type='password' placeholder='Password' required></input>
                    <br />
                    <button type='submit'>Regiser</button>
                    <br />
                    <br />
                    <p><a href='/LoginPage'>Have An Account?</a></p>
                </form>
            </div>
    );
}
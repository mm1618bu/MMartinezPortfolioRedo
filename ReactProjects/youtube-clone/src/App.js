import './styles/main.css';
import LoginPage from './front-end/components/LoginPage.jsx';
import RegisterPage from './front-end/components/RegisterPage.jsx';
import ForgotPassword from './front-end/components/ForgotPassword.jsx';

function App() {
  return (
    <div className="App">
      <LoginPage />
      <RegisterPage />
      <ForgotPassword />
    </div>
  );
}

export default App;

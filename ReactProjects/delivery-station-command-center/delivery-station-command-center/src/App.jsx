import './styles/main.scss';
import Stowing from './components/Stowing';
import ParentComponent from './components/ParentComponent';

function App() {
  return (
    <div className="App">
      <h1>Delivery Station Command Center</h1>
      <ParentComponent />
      <Stowing />
    </div>
  );
}

export default App;

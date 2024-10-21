import './styles/main.scss';
import ParentComponent from './components/ParentComponent';
import Header from './components/Header';

function App() {
  return (
    <div className="App">
      <Header />
      <ParentComponent />
    </div>
  );
}

export default App;

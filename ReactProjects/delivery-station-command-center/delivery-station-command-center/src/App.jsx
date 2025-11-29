import './styles/main.scss';
import ParentComponent from './components/ParentComponent';
import Header from './components/Header';
import LongHaulFleetBoard from './components/LongHaulFleetBoard';
import ScheduleManager from './components/ScheduleManager';

function App() {
  return (
    <div className="App">
      <Header />
      {/* <ParentComponent /> */}
      {/*<LongHaulFleetBoard />*/}
      <ScheduleManager/>
    </div>
  );
}

export default App;

import logo from './logo.svg';
import './App.css';
import RestaurantGrid from './components/RestaurantGrid';
import './components/ui/food.css';
import './components/ui/restaurantpage.css'
import CategoryCarousel from './components/CategoryCarousel';
import RestaurantPage from './components/RestaurantPage';

function App() {
  return (
    <div className="App">
      <CategoryCarousel/>
      <RestaurantPage/>
    </div>
  );
}

export default App;

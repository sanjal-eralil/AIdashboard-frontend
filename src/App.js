import logo from './logo.svg';
import './App.css';
import { Provider } from 'react-redux';
import store from './redux/store';
import ChartVisualizer from './components/ChartVisualizer';
import ChartVisualizer1 from './components/ChartVisualizer1';
import ChartVisualizer2 from './components/ChartVisualizer2';


function App() {
  return (
    <div className="App">
      <ChartVisualizer1/>
    </div>
  );
}

export default App;

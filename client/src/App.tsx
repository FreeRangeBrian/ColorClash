import { SimulationGame } from "./components/SimulationGame";
import "@fontsource/inter";

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#f0f0f0',
      fontFamily: 'Inter, sans-serif',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <SimulationGame />
    </div>
  );
}

export default App;

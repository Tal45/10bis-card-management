import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './app/routes/Home';
import AddCard from './app/routes/AddCard';
import CardDetail from './app/routes/CardDetail';
import Settings from './app/routes/Settings';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <main className="container mx-auto max-w-md p-4 pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddCard />} />
            <Route path="/card/:id" element={<CardDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
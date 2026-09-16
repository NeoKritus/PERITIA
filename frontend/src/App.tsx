// PERITIA — App Router
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import PreparationPage from './pages/PreparationPage';
import PracticePage from './pages/PracticePage';
import ProgressPage from './pages/ProgressPage';
import AboutPage from './pages/AboutPage';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/preparation" element={<PreparationPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  );
}

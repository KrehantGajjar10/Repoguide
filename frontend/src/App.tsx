import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ConnectRepositoryPage } from './pages/ConnectRepositoryPage';
import { RepositoryAnalysisPage } from './pages/RepositoryAnalysisPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
          <Navbar />
          <Routes>
            <Route path="/" element={<ConnectRepositoryPage />} />
            <Route path="/analysis" element={<RepositoryAnalysisPage />} />
            <Route path="/overview" element={<ProjectOverviewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

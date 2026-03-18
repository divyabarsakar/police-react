import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ReportForm from './pages/ReportForm';
import StatsPage from './pages/StatsPage';

export default function App() {
  const [page, setPage] = useState('form'); // 'form' | 'stats'
  const [statsData, setStatsData] = useState(null);

  const handleSubmitSuccess = (data) => {
    setStatsData(data);
    setPage('stats');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewReport = () => {
    setPage('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Navbar />
      {page === 'form' ? (
        <ReportForm onSuccess={handleSubmitSuccess} />
      ) : (
        <StatsPage stats={statsData} onNewReport={handleNewReport} />
      )}
    </>
  );
}

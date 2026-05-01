import { useState, useEffect } from 'react';
import Sidebar from './CountryManager';
import Gallery from './Gallery';
import { getCountries, getBackgroundSettings } from './store';
import GlobalUploadModal from './GlobalUploadModal';
import SettingsModal from './SettingsModal';
import BackgroundManager from './BackgroundManager';
import { IS_VIEWER } from './config';

function App() {
  const [countries, setCountries] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    refreshData();
  }, [refreshTrigger]);

  const refreshData = async () => {
    const data = await getCountries();
    setCountries(data);
    if (data.length > 0 && !selectedCountryId) {
      setSelectedCountryId(data[0].id);
    }
  };

  const handleCountrySelect = (id) => {
    setSelectedCountryId(id);
  };

  const handleUploadComplete = (targetCountryId) => {
    setSelectedCountryId(targetCountryId);
    setRefreshTrigger(prev => prev + 1);
  };

  const currentCountry = countries.find(c => c.id === selectedCountryId);

  return (
    <div className="app-container">
      <BackgroundManager refreshTrigger={refreshTrigger} />
      
      <div className="sidebar-wrapper glass-panel">
        <Sidebar 
          countries={countries} 
          selectedId={selectedCountryId} 
          onSelect={handleCountrySelect}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
        />
        
        {/* Management Buttons - Only visible in Admin Mode */}
        {!IS_VIEWER && (
          <div className="admin-actions">
            <button className="sleek-btn upload" onClick={() => setIsUploadModalOpen(true)}>
              上传照片
            </button>
            <button className="sleek-btn settings" onClick={() => setIsSettingsModalOpen(true)}>
              主题设置
            </button>
          </div>
        )}
      </div>

      <main className="main-content">
        {selectedCountryId ? (
          <Gallery 
            countryId={selectedCountryId} 
            countryName={currentCountry?.name}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
        ) : (
          <div className="empty-state glass-panel">
            <h2>欢迎来到摄影画廊</h2>
            <p>请在左侧选择一个地区开始查看照片</p>
          </div>
        )}
      </main>

      {/* Modals - Only used in Admin Mode */}
      {!IS_VIEWER && (
        <>
          <GlobalUploadModal 
            isOpen={isUploadModalOpen} 
            onClose={() => setIsUploadModalOpen(false)} 
            countries={countries}
            onUploadComplete={handleUploadComplete}
          />
          <SettingsModal 
            isOpen={isSettingsModalOpen} 
            onClose={() => setIsSettingsModalOpen(false)} 
            onSettingsChanged={() => setRefreshTrigger(prev => prev + 1)}
          />
        </>
      )}
    </div>
  );
}

export default App;

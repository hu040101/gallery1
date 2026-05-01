import { useState } from 'react';
import { addCountry, deleteCountry, updateCountry, reorderCountries } from './store';
import { IS_VIEWER } from './config';

export default function Sidebar({ countries, selectedId, onSelect, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newCountryName, setNewCountryName] = useState('');

  const handleAddCountry = async (e) => {
    e.preventDefault();
    if (!newCountryName.trim()) return;
    await addCountry(newCountryName.trim());
    setNewCountryName('');
    onRefresh();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个地区吗？这将删除该地区下所有照片数据。')) {
      await deleteCountry(id);
      onRefresh();
    }
  };

  const startEdit = (e, country) => {
    e.stopPropagation();
    setEditingId(country.id);
    setEditName(country.name);
  };

  const handleRename = async (id) => {
    if (editName.trim()) {
      await updateCountry(id, editName.trim());
    }
    setEditingId(null);
    onRefresh();
  };

  // Drag and drop reordering
  const handleDragStart = (e, index) => {
    if (IS_VIEWER) return;
    e.dataTransfer.setData('index', index);
  };

  const handleDrop = async (e, targetIndex) => {
    if (IS_VIEWER) return;
    const sourceIndex = parseInt(e.dataTransfer.getData('index'));
    const newList = [...countries];
    const [movedItem] = newList.splice(sourceIndex, 1);
    newList.splice(targetIndex, 0, movedItem);
    await reorderCountries(newList);
    onRefresh();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-dot"></div>
          <h2 className="site-title">摄影画廊</h2>
        </div>
        <p className="site-subtitle">我的视觉记忆馆</p>
      </div>
      
      <nav className="country-list">
        {countries.map((country, index) => (
          <div 
            key={country.id}
            draggable={!IS_VIEWER}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            className={`country-item ${selectedId === country.id ? 'active' : ''}`}
            onClick={() => onSelect(country.id)}
          >
            {editingId === country.id ? (
              <input 
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleRename(country.id)}
                onKeyDown={e => e.key === 'Enter' && handleRename(country.id)}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="country-name">{country.name}</span>
                {!IS_VIEWER && (
                  <div className="country-actions">
                    <button className="icon-btn" onClick={(e) => startEdit(e, country)} title="重命名">✎</button>
                    <button className="icon-btn delete" onClick={(e) => handleDelete(e, country.id)} title="删除">✕</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Add Country - Hidden in Viewer Mode */}
      {!IS_VIEWER && (
        <form className="add-country-form" onSubmit={handleAddCountry}>
          <input 
            placeholder="+ 添加新地区..." 
            value={newCountryName}
            onChange={e => setNewCountryName(e.target.value)}
          />
        </form>
      )}

      <footer className="sidebar-footer">
        <p>© 2024 Photography</p>
        <div className="social-links">
          {/* Subtle social icons could go here */}
        </div>
      </footer>
    </aside>
  );
}

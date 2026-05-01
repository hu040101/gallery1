import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IS_VIEWER } from './config';

export default function ImageCard({ image, groups, onDelete, onUpdate, onClick, isSelectionMode, isSelected, onSelect }) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  useEffect(() => {
    const hideMenu = () => setShowMenu(false);
    window.addEventListener('click', hideMenu);
    return () => window.removeEventListener('click', hideMenu);
  }, []);

  const handleCardClick = () => {
    if (isSelectionMode) {
      onSelect();
    } else {
      onClick();
    }
  };

  return (
    <div 
      className={`image-card glass-panel ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
    >
      <div className="image-wrapper">
        <img src={image.file || image.url} alt={image.name} loading="lazy" />
        {isSelectionMode && (
          <div className={`selection-indicator ${isSelected ? 'active' : ''}`}>
            {isSelected ? '✓' : ''}
          </div>
        )}
        <div className="image-overlay">
          <span className="image-title">{image.name}</span>
        </div>
      </div>

      {/* Context Menu - Hidden in Viewer Mode */}
      {showMenu && !IS_VIEWER && createPortal(
        <div className="context-menu glass-panel" style={{ top: menuPos.y, left: menuPos.x }}>
          <button className="context-menu-btn" onClick={() => onClick()}>
            查看大图
          </button>
          <button className="context-menu-btn" onClick={() => {
            const newNote = window.prompt('编辑备注', image.note || '');
            if (newNote !== null) onUpdate({ note: newNote });
          }}>
            编辑详情
          </button>
          <button className="context-menu-btn delete" onClick={() => onDelete()}>
            删除照片
          </button>
        </div>,
        document.body
      )}

      {/* In Viewer Mode, maybe a subtle "view details" hint on hover? */}
      {showMenu && IS_VIEWER && createPortal(
        <div className="context-menu glass-panel" style={{ top: menuPos.y, left: menuPos.x }}>
          <button className="context-menu-btn" onClick={() => onClick()}>
            查看大图 / 详情
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

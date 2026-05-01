import { useState } from 'react';
import { addGroup, deleteGroup, updateGroup, reorderGroups } from './store';
import { IS_VIEWER } from './config';

export default function GroupManager({ countryId, groups, selectedGroupId, onSelect, onRefresh }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addGroup(countryId, newName.trim());
    setNewName('');
    setIsAdding(false);
    onRefresh();
  };

  const handleRename = async (id) => {
    if (editValue.trim()) {
      await updateGroup(countryId, id, editValue.trim());
    }
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个分类吗？照片不会被删除，将变为“未分类”。')) {
      await deleteGroup(countryId, id);
      if (selectedGroupId === id) onSelect(null);
      onRefresh();
    }
  };

  const handleDragStart = (e, index) => {
    if (IS_VIEWER) return;
    e.dataTransfer.setData('groupIndex', index);
  };

  const handleDrop = async (e, targetIndex) => {
    if (IS_VIEWER) return;
    const sourceIndex = parseInt(e.dataTransfer.getData('groupIndex'));
    const newList = [...groups];
    const [movedItem] = newList.splice(sourceIndex, 1);
    newList.splice(targetIndex, 0, movedItem);
    await reorderGroups(countryId, newList);
    onRefresh();
  };

  return (
    <div className="group-tabs">
      <button 
        className={`group-tab ${selectedGroupId === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        全部图片
      </button>

      {groups.map((group, index) => (
        <div 
          key={group.id}
          className={`group-tab ${selectedGroupId === group.id ? 'active' : ''}`}
          onClick={() => onSelect(group.id)}
          draggable={!IS_VIEWER}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, index)}
          onDoubleClick={(e) => !IS_VIEWER && (setEditingId(group.id), setEditValue(group.name))}
        >
          {editingId === group.id ? (
            <input 
              autoFocus
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => handleRename(group.id)}
              onKeyDown={e => e.key === 'Enter' && handleRename(group.id)}
              onClick={e => e.stopPropagation()}
              className="tab-edit-input"
            />
          ) : (
            <>
              {group.name}
              {!IS_VIEWER && (
                <button className="delete-group-btn" onClick={(e) => handleDelete(e, group.id)}>✕</button>
              )}
            </>
          )}
        </div>
      ))}

      {/* Add Group - Hidden in Viewer Mode */}
      {!IS_VIEWER && (
        <>
          {isAdding ? (
            <form onSubmit={handleAdd} className="add-group-form">
              <input 
                autoFocus
                placeholder="分类名称"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onBlur={() => !newName && setIsAdding(false)}
              />
            </form>
          ) : (
            <button className="add-group-btn" onClick={() => setIsAdding(true)}>
              + 新分类
            </button>
          )}
        </>
      )}
    </div>
  );
}

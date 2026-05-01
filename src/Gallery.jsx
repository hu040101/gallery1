import { useState, useEffect } from 'react';
import { getGroups, getImages, deleteImage, updateImage, deleteGroup, reorderGroups } from './store';
import ImageCard from './ImageCard';
import Lightbox from './Lightbox';
import ImageUploader from './ImageUploader';
import GroupManager from './GroupManager';
import { IS_VIEWER } from './config';

export default function Gallery({ countryId, countryName, onRefresh }) {
  const [groups, setGroups] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null); // null = All
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 12;

  useEffect(() => {
    loadData();
    setSelectedGroupId(null);
    setCurrentPage(1);
  }, [countryId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroupId]);

  const loadData = async () => {
    const [g, i] = await Promise.all([
      getGroups(countryId),
      getImages(countryId)
    ]);
    setGroups(g);
    setImages(i);
  };

  const filteredImages = selectedGroupId 
    ? images.filter(img => img.groupId === selectedGroupId)
    : images;

  // Paginated images
  const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
  const paginatedImages = filteredImages.slice(
    (currentPage - 1) * imagesPerPage,
    currentPage * imagesPerPage
  );

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这张照片吗？')) {
      await deleteImage(countryId, id);
      loadData();
    }
  };

  const handleUpdate = async (id, updates) => {
    await updateImage(countryId, id, updates);
    loadData();
  };

  const handleNext = () => {
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex > 0) {
      setSelectedImage(filteredImages[currentIndex - 1]);
    }
  };

  // Selection Logic
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (window.confirm(`确定要删除选中的 ${selectedIds.length} 张照片吗？`)) {
      for (const id of selectedIds) {
        await deleteImage(countryId, id);
      }
      setSelectedIds([]);
      setSelectionMode(false);
      loadData();
    }
  };

  const handleBatchMove = async (targetGroupId) => {
    for (const id of selectedIds) {
      await updateImage(countryId, id, { groupId: targetGroupId });
    }
    setSelectedIds([]);
    setSelectionMode(false);
    loadData();
  };

  return (
    <div className="gallery-container">
      <header className="gallery-header glass-panel">
        <div className="header-top">
          <h1>{countryName}</h1>
          
          {/* Management Controls - Hidden in Viewer Mode */}
          {!IS_VIEWER && (
            <div className="header-actions">
              {selectionMode ? (
                <div className="batch-actions">
                  <span className="selection-count">已选 {selectedIds.length} 项</span>
                  <select 
                    onChange={(e) => handleBatchMove(e.target.value)}
                    className="batch-select"
                    defaultValue=""
                  >
                    <option value="" disabled>移动到分类...</option>
                    <option value="">全部图片</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button className="batch-btn delete" onClick={handleBatchDelete} disabled={selectedIds.length === 0}>删除</button>
                  <button className="batch-btn cancel" onClick={() => { setSelectionMode(false); setSelectedIds([]); }}>取消</button>
                </div>
              ) : (
                <button className="selection-toggle-btn" onClick={() => setSelectionMode(true)}>
                  批量管理
                </button>
              )}
            </div>
          )}
        </div>
        
        <GroupManager 
          countryId={countryId}
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
          onRefresh={loadData}
        />
      </header>

      {/* Upload button - Hidden in Viewer Mode */}
      {!IS_VIEWER && (
        <ImageUploader 
          countryId={countryId} 
          groupId={selectedGroupId} 
          onImageAdded={loadData} 
        />
      )}

      <div className="image-grid">
        {paginatedImages.map(img => (
          <ImageCard 
            key={img.id} 
            image={img} 
            groups={groups}
            onDelete={() => handleDelete(img.id)}
            onUpdate={(updates) => handleUpdate(img.id, updates)}
            onClick={() => setSelectedImage(img)}
            isSelectionMode={selectionMode}
            isSelected={selectedIds.includes(img.id)}
            onSelect={() => toggleSelect(img.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination glass-panel">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="pagination-btn"
          >
            上一页
          </button>
          <span className="pagination-info">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            className="pagination-btn"
          >
            下一页
          </button>
        </div>
      )}

      {selectedImage && (
        <Lightbox 
          image={selectedImage} 
          images={filteredImages}
          onClose={() => setSelectedImage(null)}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </div>
  );
}

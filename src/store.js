import localforage from 'localforage';

localforage.config({
  name: 'CountryGallery',
  storeName: 'gallery_data'
});

// Cache for static data
let staticData = null;

async function getStaticData() {
  if (staticData) return staticData;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}gallery.json`);
    if (!response.ok) throw new Error('Not found');
    staticData = await response.json();
  } catch (err) {
    console.warn("Could not load public/gallery.json, falling back to local only mode.");
    staticData = { countries: [], groups: [], images: [], settings: {} };
  }
  return staticData;
}

// Helper to merge static and local data
async function getMerged(key, storageKey) {
  const data = await getStaticData();
  const staticItems = data[key] || [];
  const localItems = await localforage.getItem(storageKey) || [];
  const deletedIds = await localforage.getItem(`deleted_${storageKey}`) || [];
  
  if (localItems.length > 0) {
    // If we have localItems, it's the "master" list (preserves manual reorder)
    return localItems.filter(item => !deletedIds.includes(item.id));
  }
  
  // Otherwise, use filtered static data
  return staticItems.filter(item => !deletedIds.includes(item.id));
}

export async function getCountries() {
  return await getMerged('countries', 'countries');
}

export async function addCountry(name) {
  const countries = await getCountries();
  const newCountry = { id: 'local_' + Date.now().toString(), name, createdAt: Date.now() };
  const updated = [...countries, newCountry];
  await localforage.setItem('countries', updated);
  return newCountry;
}

export async function deleteCountry(id) {
  // 1. Always mark as deleted if it's static
  const data = await getStaticData();
  const isStatic = (data.countries || []).some(c => c.id === id);
  if (isStatic) {
    const deletedIds = await localforage.getItem('deleted_countries') || [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      await localforage.setItem('deleted_countries', deletedIds);
    }
  }

  // 2. Remove from local list
  let localCountries = await localforage.getItem('countries') || [];
  if (localCountries.length > 0) {
    localCountries = localCountries.filter(c => c.id !== id);
    await localforage.setItem('countries', localCountries);
  }
  
  await localforage.removeItem(`images_${id}`);
  await localforage.removeItem(`groups_${id}`);
}

export async function updateCountry(id, newName) {
  let countries = await getCountries();
  const index = countries.findIndex(c => c.id === id);
  if (index !== -1) {
    countries[index].name = newName;
    await localforage.setItem('countries', countries);
  }
}

export async function reorderCountries(newList) {
  await localforage.setItem('countries', newList);
}

// --- GROUPS ---
export async function getGroups(countryId) {
  const data = await getStaticData();
  const staticGroups = (data.groups || []).filter(g => g.countryId === countryId);
  const localGroups = await localforage.getItem(`groups_${countryId}`) || [];
  const deletedIds = await localforage.getItem(`deleted_groups_${countryId}`) || [];
  
  if (localGroups.length > 0) {
    return localGroups.filter(g => !deletedIds.includes(g.id));
  }
  
  return staticGroups.filter(g => !deletedIds.includes(g.id));
}

export async function addGroup(countryId, name) {
  const groups = await getGroups(countryId);
  const newGroup = { id: 'local_' + Date.now().toString(), countryId, name, createdAt: Date.now() };
  const updated = [...groups, newGroup];
  await localforage.setItem(`groups_${countryId}`, updated);
  return newGroup;
}

export async function deleteGroup(countryId, groupId) {
  const data = await getStaticData();
  const isStatic = (data.groups || []).some(g => g.id === groupId);
  if (isStatic) {
    const deletedIds = await localforage.getItem(`deleted_groups_${countryId}`) || [];
    if (!deletedIds.includes(groupId)) {
      deletedIds.push(groupId);
      await localforage.setItem(`deleted_groups_${countryId}`, deletedIds);
    }
  }

  let localGroups = await localforage.getItem(`groups_${countryId}`) || [];
  if (localGroups.length > 0) {
    localGroups = localGroups.filter(g => g.id !== groupId);
    await localforage.setItem(`groups_${countryId}`, localGroups);
  }
}

export async function updateGroup(countryId, groupId, newName) {
  let groups = await getGroups(countryId);
  const index = groups.findIndex(g => g.id === groupId);
  if (index !== -1) {
    groups[index].name = newName;
    await localforage.setItem(`groups_${countryId}`, groups);
  }
}

export async function reorderGroups(countryId, newList) {
  await localforage.setItem(`groups_${countryId}`, newList);
}

// --- IMAGES ---
export async function getImages(countryId) {
  const data = await getStaticData();
  const staticImages = (data.images || []).filter(img => img.countryId === countryId);
  const localImages = await localforage.getItem(`images_${countryId}`) || [];
  const deletedIds = await localforage.getItem(`deleted_images_${countryId}`) || [];
  
  const formattedStatic = staticImages
    .filter(img => !deletedIds.includes(img.id))
    .map(img => ({
      ...img,
      file: `${import.meta.env.BASE_URL}${img.url}` 
    }));

  const merged = [...formattedStatic];
  localImages.forEach(local => {
    const idx = merged.findIndex(m => m.id === local.id);
    if (idx !== -1) {
      merged[idx] = local;
    } else if (!deletedIds.includes(local.id)) {
      merged.push(local);
    }
  });

  return merged;
}

export async function addImage(countryId, groupId, file) {
  const images = await localforage.getItem(`images_${countryId}`) || [];
  const newImage = {
    id: 'local_' + Date.now().toString(),
    countryId,
    groupId: groupId || null,
    file, 
    name: file.name,
    note: '',
    createdAt: Date.now()
  };
  images.push(newImage);
  await localforage.setItem(`images_${countryId}`, images);
  return newImage;
}

export async function deleteImage(countryId, imageId) {
  const data = await getStaticData();
  const isStatic = (data.images || []).some(img => img.id === imageId);
  
  if (isStatic) {
    const deletedIds = await localforage.getItem(`deleted_images_${countryId}`) || [];
    if (!deletedIds.includes(imageId)) {
      deletedIds.push(imageId);
      await localforage.setItem(`deleted_images_${countryId}`, deletedIds);
    }
  }

  let localImages = await localforage.getItem(`images_${countryId}`) || [];
  if (localImages.length > 0) {
    localImages = localImages.filter(img => img.id !== imageId);
    await localforage.setItem(`images_${countryId}`, localImages);
  }
}

export async function updateImage(countryId, imageId, updates) {
  const allImages = await getImages(countryId);
  const index = allImages.findIndex(img => img.id === imageId);
  if (index !== -1) {
    const updatedImage = { ...allImages[index], ...updates };
    
    // Always save to local storage as an override
    let localImages = await localforage.getItem(`images_${countryId}`) || [];
    const localIdx = localImages.findIndex(img => img.id === imageId);
    if (localIdx !== -1) {
      localImages[localIdx] = updatedImage;
    } else {
      localImages.push(updatedImage);
    }
    await localforage.setItem(`images_${countryId}`, localImages);
  }
}

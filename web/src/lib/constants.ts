export const CATEGORIES = [
  { id: '1', name: 'Grocery', icon: '🛒', color: '#4CAF50' },
  { id: '2', name: 'Pharmacy', icon: '💊', color: '#F44336' },
  { id: '3', name: 'Clothing', icon: '👕', color: '#2196F3' },
  { id: '4', name: 'Accessories', icon: '⌚', color: '#9C27B0' },
  { id: '5', name: 'Electronics', icon: '💻', color: '#FF9800' },
];

export const getCategoryDetails = (categoryName: string) => {
  const cat = CATEGORIES.find(
    (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
  );
  return {
    icon: cat ? cat.icon : '🏪',
    color: cat ? cat.color : '#0F6E56',
  };
};

export const PRIMARY_COLOR = '#0F6E56';
export const DEFAULT_LAT = 22.3072;
export const DEFAULT_LNG = 73.1812;

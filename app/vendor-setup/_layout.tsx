import { Stack } from 'expo-router';
import { createContext, useContext, useState } from 'react';

type VendorData = {
  phone: string;
  name: string;
  category: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  products: { id: number; name: string; price: string }[];
};

type VendorContextType = {
  data: VendorData;
  updateData: (updates: Partial<VendorData>) => void;
};

const VendorContext = createContext<VendorContextType | null>(null);

export const useVendorContext = () => {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error('useVendorContext must be used within VendorProvider');
  return ctx;
};

export default function VendorSetupLayout() {
  const [data, setData] = useState<VendorData>({
    phone: '',
    name: '',
    category: '',
    location: '',
    latitude: null,
    longitude: null,
    products: [],
  });

  const updateData = (updates: Partial<VendorData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <VendorContext.Provider value={{ data, updateData }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="details" />
        <Stack.Screen name="location" />
        <Stack.Screen name="products" />
      </Stack>
    </VendorContext.Provider>
  );
}
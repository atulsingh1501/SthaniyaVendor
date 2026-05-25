import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useVendorContext } from './_layout';
import { stores, products as productsApi } from '../../utils/api';

export default function VendorOnboardingProducts() {
  const [products, setProducts] = useState([{ id: 1, name: '', price: '' }]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data } = useVendorContext();

  const addProductRow = () => {
    if (products.length < 5) {
      setProducts([...products, { id: products.length + 1, name: '', price: '' }]);
    }
  };

  const updateProductRow = (index: number, field: 'name'|'price', value: string) => {
    const fresh = [...products];
    fresh[index][field] = value;
    setProducts(fresh);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // 1. Create Store
      const storeData = await stores.create({
        name: data.name,
        category: data.category,
        phone: data.phone,
        location_text: data.location || '',
        latitude: data.latitude,
        longitude: data.longitude,
        upi_id: data.upiId || undefined,
      });

      // 2. Insert Products
      const validProducts = products.filter(p => p.name.trim() !== '');
      if (validProducts.length > 0) {
        const productsToInsert = validProducts.map(p => ({
          name: p.name.trim(),
          price: parseFloat(p.price) || 0,
          unit: 'piece',
          is_in_stock: true,
        }));
        await productsApi.addToStore(storeData.id, productsToInsert);
      }

      // 3. Return to Dashboard
      router.replace('/(tabs)/vendor');
    } catch (e: any) {
      alert(e.message || 'Failed to complete setup. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={[styles.progressLine, styles.progressActive]} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={[styles.progressLine, styles.progressActive]} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={[styles.progressLine, styles.progressActive]} />
          <View style={[styles.progressDot, styles.progressActive]} />
        </View>

        <Text style={styles.title}>Add your first products</Text>
        <Text style={styles.subtitle}>Start with at least 3 products</Text>

        <ScrollView style={styles.scrollArea}>
          {products.map((p, index) => (
              <View key={p.id} style={styles.productRow}>
                <Text style={styles.rowNum}>{index + 1}.</Text>
                <TextInput
                  style={[styles.input, { flex: 2, marginRight: 8 }]}
                  placeholder="Item Name (e.g. Amul Butter)"
                  value={p.name}
                  onChangeText={(val) => updateProductRow(index, 'name', val)}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Price ₹"
                  keyboardType="numeric"
                  value={p.price}
                  onChangeText={(val) => updateProductRow(index, 'price', val)}
                />
              </View>
          ))}
          
          <TouchableOpacity style={styles.addBtn} onPress={addProductRow}>
            <Text style={styles.addBtnText}>+ Add another item</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleComplete}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Finish Setup & Go Live'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 24,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  progressActive: {
    backgroundColor: '#E1F5EE',
    borderColor: '#0F6E56',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  scrollArea: {
    flex: 1,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowNum: {
    width: 20,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addBtn: {
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0F6E56',
    borderRadius: 8,
    backgroundColor: '#E1F5EE',
  },
  addBtnText: {
    color: '#0F6E56',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#0F6E56',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
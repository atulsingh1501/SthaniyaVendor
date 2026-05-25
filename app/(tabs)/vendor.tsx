import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { auth, stores, products as productsApi } from '../../utils/api';

export default function VendorScreen() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const { data: userAuth } = await auth.getUser();
      if (!userAuth.user) {
        setLoading(false);
        return; // Not logged in yet
      }

      const storeData = await stores.getMyStore();
      if (storeData) {
        setStore(storeData);
        setProducts(storeData.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = async (product: any) => {
    const newStatus = !product.is_in_stock;
    // Optimistic update
    setProducts(products.map(p =>
      p.id === product.id ? { ...p, is_in_stock: newStatus } : p
    ));
    try {
      await productsApi.updateStock(product.id, newStatus);
    } catch (e) {
      // Revert on failure
      setProducts(products.map(p =>
        p.id === product.id ? { ...p, is_in_stock: !newStatus } : p
      ));
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setStore(null);
    setProducts([]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0F6E56" />
      </SafeAreaView>
    );
  }

  // Not onboarded or logged out state
  if (!store) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>Vendor Portal</Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 }}>
          You haven't set up your store yet, or you are deeply testing.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#0F6E56', padding: 16, borderRadius: 12, alignItems: 'center' }} 
          onPress={() => router.push('/vendor-setup/')}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Start Vendor Onboarding</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Active vendor dashboard
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Manage Store</Text>
            <Text style={styles.storeName}>{store.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section Phase 2 */}
        <Text style={styles.sectionTitle}>🚀 Phase 2: Footfall Insights</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>142</Text>
            <Text style={styles.statLabel}>Views today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>23</Text>
            <Text style={styles.statLabel}>Calls this week</Text>
          </View>
        </View>

        {/* Phase 2 Promo Card */}
        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>Boost your store visibility 📣</Text>
          <Text style={styles.promoSub}>Appear at the top of local searches.</Text>
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={styles.promoBtnText}>Upgrade now →</Text>
          </TouchableOpacity>
        </View>

        {/* Products Section */}
        <Text style={styles.sectionTitle}>My products</Text>
        <View style={styles.productsContainer}>
          {products.map(product => (
            <View key={product.id} style={styles.productRow}>
              <View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.statusBadge,
                  { backgroundColor: product.is_in_stock ? '#E1F5EE' : '#FAECE7' }
                ]}
                onPress={() => toggleStock(product)}
              >
                <Text style={[
                  styles.statusText,
                  { color: product.is_in_stock ? '#0F6E56' : '#993C1D' }
                ]}>
                  {product.is_in_stock ? 'In stock' : 'Out of stock'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => alert('Add product flow to be implemented')}>
          <Text style={styles.addBtnText}>+ Add product</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 16,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoutBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 12,
    color: '#666',
  },
  headerTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  promoCard: {
    backgroundColor: '#FFF8EB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBE6C0',
    marginBottom: 24,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A5703',
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 13,
    color: '#8A5703',
    opacity: 0.8,
    marginBottom: 12,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#8A5703',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 12,
  },
  productsContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    marginBottom: 24,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  productName: {
    fontSize: 15,
    color: '#333',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});
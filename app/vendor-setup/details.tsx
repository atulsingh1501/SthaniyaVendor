import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useVendorContext } from './_layout';

export default function VendorOnboardingDetails() {
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [areaText, setAreaText] = useState('');
  const router = useRouter();
  const { updateData } = useVendorContext();

  const handleNext = () => {
    updateData({ name: storeName, category, location: areaText });
    router.push('/vendor-setup/location');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={[styles.progressLine, styles.progressActive]} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
        </View>

        <Text style={styles.title}>Store details</Text>
        <Text style={styles.subtitle}>Help customers find you</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Store Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sharma Kirana"
            value={storeName}
            onChangeText={setStoreName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Area / Neighbourhood</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alkapuri, Vadodara"
            value={areaText}
            onChangeText={setAreaText}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipsRow}>
            {['Grocery', 'Pharmacy', 'Clothing', 'Electronics'].map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.chip, category === cat ? styles.chipActive : null]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat ? styles.chipTextActive : null]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, (!storeName || !category || !areaText) ? styles.buttonDisabled : null]} 
          onPress={handleNext}
          disabled={!storeName || !category || !areaText}
        >
          <Text style={styles.buttonText}>Continue to Location</Text>
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
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  chipActive: {
    backgroundColor: '#E1F5EE',
    borderColor: '#0F6E56',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextActive: {
    color: '#0F6E56',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#0F6E56',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonDisabled: {
    backgroundColor: '#a0c4bb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
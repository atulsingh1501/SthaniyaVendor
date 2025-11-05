import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useVendorContext } from './_layout';
import MapView, { Marker } from 'react-native-maps';
import { useState } from 'react';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function VendorOnboardingLocation() {
  const router = useRouter();
  const { updateData } = useVendorContext();

  // Default to Vadodara
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 22.3072,
    longitude: 73.1812,
  });

  const [showCoordInput, setShowCoordInput] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [locating, setLocating] = useState(false);

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use this feature.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setSelectedLocation(coords);
      setLatInput(coords.latitude.toFixed(6));
      setLngInput(coords.longitude.toFixed(6));
    } catch (e) {
      Alert.alert('Error', 'Could not get your location. Please try again or enter manually.');
    } finally {
      setLocating(false);
    }
  };

  const handleApplyCoords = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    setSelectedLocation({ latitude: lat, longitude: lng });
  };

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
    setLatInput(coords.latitude.toFixed(6));
    setLngInput(coords.longitude.toFixed(6));
  };

  const handleDragEnd = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
    setLatInput(coords.latitude.toFixed(6));
    setLngInput(coords.longitude.toFixed(6));
  };

  const handleConfirm = () => {
    // Only save numeric coordinates — location_text (area name) was set in the details step
    updateData({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    });
    router.push('/vendor-setup/products');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.progressDot, i <= 2 && styles.progressActive]} />
              {i < 3 && <View style={[styles.progressLine, i < 2 && styles.progressActive]} />}
            </View>
          ))}
        </View>

        <Text style={styles.title}>Pin your store</Text>
        <Text style={styles.subtitle}>Tap the map, drag the pin, use GPS, or type coordinates.</Text>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleUseCurrentLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#0F6E56" />
            ) : (
              <Ionicons name="locate" size={18} color="#0F6E56" />
            )}
            <Text style={styles.actionBtnText}>
              {locating ? 'Locating...' : 'Use My Location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, showCoordInput && styles.actionBtnActive]}
            onPress={() => setShowCoordInput(!showCoordInput)}
          >
            <Ionicons name="keypad-outline" size={18} color={showCoordInput ? '#FFF' : '#0F6E56'} />
            <Text style={[styles.actionBtnText, showCoordInput && { color: '#FFF' }]}>
              Enter Coords
            </Text>
          </TouchableOpacity>
        </View>

        {/* Manual Coordinate Input */}
        {showCoordInput && (
          <View style={styles.coordInputRow}>
            <TextInput
              style={[styles.coordInput, { flex: 1, marginRight: 8 }]}
              placeholder="Latitude (e.g. 22.3072)"
              keyboardType="numeric"
              value={latInput}
              onChangeText={setLatInput}
            />
            <TextInput
              style={[styles.coordInput, { flex: 1, marginRight: 8 }]}
              placeholder="Longitude (e.g. 73.1812)"
              keyboardType="numeric"
              value={lngInput}
              onChangeText={setLngInput}
            />
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoords}>
              <Text style={styles.applyBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Coordinate Display */}
        <View style={styles.coordDisplay}>
          <Ionicons name="location" size={14} color="#0F6E56" />
          <Text style={styles.coordDisplayText}>
            {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsPointsOfInterest={false}
            showsUserLocation
            onPress={handleMapPress}
          >
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={handleDragEnd}
            >
              <View style={styles.pinWrapper}>
                <View style={styles.pinHead}>
                  <Ionicons name="storefront" size={14} color="#FFF" />
                </View>
                <View style={styles.pinTail} />
              </View>
            </Marker>
          </MapView>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm Location →</Text>
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
    padding: 20,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  progressActive: {
    backgroundColor: '#E1F5EE',
    borderColor: '#0F6E56',
  },
  progressLine: {
    width: 36,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0F6E56',
    backgroundColor: '#F4FBF8',
  },
  actionBtnActive: {
    backgroundColor: '#0F6E56',
    borderColor: '#0F6E56',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F6E56',
  },
  coordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coordInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
  },
  applyBtn: {
    backgroundColor: '#0F6E56',
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  coordDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  coordDisplayText: {
    fontSize: 12,
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  pinWrapper: {
    alignItems: 'center',
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F6E56',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F6E56',
    marginTop: -1,
  },
  button: {
    backgroundColor: '#0F6E56',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});
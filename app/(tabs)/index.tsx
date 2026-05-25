import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useNavigation } from "expo-router";
import { useEffect, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { stores as storesApi } from "../../utils/api";

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const { width, height } = Dimensions.get("window");

const CATEGORIES = [
  { id: "1", name: "Grocery", icon: "cart-outline", color: "#4CAF50" },
  { id: "2", name: "Pharmacy", icon: "medical-outline", color: "#F44336" },
  { id: "3", name: "Clothing", icon: "shirt-outline", color: "#2196F3" },
  { id: "4", name: "Accessories", icon: "watch-outline", color: "#9C27B0" },
  { id: "5", name: "Electronics", icon: "hardware-chip-outline", color: "#FF9800" },
];

// Suppress all Google Maps POI/transit markers — only show our store pins
const CLEAN_MAP_STYLE = [
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
];

const getCategoryDetails = (categoryName: string) => {
  const cat = CATEGORIES.find(c => c.name.toLowerCase() === (categoryName || "").toLowerCase());
  return {
    icon: cat ? cat.icon : "storefront-outline",
    color: cat ? cat.color : "#0F6E56"
  };
};

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [navigateMode, setNavigateMode] = useState(false);

  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);

  const isDark = colorScheme === "dark";

  // Hide tab bar when a store is selected — restore full original style on dismiss
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: selectedStore
        ? { display: "none" }
        : {
            position: "absolute" as const,
            bottom: Platform.OS === "ios" ? 34 : 20,
            left: 20,
            right: 20,
            height: 64,
            borderRadius: 36,
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
            borderTopWidth: 0,
            elevation: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            paddingBottom: 0,
            paddingTop: 0,
          },
    });
  }, [navigation, selectedStore, isDark]);

  useEffect(() => {
    setupLocationAndData();
  }, []);

  const setupLocationAndData = async () => {
    // 1. Request location
    let { status } = await Location.requestForegroundPermissionsAsync();
    let initialLocation = {
      latitude: 22.3072, // Vadodara Default
      longitude: 73.1812,
    };

    if (status === "granted") {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        initialLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (e) {
        console.log("Error getting location: ", e);
      }
    }

    setUserLocation(initialLocation);

    // Initial map zoom to location
    mapRef.current?.animateToRegion(
      {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      1000,
    );

    // 2. Fetch stores from FastAPI backend with Offline Fallback
    try {
      const result = await storesApi.list();
      // API returns { stores: [...], total: N }
      const storeList = Array.isArray(result) ? result : (result as any).stores || [];
      setStores(storeList);
      AsyncStorage.setItem('cached_stores', JSON.stringify(storeList)).catch(() => {});
    } catch (e) {
      console.warn("Network error, loading stores from cache...", e);
      try {
        const cached = await AsyncStorage.getItem('cached_stores');
        if (cached) setStores(JSON.parse(cached));
      } catch (cacheErr) {
        console.error("Cache read failed", cacheErr);
      }
    }
  };

  const handleMarkerPress = (store: any) => {
    setSelectedStore(store);
    setNavigateMode(true); // Automatically show navigation preview

    // Animate map to show both user and destination to preview the route
    if (userLocation && store) {
      mapRef.current?.fitToCoordinates(
        [
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          {
            latitude: store.latitude,
            longitude: store.longitude,
          },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
          animated: true,
        },
      );
    }
  };

  const handleDirectionsPress = () => {
    if (!GOOGLE_MAPS_APIKEY) {
      Alert.alert(
        "Navigation Key Missing",
        "To enable real in-app navigation routes, please add your Google Maps API Key to EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.\n\nOpening external maps instead.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Maps",
            onPress: () => {
              const url = Platform.select({
                ios: `maps:0,0?q=${selectedStore.latitude},${selectedStore.longitude}`,
                android: `geo:0,0?q=${selectedStore.latitude},${selectedStore.longitude}(${selectedStore.name})`,
              });
              Linking.openURL(url!);
            },
          },
        ],
      );
      // Even without API key, let's draw a straight line to simulate "in-app" connection mode
      setNavigateMode(true);
      return;
    }
    setNavigateMode(true);

    // Animate map to show both user and destination
    if (userLocation && selectedStore) {
      mapRef.current?.fitToCoordinates(
        [
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          {
            latitude: selectedStore.latitude,
            longitude: selectedStore.longitude,
          },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
          animated: true,
        },
      );
    }
  };

  const colors = {
    bg: isDark ? "#121212" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#000000",
    textDim: isDark ? "#999999" : "#666666",
    searchBg: isDark ? "#2A2A2A" : "#F5F5F5",
    cardBg: isDark ? "#1E1E1E" : "#FFFFFF",
    border: isDark ? "#333333" : "#E0E0E0",
    primary: "#0F6E56",
    iconDefault: isDark ? "#E0E0E0" : "#333333",
  };

  // Filter map markers by selected category (null = show all)
  const filteredStores = selectedCategory
    ? stores.filter(
        (s) => s.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    : stores;

  // Guard: skip stores that have null coordinates (e.g. newly created, not geocoded yet)
  const safeStores = filteredStores.filter(
    (s) => s.latitude != null && s.longitude != null
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 22.3072,
          longitude: 73.1812,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsUserLocation
        toolbarEnabled={false}
        customMapStyle={CLEAN_MAP_STYLE}
        showsMyLocationButton={false}
        userInterfaceStyle={isDark ? "dark" : "light"}
        onPress={() => setSelectedStore(null)}
      >
        {safeStores.map((store) => {
          const { icon, color } = getCategoryDetails(store.category);
          return (
            <Marker
              key={`marker-${store.id}`}
              coordinate={{
                latitude: store.latitude,
                longitude: store.longitude,
              }}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkerPress(store);
              }}
            >
              <View style={styles.pinWrapper}>
                <View style={[styles.pinHead, { backgroundColor: color }]}>
                  <Ionicons name={icon as any} size={15} color="#FFF" />
                </View>
                <View style={[styles.pinTail, { borderTopColor: color }]} />
              </View>
            </Marker>
          );
        })}

        {/* Draw In-App Route to Selected Store */}
        {navigateMode && userLocation && selectedStore && GOOGLE_MAPS_APIKEY ? (
          <MapViewDirections
            origin={userLocation}
            destination={{
              latitude: selectedStore.latitude,
              longitude: selectedStore.longitude,
            }}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor={colors.primary}
            optimizeWaypoints={true}
          />
        ) : navigateMode && userLocation && selectedStore ? (
          /* Fallback straightforward line if no API key is provided for Maps Directions */
          <Polyline
            coordinates={[
              userLocation,
              {
                latitude: selectedStore.latitude,
                longitude: selectedStore.longitude,
              },
            ]}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        ) : null}
      </MapView>

      {/* Top Floating Search & Categories */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 10 }]}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: "rgba(255,255,255,0.97)", borderColor: "rgba(0,0,0,0.06)" },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: "#111" }]}
            placeholder="Search stores, items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#AAAAAA"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() =>
                  setSelectedCategory(isActive ? null : cat.name)
                }
                style={[
                  styles.chip,
                  isActive
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : {
                        backgroundColor: "rgba(255,255,255,0.96)",
                        borderColor: "rgba(0,0,0,0.08)",
                      },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? "#FFF" : "#333"}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? "#FFF" : "#333" },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Floating My Location Button */}
      <TouchableOpacity
        style={[
          styles.myLocationButton,
          {
            backgroundColor: colors.cardBg,
            shadowColor: isDark ? "#000" : "#333",
            bottom: selectedStore ? 260 : 100,
          },
        ]}
        onPress={() => {
          if (userLocation) {
            mapRef.current?.animateToRegion(
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              },
              1000,
            );
          }
        }}
      >
        <Ionicons name="location" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Bottom Popup Card for Store Details */}
      {selectedStore && (
        <View
          style={[
            styles.bottomCardContainer,
          ]}
        >
          <View
            style={[
              styles.storeCard,
              {
                backgroundColor: colors.cardBg,
                shadowColor: isDark ? "#000" : "#333",
                paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text
                style={[styles.storeName, { color: colors.text }]}
                numberOfLines={1}
              >
                {selectedStore.name}
              </Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={styles.ratingText}>{selectedStore.rating}</Text>
              </View>
            </View>

            <View style={styles.categoriesRow}>
              <Text style={[styles.storeCategory, { color: colors.textDim }]}>
                {selectedStore.category || "General Store"}
              </Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: navigateMode
                      ? colors.primary
                      : colors.searchBg,
                  },
                ]}
                onPress={handleDirectionsPress}
              >
                <Ionicons
                  name="navigate"
                  size={20}
                  color={navigateMode ? "#FFF" : colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.searchBg },
                ]}
                onPress={() =>
                  Linking.openURL(
                    `tel:${selectedStore.phone || "+919876543210"}`,
                  )
                }
              >
                <Ionicons name="call" size={20} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewMoreButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.push(`/store/${selectedStore.id}`)}
              >
                <Text style={styles.viewMoreText}>View more</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  // Classic pin marker: circle head + triangle tail
  pinWrapper: {
    alignItems: "center",
  },
  pinHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 5,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 2,
  },
  markerBadge: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  bottomCardContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  storeCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: "#B28200",
    fontWeight: "600",
    fontSize: 13,
  },
  categoriesRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  storeCategory: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  viewMoreButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  viewMoreText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  myLocationButton: {
    position: "absolute",
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
});

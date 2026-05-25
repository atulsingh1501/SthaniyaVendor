import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { stores as storesApi } from "../../utils/api";

export default function StoreProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const colors = {
    bg: isDark ? "#121212" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#000000",
    textDim: isDark ? "#999999" : "#666666",
    surface: isDark ? "#1E1E1E" : "#F8F9FA",
    border: isDark ? "#333333" : "#EAEAEA",
    primary: "#0F6E56",
    headerBg: isDark ? "#121212" : "#FFFFFF",
    searchBg: isDark ? "#2A2A2A" : "#F0F0F0",
  };

  useEffect(() => {
    fetchStoreDetails();
  }, [id]);

  const fetchStoreDetails = async () => {
    try {
      const data = await storesApi.getById(id as string);
      setStore(data);
    } catch (e) {
      console.error('Failed to load store:', e);
    }
    setLoading(false);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${store?.phone || "+919876543210"}`);
  };

  const handleDirections = () => {
    Linking.openURL(
      `https://maps.apple.com/?q=${store?.location_text || store?.name}`,
    );
  };

  const handleWhatsApp = () => {
    Linking.openURL(
      `whatsapp://send?phone=${store?.phone || "919876543210"}&text=Hi, do you have...`,
    );
  };

  if (loading)
    return (
      <View
        style={[
          { flex: 1, justifyContent: "center" },
          { backgroundColor: colors.bg },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  if (!store)
    return (
      <View
        style={[
          { flex: 1, justifyContent: "center", alignItems: "center" },
          { backgroundColor: colors.bg },
        ]}
      >
        <Text style={{ color: colors.textDim }}>Store not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  const filteredProducts =
    store.products?.filter((p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "android" ? 10 : 0),
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <View
            style={[styles.searchBox, { backgroundColor: colors.searchBg }]}
          >
            <Ionicons
              name="search"
              size={20}
              color={colors.textDim}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={`Search in ${store.name}...`}
              placeholderTextColor={colors.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Store Info Card */}
        <View
          style={[
            styles.productInfoCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.infoHeader}>
            <Text style={[styles.storeName, { color: colors.text }]}>
              {store.name}
            </Text>
            <View style={styles.newRatingBadge}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.newRatingText}>{store.rating || "4.5"}</Text>
            </View>
          </View>
          <Text style={[styles.storeSub, { color: colors.textDim }]}>
            {store.category || "General Store"} ·{" "}
            {store.location_text || "Nearby"} · Open now
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn2} onPress={handleCall}>
              <View
                style={[
                  styles.actionIconWrapper,
                  { backgroundColor: "#E1F5EE" },
                ]}
              >
                <Ionicons name="call" size={20} color="#0F6E56" />
              </View>
              <Text style={[styles.actionText2, { color: colors.text }]}>
                Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn2}
              onPress={handleDirections}
            >
              <View
                style={[
                  styles.actionIconWrapper,
                  { backgroundColor: "#EEEDFE" },
                ]}
              >
                <Ionicons name="navigate" size={20} color="#3C3489" />
              </View>
              <Text style={[styles.actionText2, { color: colors.text }]}>
                Directions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn2}
              onPress={handleWhatsApp}
            >
              <View
                style={[
                  styles.actionIconWrapper,
                  { backgroundColor: "#FAEEDA" },
                ]}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#854F0B" />
              </View>
              <Text style={[styles.actionText2, { color: colors.text }]}>
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.catalogTitle, { color: colors.text }]}>
            All Items
          </Text>
          <Text style={[styles.catalogCount, { color: colors.textDim }]}>
            {filteredProducts.length} items
          </Text>
        </View>

        <View style={styles.productsContainer}>
          {filteredProducts.length === 0 ? (
            <Text
              style={{
                color: colors.textDim,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No items found matching your search.
            </Text>
          ) : (
            filteredProducts.map((product: any, index: number) => (
              <View
                key={product.id}
                style={[
                  styles.productRow,
                  { borderBottomColor: colors.border },
                  index === filteredProducts.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <View style={styles.productDetails}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {product.name}
                  </Text>
                  <Text
                    style={[styles.productCategory, { color: colors.textDim }]}
                  >
                    {product.category || "Item"}
                  </Text>
                </View>

                {!product.is_in_stock ? (
                  <View style={{ alignItems: "flex-end" }}>
                    <View style={styles.oosBadge}>
                      <Text style={styles.productOOS}>Out of stock</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.notifyBtn}
                      onPress={() =>
                        alert(`Stock alert set for ${product.name}!`)
                      }
                    >
                      <Ionicons
                        name="notifications-outline"
                        size={12}
                        color="#0F6E56"
                      />
                      <Text style={styles.notifyText}>Notify Me</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text
                    style={[styles.productPrice, { color: colors.primary }]}
                  >
                    {typeof product.price === "number"
                      ? `₹${product.price.toFixed(2)}`
                      : product.price}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  iconButton: {
    padding: 8,
    marginRight: 4,
  },
  searchContainer: {
    flex: 1,
    paddingRight: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  scrollContent: {
    padding: 16,
  },
  productInfoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  storeName: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  newRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  newRatingText: {
    color: "#B28200",
    fontWeight: "600",
    fontSize: 13,
  },
  storeSub: {
    fontSize: 15,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 16,
  },
  actionBtn2: {
    alignItems: "center",
    gap: 8,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText2: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  catalogCount: {
    fontSize: 14,
  },
  productsContainer: {
    borderRadius: 12,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  productDetails: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 13,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  oosBadge: {
    backgroundColor: "#FDEAEA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  productOOS: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "600",
  },
  notifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  notifyText: {
    fontSize: 13,
    color: "#0F6E56",
    fontWeight: "600",
  },
});

import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, TouchableOpacity, ActivityIndicator
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { API_URL, GOOGLE_PLACES_KEY } from "../../constants/api";

type Dish = {
  name: string;
  rewritten_description: string;
  category: string;
  food_groups: Record<string, boolean>;
  plate_annotations: Record<string, string>;
};

type PlaceDetails = {
  name: string;
  formatted_address: string;
  rating: number;
  website: string;
  price_level: number;
  formatted_phone_number: string;
  photos: any[];
  opening_hours: { weekday_text: string[] };
};

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [menu, setMenu] = useState<Dish[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchDetails = async () => {
      const res = await fetch(`${API_URL}/places/details/${id}`);
      const data = await res.json();
      setDetails(data.result);
      setLoadingDetails(false);

      // auto fetch menu if website exists
      if (data.result?.website) {
        fetchMenu(data.result.website);
      }
    };

    fetchDetails();
  }, [id]);

  const fetchMenu = async (website: string) => {
    setLoadingMenu(true);
    setMenuError("");
    try {
        const res = await fetch(
        `${API_URL}/menu/${id}?website=${encodeURIComponent(website)}&name=${encodeURIComponent(details?.name || "")}`
        );
        const data = await res.json();
        if (data.error) {
        setMenuError(data.error);
        } else {
        setMenu(data.menu || []);
        }
    } catch (e) {
        setMenuError("Could not load menu");
    } finally {
        setLoadingMenu(false);
    }
    };

  const categories = ["all", ...Array.from(new Set(menu.map(d => d.category)))];
  const filteredMenu = activeCategory === "all" ? menu : menu.filter(d => d.category === activeCategory);

  const heroPhoto = details?.photos?.[0]?.photo_reference
    ? `${API_URL}/places/photo?photo_reference=${details.photos[0].photo_reference}`
    : null;

  if (loadingDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#C4A882" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* back button */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* hero image */}
        {heroPhoto && (
          <Image source={{ uri: heroPhoto }} style={styles.hero} />
        )}

        {/* restaurant info */}
        <View style={styles.info}>
          <Text style={styles.name}>{details?.name}</Text>
          <Text style={styles.address}>{details?.formatted_address}</Text>
          <View style={styles.meta}>
            {details?.rating && <Text style={styles.rating}>★ {details.rating}</Text>}
            {details?.price_level && <Text style={styles.price}>{"$".repeat(details.price_level)}</Text>}
            {details?.formatted_phone_number && (
              <Text style={styles.phone}>{details.formatted_phone_number}</Text>
            )}
          </View>
        </View>

        {/* menu section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu</Text>

          {loadingMenu ? (
            <View style={styles.menuLoading}>
              <ActivityIndicator color="#C4A882" />
              <Text style={styles.menuLoadingText}>Rewriting menu for your recovery journey...</Text>
            </View>
          ) : menuError ? (
            <View style={styles.menuError}>
              <Text style={styles.menuErrorText}>{menuError}</Text>
              {details?.website && (
                <TouchableOpacity onPress={() => fetchMenu(details.website)}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : menu.length === 0 ? (
            <Text style={styles.noMenu}>No menu found for this restaurant.</Text>
          ) : (
            <>
              {/* category filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* dishes */}
              {filteredMenu.map((dish, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.dish}
                  onPress={() => router.push({ pathname: "/dish/[id]", params: { id: dish.name, dish: JSON.stringify(dish) } })}
                >
                  <View style={styles.dishHeader}>
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishCategory}>{dish.category}</Text>
                  </View>
                  <Text style={styles.dishDesc}>{dish.rewritten_description}</Text>
                  <View style={styles.foodGroups}>
                    {Object.entries(dish.food_groups)
                      .filter(([_, v]) => v)
                      .map(([k]) => (
                        <View key={k} style={styles.foodGroupTag}>
                          <Text style={styles.foodGroupText}>{k}</Text>
                        </View>
                      ))}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F3" },
  back: { padding: 16 },
  backText: { color: "#C4A882", fontSize: 16 },
  hero: { width: "100%", height: 220 },
  info: { padding: 20 },
  name: { fontSize: 24, fontWeight: "700", color: "#3D2C2C" },
  address: { fontSize: 13, color: "#999", marginTop: 4 },
  meta: { flexDirection: "row", gap: 12, marginTop: 8 },
  rating: { fontSize: 14, color: "#C4A882", fontWeight: "500" },
  price: { fontSize: 14, color: "#8B6F4E" },
  phone: { fontSize: 14, color: "#8B6F4E" },
  menuSection: { padding: 20 },
  menuTitle: { fontSize: 20, fontWeight: "700", color: "#3D2C2C", marginBottom: 16 },
  menuLoading: { alignItems: "center", gap: 12, paddingVertical: 40 },
  menuLoadingText: { color: "#8B6F4E", fontSize: 14, textAlign: "center" },
  menuError: { alignItems: "center", gap: 8, paddingVertical: 20 },
  menuErrorText: { color: "#999", fontSize: 14 },
  retryText: { color: "#C4A882", fontSize: 14 },
  noMenu: { color: "#999", fontSize: 14, textAlign: "center", paddingVertical: 20 },
  categories: { marginBottom: 16 },
  categoryBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#EEE8E0", marginRight: 8
  },
  categoryBtnActive: { backgroundColor: "#C4A882" },
  categoryText: { fontSize: 13, color: "#8B6F4E" },
  categoryTextActive: { color: "#FFF", fontWeight: "600" },
  dish: {
    backgroundColor: "#FFF", borderRadius: 16,
    padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1
  },
  dishHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dishName: { fontSize: 16, fontWeight: "600", color: "#3D2C2C", flex: 1 },
  dishCategory: { fontSize: 11, color: "#999", textTransform: "uppercase" },
  dishDesc: { fontSize: 14, color: "#666", lineHeight: 20, marginTop: 6 },
  foodGroups: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  foodGroupTag: {
    backgroundColor: "#F0EAE0", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4
  },
  foodGroupText: { fontSize: 11, color: "#8B6F4E", textTransform: "capitalize" }
});
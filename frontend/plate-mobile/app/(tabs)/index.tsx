import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator,
  TextInput
} from "react-native";
import { router } from "expo-router";
import { usePlaces, Restaurant } from "../../hooks/usePlaces";
import { API_URL } from "../../constants/api";

// Toronto coords as default — update based on user location later
const DEFAULT_LAT = 43.6532;
const DEFAULT_LNG = -79.3832;

export default function DiscoverScreen() {
  const [view, setView] = useState<"list" | "map">("list");
  const [coords, setCoords] = useState({ lat: 43.6532, lng: -79.3832 });
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);


  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // fall back to Toronto default
    );
  }, []);
  
  const geocodeAndSearch = async (query: string) => {
    const res = await fetch(`${API_URL}/places/geocode?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      setCoords({ lat, lng });
    }
  };

  const handleSearchChange = async (text: string) => {
    setSearch(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(`${API_URL}/places/autocomplete?query=${encodeURIComponent(text)}`);
    const data = await res.json();
    setSuggestions(data.predictions || []);
  };

  const handleSuggestionSelect = async (description: string) => {
    setSearch(description);
    setSuggestions([]);
    geocodeAndSearch(description);
  };

  const { restaurants, loading } = usePlaces(coords.lat, coords.lng);

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/restaurant/${item.id}`)}
    >
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImagePlaceholderText}>🍽</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardAddress}>{item.address}</Text>
        <View style={styles.cardMeta}>
          {item.rating && (
            <Text style={styles.cardRating}>★ {item.rating}</Text>
          )}
          {item.priceLevel && (
            <Text style={styles.cardPrice}>{"$".repeat(item.priceLevel)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === "list" && styles.toggleActive]}
            onPress={() => setView("list")}
          >
            <Text style={[styles.toggleText, view === "list" && styles.toggleTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === "map" && styles.toggleActive]}
            onPress={() => setView("map")}
          >
            <Text style={[styles.toggleText, view === "map" && styles.toggleTextActive]}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search a city or neighbourhood..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={handleSearchChange}
        returnKeyType="search"
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s.place_id}
              style={styles.suggestion}
              onPress={() => handleSuggestionSelect(s.description)}
            >
              <Text style={styles.suggestionText}>{s.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#C4A882" />
          <Text style={styles.loadingText}>Finding restaurants nearby...</Text>
        </View>
      ) : view === "list" ? (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>🗺</Text>
          <Text style={styles.mapPlaceholderLabel}>Map view coming soon</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F3" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8E0"
  },
  title: { fontSize: 24, fontWeight: "700", color: "#3D2C2C" },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#EEE8E0",
    borderRadius: 8,
    padding: 2
  },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  toggleActive: { backgroundColor: "#FFF" },
  toggleText: { fontSize: 14, color: "#999" },
  toggleTextActive: { color: "#3D2C2C", fontWeight: "600" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#8B6F4E", fontSize: 14 },
  list: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  cardImage: { width: "100%", height: 180 },
  cardImagePlaceholder: {
    backgroundColor: "#F0EAE0",
    justifyContent: "center",
    alignItems: "center"
  },
  cardImagePlaceholderText: { fontSize: 40 },
  cardBody: { padding: 16, gap: 4 },
  cardName: { fontSize: 17, fontWeight: "600", color: "#3D2C2C" },
  cardAddress: { fontSize: 13, color: "#999" },
  cardMeta: { flexDirection: "row", gap: 12, marginTop: 4 },
  cardRating: { fontSize: 13, color: "#C4A882", fontWeight: "500" },
  cardPrice: { fontSize: 13, color: "#8B6F4E" },
  mapPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  mapPlaceholderText: { fontSize: 48 },
  mapPlaceholderLabel: { fontSize: 14, color: "#999" },
  searchContainer: { marginHorizontal: 20, marginBottom: 12, zIndex: 10 },
searchBar: {
  backgroundColor: "#FFF",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 10,
  fontSize: 14,
  color: "#3D2C2C",
  borderWidth: 1,
  borderColor: "#EEE8E0"
},
suggestions: {
  backgroundColor: "#FFF",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#EEE8E0",
  marginTop: 4,
  overflow: "hidden"
},
suggestion: {
  padding: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#F5F0EB"
},
suggestionText: { fontSize: 14, color: "#3D2C2C" }
});
import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator
} from "react-native";
import { supabase } from "../../lib/supabase";
import { API_URL } from "../../constants/api";

type Challenge = {
  id: string;
  dish: string;
  component: string;
  description: string;
  status: "pending" | "completed" | "skipped";
  created_at: string;
};

export default function ChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    console.log("Fetching challenges for:", session.user.id);
    const res = await fetch(`${API_URL}/chat/sessions/${session.user.id}/challenges`);
    const data = await res.json();
    console.log("Challenges response:", data);
    setChallenges(data.challenges || []);
    setLoading(false);
    };

    const deleteChallenge = async (id: string) => {
        await fetch(`${API_URL}/challenges/${id}`, { method: "DELETE" });
        setChallenges(prev => prev.filter(c => c.id !== id));
    };

  const updateStatus = async (id: string, status: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`${API_URL}/challenges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    setChallenges(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
  };

  const filtered = filter === "all" ? challenges : challenges.filter(c => c.status === filter);

  const renderChallenge = ({ item }: { item: Challenge }) => (
    <View style={[styles.card, item.status === "completed" && styles.cardCompleted]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitles}>
          <Text style={styles.dishName}>{item.dish}</Text>
          <Text style={styles.component}>{item.component}</Text>
        </View>
        <View style={[styles.badge, styles[`badge_${item.status}`]]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      {item.status === "pending" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => updateStatus(item.id, "completed")}
          >
            <Text style={styles.completeBtnText}>✓ I did it</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => updateStatus(item.id, "skipped")}
          >
            <Text style={styles.skipBtnText}>not today</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteChallenge(item.id)}
        >
        <Text style={styles.deleteBtnText}>✕ remove</Text>
        </TouchableOpacity>

      {item.status === "completed" && (
        <Text style={styles.completedMsg}>✦ Well done — that took courage 💛</Text>
      )}

      {item.status === "skipped" && (
        <TouchableOpacity onPress={() => updateStatus(item.id, "pending")}>
          <Text style={styles.retryText}>move back to pending</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Challenges</Text>
        <Text style={styles.subtitle}>{challenges.filter(c => c.status === "completed").length} of {challenges.length} completed</Text>
      </View>

      {/* filter tabs */}
      <View style={styles.filters}>
        {(["all", "pending", "completed"] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#C4A882" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyText}>
            {filter === "all"
              ? "No challenges yet — browse a menu to add one"
              : `No ${filter} challenges`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderChallenge}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchChallenges}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F3" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#3D2C2C" },
  subtitle: { fontSize: 13, color: "#999", marginTop: 4 },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16
  },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#EEE8E0"
  },
  filterBtnActive: { backgroundColor: "#C4A882" },
  filterText: { fontSize: 13, color: "#8B6F4E" },
  filterTextActive: { color: "#FFF", fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1
  },
  cardCompleted: { opacity: 0.7 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardTitles: { flex: 1 },
  dishName: { fontSize: 16, fontWeight: "600", color: "#3D2C2C" },
  component: { fontSize: 12, color: "#999", marginTop: 2, textTransform: "capitalize" },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  badge_pending: { backgroundColor: "#FFF3E0" },
  badge_completed: { backgroundColor: "#E8F5E9" },
  badge_skipped: { backgroundColor: "#F5F5F5" },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize", color: "#666" },
  description: { fontSize: 14, color: "#8B6F4E", lineHeight: 20, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 8 },
  completeBtn: {
    flex: 1, backgroundColor: "#7BC67E", borderRadius: 10,
    paddingVertical: 10, alignItems: "center"
  },
  completeBtnText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  skipBtn: {
    flex: 1, backgroundColor: "#F5F0EB", borderRadius: 10,
    paddingVertical: 10, alignItems: "center"
  },
  skipBtnText: { color: "#8B6F4E", fontSize: 14 },
  completedMsg: { fontSize: 13, color: "#7BC67E", fontStyle: "italic" },
  retryText: { fontSize: 13, color: "#C4A882", marginTop: 4 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: "#999", textAlign: "center", paddingHorizontal: 40 },
  deleteBtn: {
    paddingVertical: 6,
    alignItems: "center",
    marginTop: 8
    },
    deleteBtnText: { fontSize: 12, color: "#CCC" }
} as any);
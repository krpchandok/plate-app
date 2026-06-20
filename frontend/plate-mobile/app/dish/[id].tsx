import { useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { API_URL } from "../../constants/api";
import { supabase } from "../../lib/supabase";
import PlateView from "../../components/PlateView";

export default function DishScreen() {
  const { dish: dishParam } = useLocalSearchParams<{ dish: string }>();
  const dish = JSON.parse(dishParam || "{}");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");


  const activeGroups = Object.entries(dish.food_groups || {})
    .filter(([_, v]) => v)
    .map(([k]) => k);

  const handleAddChallenge = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`${API_URL}/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        session_id: session.user.id,
        dish: dish.name,
        component: activeGroups.join(", "),
        description: note,
        status: "pending"
        })
    });
    const data = await res.json();

    setSaving(false);
    setSaved(true);
    if (data.status === "duplicate") {
        setSavedMsg("You've already added this dish as a challenge!");
    } else {
        setSavedMsg("✦ Added to your challenges");
    }
};

    const handleDeleteChallenge = async () => {
        // find challenge by dish name
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`${API_URL}/chat/sessions/${session.user.id}/challenges`);
        const data = await res.json();
        const challenge = data.challenges?.find((c: any) => c.dish === dish.name);
        
        if (challenge) {
            await fetch(`${API_URL}/challenges/${challenge.id}`, { method: "DELETE" });
            setSaved(false);
            setNote("");
            setSavedMsg("");
        }
        };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.name}>{dish.name}</Text>
          <Text style={styles.category}>{dish.category}</Text>
        </View>

        <View style={styles.descCard}>
          <Text style={styles.descText}>{dish.rewritten_description}</Text>
        </View>

        <View style={styles.plateSection}>
          <Text style={styles.sectionTitle}>What's on your plate</Text>
          <PlateView
            foodGroups={dish.food_groups || {}}
            annotations={dish.plate_annotations || {}}
          />
        </View>

        <View style={styles.notebookSection}>
          <Text style={styles.sectionTitle}>Add to your challenges</Text>
          <Text style={styles.notebookPrompt}>
            What feels challenging about this dish? What would trying it mean for you?
          </Text>
          <View style={styles.notebook}>
            <TextInput
              style={styles.notebookInput}
              multiline
              placeholder="Write a note to yourself..."
              placeholderTextColor="#C4B89A"
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
          </View>
          {saved ? (
            <View style={styles.savedBanner}>
                <Text style={styles.savedText}>{savedMsg}</Text>
                <TouchableOpacity onPress={handleDeleteChallenge} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>remove challenge</Text>
                </TouchableOpacity>
            </View>
            ) : (
            <TouchableOpacity
              style={[styles.addButton, !note.trim() && styles.addButtonDisabled]}
              onPress={handleAddChallenge}
              disabled={!note.trim() || saving}
            >
              <Text style={styles.addButtonText}>
                {saving ? "Saving..." : "Add Challenge"}
              </Text>
            </TouchableOpacity>
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
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  name: { fontSize: 26, fontWeight: "700", color: "#3D2C2C" },
  category: { fontSize: 12, color: "#999", textTransform: "uppercase", marginTop: 4 },
  descCard: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: "#FFF", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1
  },
  descText: { fontSize: 15, color: "#3D2C2C", lineHeight: 24 },
  plateSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#3D2C2C", marginBottom: 12 },
  notebookSection: { paddingHorizontal: 20, marginBottom: 40 },
  notebookPrompt: { fontSize: 14, color: "#8B6F4E", marginBottom: 16, lineHeight: 20 },
  notebook: {
    backgroundColor: "#FFFDF7",
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#EEE8E0",
    minHeight: 160, marginBottom: 16,
    backgroundImage: "repeating-linear-gradient(transparent, transparent 24px, #EEE8E0 24px, #EEE8E0 25px)"
  } as any,
  notebookInput: {
    fontSize: 15, color: "#3D2C2C", lineHeight: 25,
    minHeight: 144, outlineStyle: "none"
    } as any,
  addButton: {
    backgroundColor: "#C4A882", borderRadius: 12,
    paddingVertical: 16, alignItems: "center"
  },
  addButtonDisabled: { backgroundColor: "#E8E0D8" },
  addButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  savedBanner: {
    backgroundColor: "#F0EAE0", borderRadius: 12,
    paddingVertical: 16, alignItems: "center"
  },
  savedText: { color: "#8B6F4E", fontSize: 15, fontWeight: "500" },
  deleteBtn: { marginTop: 8, alignItems: "center" },
    deleteBtnText: { fontSize: 12, color: "#BBB" }
});
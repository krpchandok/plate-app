import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView
} from "react-native";
import { useChat } from "../../hooks/useChat";

export default function ChatScreen() {
  const { messages, connected, sendMessage, challenges } = useChat();
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>Recovery Companion</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: connected ? "#7BC67E" : "#ccc" }]} />
            <Text style={styles.statusText}>{connected ? "connected" : "connecting..."}</Text>
          </View>
        </View>

        {/* messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            if (item.role === "separator") {
                return (
                <View style={styles.separator}>
                    <View style={styles.separatorLine} />
                    <Text style={styles.separatorText}>resumed</Text>
                    <View style={styles.separatorLine} />
                </View>
                );
            }
            return (
                <View style={[
                styles.bubble,
                item.role === "user" ? styles.userBubble : styles.assistantBubble
                ]}>
                <Text style={[
                    styles.bubbleText,
                    item.role === "user" ? styles.userText : styles.assistantText
                ]}>
                    {item.content}
                </Text>
                </View>
            );
            }}
        />


        {/* input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="How are you feeling today..."
            placeholderTextColor="#999"
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F3" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: { fontSize: 18, fontWeight: "600", color: "#3D2C2C" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: "#999" },
  messages: { padding: 16, gap: 12 },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#C4A882" },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "#FFF", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#FFF" },
  assistantText: { color: "#3D2C2C" },
  challengeBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#F0EAE0",
    borderRadius: 12,
    padding: 10,
    alignItems: "center"
  },
  challengeBarText: { fontSize: 13, color: "#8B6F4E", fontWeight: "500" },
  inputRow: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEE8E0"
  },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#3D2C2C",
    borderWidth: 1,
    borderColor: "#EEE8E0"
  },
  sendButton: {
    backgroundColor: "#C4A882",
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: "center"
  },
  sendButtonDisabled: { backgroundColor: "#E8E0D8" },
  sendText: { color: "#FFF", fontWeight: "600" },
  separator: {
  flexDirection: "row",
  alignItems: "center",
  marginVertical: 12,
  gap: 8
},
separatorLine: {
  flex: 1,
  height: 1,
  backgroundColor: "#EEE8E0"
},
separatorText: {
  fontSize: 12,
  color: "#BBB",
  fontStyle: "italic"
},
});
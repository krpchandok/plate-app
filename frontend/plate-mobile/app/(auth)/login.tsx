import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform
} from "react-native";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.replace("/(tabs)/chat");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>plate</Text>
        <Text style={styles.subtitle}>your recovery dining companion</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "..." : isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.toggle}>
              {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F3" },
  inner: { flex: 1, justifyContent: "center", padding: 32 },
  title: { fontSize: 48, fontWeight: "700", color: "#3D2C2C", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#8B6F4E", textAlign: "center", marginBottom: 48 },
  form: { gap: 12 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#3D2C2C",
    borderWidth: 1,
    borderColor: "#EEE8E0"
  },
  error: { color: "#C0392B", fontSize: 13, textAlign: "center" },
  button: {
    backgroundColor: "#C4A882",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  toggle: { color: "#8B6F4E", fontSize: 14, textAlign: "center", marginTop: 8 }
});
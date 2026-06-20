import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { supabase } from "../lib/supabase";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoading(false);
      if (!session) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      {loading && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FDF8F3", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <ActivityIndicator color="#C4A882" />
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
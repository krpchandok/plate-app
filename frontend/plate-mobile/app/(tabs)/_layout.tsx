import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: "#FDF8F3", borderTopColor: "#EEE8E0" },
      tabBarActiveTintColor: "#C4A882",
      tabBarInactiveTintColor: "#999"
    }}>
      <Tabs.Screen name="index" options={{ title: "Discover" }} />
      <Tabs.Screen name="challenges" options={{ title: "Challenges" }} />
      <Tabs.Screen name="chat" options={{ title: "Companion" }} />
    </Tabs>
  );
}
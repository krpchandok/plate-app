import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import ChatScreen from './app/(tabs)/chat';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#FDF8F3", borderTopColor: "#EEE8E0" },
        tabBarActiveTintColor: "#C4A882",
        tabBarInactiveTintColor: "#999"
      }}>
        <Tab.Screen name="Companion" component={ChatScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
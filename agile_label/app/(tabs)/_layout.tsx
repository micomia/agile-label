import { Tabs } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';


export default function TabLayout() {
  return (
    <Tabs
    screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerStyle: {
        backgroundColor: Colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        tabBarStyle: {
        backgroundColor: Colors.background,
        },
    }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'その他',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
    </Tabs>
  );
}

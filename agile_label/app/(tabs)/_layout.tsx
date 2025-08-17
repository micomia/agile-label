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
        name="(home)"
        options={{
          title: 'ホーム', // タブバーに表示される文字
          headerShown: false, // ヘッダーを非表示にして、各画面で独自のヘッダーを使用
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'その他', // タブバーに表示される文字
          headerShown: false, // ヘッダーを非表示にして、各画面で独自のヘッダーを使用
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
    </Tabs>
  );
}

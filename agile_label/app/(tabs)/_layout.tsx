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
          title: 'ホーム', // タブバーに表示される文字
          headerTitle: 'データセット', // 画面上部のヘッダーに表示される文字
          headerTitleAlign: 'left', // ヘッダータイトルを左詰めに
          headerTitleStyle: {
            fontSize: 24, // フォントサイズを大きく
            fontWeight: 'bold',
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'その他', // タブバーに表示される文字
          headerTitle: 'その他', // 画面上部のヘッダーに表示される文字
          headerTitleAlign: 'left', // ヘッダータイトルを左詰めに
          headerTitleStyle: {
            fontSize: 24, // フォントサイズを大きく
            fontWeight: 'bold',
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
    </Tabs>
  );
}

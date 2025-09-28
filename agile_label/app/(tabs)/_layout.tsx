import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';


export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: Colors.primary,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: Colors.text,
          tabBarStyle: {
            backgroundColor: Colors.background,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            height: Platform.OS === 'ios' ? 84 : 70 + insets.bottom, // Androidの高さをさらに増やして余裕を持たせる
            paddingBottom: Platform.OS === 'ios' ? 34 : Math.max(insets.bottom + 4, 12), // Androidのパディングを調整
            paddingTop: Platform.OS === 'ios' ? 4 : 8, // Androidではより上に配置してシステムナビゲーションバーを避ける
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            // カメラ画面の設定をリセット
            display: 'flex',
            opacity: 1,
            overflow: 'visible',
          },
        })}
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
    </>
  );
}

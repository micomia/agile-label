import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { setGlobalFontFamily } from '../constants/FontStyles';
import { AdProvider } from '../contexts/AdContext';
import { DatasetProvider } from '../contexts/DatasetContext';

// スプラッシュスクリーンを表示し続ける
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'NotoSansJP': require('../assets/fonts/NotoSansJP-Regular.ttf'),
    'NotoSansJP-Medium': require('../assets/fonts/NotoSansJP-Medium.ttf'),
    'NotoSansJP-SemiBold': require('../assets/fonts/NotoSansJP-SemiBold.ttf'),
    'NotoSansJP-Bold': require('../assets/fonts/NotoSansJP-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      // グローバルフォントを設定
      setGlobalFontFamily();
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  return (
    <AdProvider>
      <DatasetProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="create" 
            options={{ 
              presentation: 'modal',
              headerShown: false,
              animation: 'slide_from_bottom',
            }} 
          />
          <Stack.Screen 
            name="terms" 
            options={{ 
              headerShown: false, // カスタムヘッダーを使用するため非表示
            }} 
          />
          <Stack.Screen 
            name="privacy" 
            options={{ 
              headerShown: false, // カスタムヘッダーを使用するため非表示
            }} 
          />
          <Stack.Screen 
            name="licenses" 
            options={{ 
              headerShown: false, // カスタムヘッダーを使用するため非表示
            }} 
          />
        </Stack>
      </DatasetProvider>
    </AdProvider>
  );
}

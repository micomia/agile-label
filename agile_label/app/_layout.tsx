import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
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
    </Stack>
  );
}

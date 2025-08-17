import { Stack } from 'expo-router';
import { DatasetProvider } from '../contexts/DatasetContext';

export default function RootLayout() {
  return (
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
      </Stack>
    </DatasetProvider>
  );
}

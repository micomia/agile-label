import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false // タブレイアウトでヘッダーを表示するため
        }} 
      />
      <Stack.Screen 
        name="dataset/[id]" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }} 
      />
    </Stack>
  );
}

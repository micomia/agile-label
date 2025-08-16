// Colorsという色をまとめたtsxファイルを作成し、定数を定義してインポートしています。
import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import { FloatingActionButton } from '../../components/FloatingActionButton'; 

export default function Index() {
  const handleFabPress = () => {
    router.push('/create');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>データセットを作成しましょう</Text>
      {/* Floating Action Button */}
      <FloatingActionButton onPress={handleFabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

import { Text, View, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* カスタムヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>その他</Text>
      </View>
      
      {/* メインコンテンツエリア */}
      <View style={styles.content}>
        <Text style={styles.text}>About screen</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    color: Colors.text,
  },
});

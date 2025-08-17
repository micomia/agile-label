import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { useDatasets } from '../../../../contexts/DatasetContext';
import { ImageGallery } from '../../../../components/ImageGallery';
import { FloatingActionButton } from '../../../../components/FloatingActionButton';

export default function DatasetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datasets } = useDatasets();
  
  // IDに基づいてデータセットを取得
  const dataset = datasets.find(d => d.id === id);

  const handleCameraPress = () => {
    // TODO: カメラ機能を実装
    console.log('カメラを開く');
  };

  if (!dataset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>データセットが見つかりません</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>データセットが見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{dataset.name}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 統計情報バー */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="images-outline" size={16} color={Colors.primary} />
          <Text style={styles.statText}>{dataset.imageCount}枚</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="pricetags-outline" size={16} color={Colors.primary} />
          <Text style={styles.statText}>{dataset.labelCount}クラス</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
          <Text style={styles.statText}>
            {dataset.createdAt.toLocaleDateString('ja-JP')}
          </Text>
        </View>
      </View>

      {/* 画像ギャラリー */}
      <ImageGallery images={dataset.images} />
      
      {/* カメラボタン */}
      <FloatingActionButton 
        onPress={handleCameraPress}
        iconLibrary="Ionicons"
        ioniconsName="camera"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
  },
});

// Colorsという色をまとめたtsxファイルを作成し、定数を定義してインポートしています。
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { router, useFocusEffect } from 'expo-router';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { Ionicons } from '@expo/vector-icons';
import { useDatasets, Dataset } from '../../../contexts/DatasetContext';
import { createAndShareDatasetZip } from '../../../utils/fileUtils';
import React from 'react';

export default function Index() {
  const { datasets, isLoading, deleteDataset, loadDatasetImages } = useDatasets();

  // フォーカス時にデータセットの画像を読み込む
  useFocusEffect(
    React.useCallback(() => {
      // 存在するデータセットのIDのみを使用
      datasets.forEach(dataset => {
        loadDatasetImages(dataset.id);
      });
    }, [datasets, loadDatasetImages])
  );

  const handleFabPress = () => {
    router.push('/create');
  };

  const handleDeleteDataset = (dataset: Dataset) => {
    Alert.alert(
      'データセットを削除',
      `「${dataset.name}」を削除しますか？この操作は取り消せません。`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteDataset(dataset.id),
        },
      ]
    );
  };

  const handleShareDataset = async (dataset: Dataset) => {
    if (dataset.images.length === 0) {
      Alert.alert('保存できません', '画像が1枚もないため、データセットを保存できません。');
      return;
    }

    // 直接ファイルとして保存（iOSシェア画面を表示）
    await createAndShareDatasetZip(dataset.images, dataset.name, dataset.id);
  };

  const handleCardPress = (dataset: Dataset) => {
    router.push(`/dataset/${dataset.id}`);
  };

  // データセットカードをレンダリングする関数
  const renderDatasetCard = ({ item }: { item: Dataset }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleCardPress(item)}
      onLongPress={() => handleDeleteDataset(item)}
      delayLongPress={500}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleShareDataset(item);
          }}
          style={styles.shareButton}
        >
          <Ionicons name="download-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      {item.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <Ionicons name="image-outline" size={16} color={Colors.text + '60'} />
        <Text style={styles.imageCount}>{item.imageCount}枚</Text>
        <Ionicons name="pricetag-outline" size={16} color={Colors.text + '60'} style={styles.labelIcon} />
        <Text style={styles.labelCount}>{item.labelCount}クラス</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* カスタムヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>データセット</Text>
      </View>
      
      {/* メインコンテンツエリア */}
      {isLoading ? (
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      ) : datasets.length === 0 ? (
        <View style={styles.emptyContent}>
          <Ionicons name="folder-outline" size={48} color={Colors.text + '40'} />
          <Text style={styles.emptyText}>データセットがありません</Text>
          <Text style={styles.emptySubtext}>データセットを作成しましょう</Text>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={datasets}
          renderItem={renderDatasetCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Floating Action Button */}
      <FloatingActionButton onPress={handleFabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    // Androidでのステータスバー対応
    paddingTop: Platform.OS === 'android' ? 24 : 0,
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -60, // ヘッダー分を考慮して少し上に移動
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -60, // ヘッダー分を考慮して少し上に移動
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text + '80',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text + '60',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingBottom: 100, // FABとの重複を避ける
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareButton: {
    padding: 4,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.text + '80',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCount: {
    fontSize: 12,
    color: Colors.text + '60',
    marginLeft: 4,
  },
  labelIcon: {
    marginLeft: 12,
  },
  labelCount: {
    fontSize: 12,
    color: Colors.text + '60',
    marginLeft: 4,
  },
});

import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { useDatasets } from '../../../../contexts/DatasetContext';
import { ImageGallery } from '../../../../components/ImageGallery';
import { FloatingActionButton } from '../../../../components/FloatingActionButton';
import React from 'react';

export default function DatasetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    datasets, 
    loadDatasetImages, 
    deleteBboxFromImage,
    deleteImageFromDataset,
    updateBboxInImage,
    addBboxToImage,
    updateImageBboxes
  } = useDatasets();
  
  // IDに基づいてデータセットを取得
  const dataset = datasets.find(d => d.id === id);

  // ページにフォーカスが当たった時に画像を読み込む
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        loadDatasetImages(id);
        // クラス数はloadDatasetImages内で自動的に更新されます
      }
    }, [id, loadDatasetImages])
  );

  const handleCameraPress = () => {
    router.push(`/(tabs)/(home)/camera?datasetId=${id}` as any);
  };

  // ImageGallery用のコールバック関数
  const handleDeleteBbox = (imageId: string, bboxId: string) => {
    if (!id || !dataset) return;
    
    Alert.alert(
      'BBox削除',
      'このバウンディングボックスを削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBboxFromImage(id, imageId, bboxId);
            } catch (error) {
              Alert.alert('エラー', 'バウンディングボックスの削除に失敗しました');
            }
          }
        }
      ]
    );
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!id || !dataset) return;
    
    try {
      await deleteImageFromDataset(id, imageId);
    } catch (error) {
      Alert.alert('エラー', '画像の削除に失敗しました');
    }
  };

  const handleUpdateBbox = async (imageId: string, bboxId: string, updatedBbox: any) => {
    if (!id || !dataset) return;
    
    try {
      await updateBboxInImage(id, imageId, bboxId, updatedBbox);
    } catch (error) {
      Alert.alert('エラー', 'BBoxの更新に失敗しました');
    }
  };

  const handleAddBbox = async (imageId: string, newBbox: any) => {
    if (!id || !dataset) return;
    
    try {
      await addBboxToImage(id, imageId, newBbox);
    } catch (error) {
      Alert.alert('エラー', 'BBoxの追加に失敗しました');
    }
  };

  const handleUpdateImageBboxes = async (imageId: string, newBboxes: any[]) => {
    if (!id || !dataset) return;
    
    try {
      await updateImageBboxes(id, imageId, newBboxes);
    } catch (error) {
      Alert.alert('エラー', 'アノテーションの保存に失敗しました');
    }
  };

  if (!dataset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>データセットが見つかりません</Text>
          <View style={{ width: 40 }} />
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
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{dataset.name}</Text>
        <View style={{ width: 40 }} />
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
      <ImageGallery 
        images={dataset.images} 
        onDeleteBbox={handleDeleteBbox}
        onDeleteImage={handleDeleteImage}
        onUpdateBbox={handleUpdateBbox}
        onAddBbox={handleAddBbox}
        onUpdateImageBboxes={handleUpdateImageBboxes}
      />
      
      {/* カメラボタン */}
      <FloatingActionButton 
        onPress={handleCameraPress}
        iconLibrary="Ionicons"
        ioniconsName="camera"
        showText={true}
        text="camera"
      />
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

import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { useDatasets } from '../../../../contexts/DatasetContext';
import { ImageGallery } from '../../../../components/ImageGallery';
import { FloatingActionButton } from '../../../../components/FloatingActionButton';
import { saveMultipleImagesToFiles, createAndShareDatasetZip } from '../../../../utils/fileUtils';
import React from 'react';

export default function DatasetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datasets, loadDatasetImages, deleteBboxFromImage } = useDatasets();
  
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

  const handleDeleteBbox = async (imageId: string, bboxId: string) => {
    if (!id) return;
    
    try {
      await deleteBboxFromImage(id, imageId, bboxId);
      Alert.alert('削除完了', 'バウンディングボックスが削除されました');
    } catch (error) {
      Alert.alert('エラー', 'バウンディングボックスの削除に失敗しました');
    }
  };

  const handleSaveDataset = () => {
    if (!dataset || dataset.images.length === 0) {
      Alert.alert('エラー', '保存する画像がありません');
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['キャンセル', 'フォトライブラリに保存', 'ファイルとして保存'],
          cancelButtonIndex: 0,
          title: 'データセットを保存'
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleSaveToPhotoLibrary();
          } else if (buttonIndex === 2) {
            handleSaveAsFiles();
          }
        }
      );
    } else {
      Alert.alert(
        'データセットを保存',
        '保存方法を選択してください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'フォトライブラリ', onPress: handleSaveToPhotoLibrary },
          { text: 'ファイル', onPress: handleSaveAsFiles }
        ]
      );
    }
  };

  const handleSaveToPhotoLibrary = async () => {
    if (!dataset) return;
    
    Alert.alert(
      'フォトライブラリに保存',
      `${dataset.images.length}枚の画像をフォトライブラリに保存しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '保存',
          onPress: async () => {
            const success = await saveMultipleImagesToFiles(dataset.images, dataset.name);
            if (success) {
              Alert.alert('保存完了', 'データセットがフォトライブラリに保存されました');
            }
          }
        }
      ]
    );
  };

  const handleSaveAsFiles = async () => {
    if (!dataset) return;
    
    Alert.alert(
      'ファイルとして保存',
      `${dataset.images.length}枚の画像をファイルとして保存しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '保存',
          onPress: async () => {
            const success = await createAndShareDatasetZip(dataset.images, dataset.name, dataset.id);
            if (success) {
              Alert.alert('保存完了', 'ファイルアプリでデータセットを保存できます');
            }
          }
        }
      ]
    );
  };

  if (!dataset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
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
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{dataset.name}</Text>
        <TouchableOpacity onPress={handleSaveDataset} style={styles.saveDatasetButton}>
          <Ionicons name="download-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
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
      />
      
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
  saveDatasetButton: {
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

import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Text,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ImageData, BBox } from '../contexts/DatasetContext';
import { saveImageToFiles } from '../utils/fileUtils';

interface ImageGalleryProps {
  images: ImageData[];
  onDeleteBbox?: (imageId: string, bboxId: string) => void; // bbox削除コールバック
}

const { width: screenWidth } = Dimensions.get('window');
const itemSize = screenWidth / 3; // 3列表示、間隔なし

// クラス毎の色定義
const CLASS_COLORS: { [key: string]: string } = {
  'object': '#FF6B6B',    // 赤
  'person': '#4ECDC4',    // 青緑
  'vehicle': '#45B7D1',   // 青
  'animal': '#96CEB4',    // 緑
  'building': '#FFEAA7',  // 黄
  'food': '#DDA0DD',      // 紫
  'tool': '#FFA07A',      // オレンジ
  'furniture': '#98D8C8', // ミント
};

// デフォルトカラー（新しいクラス用）
const DEFAULT_COLORS = ['#FF9F43', '#10AC84', '#A55EEA', '#FD79A8', '#00B894', '#FDCB6E', '#6C5CE7', '#A29BFE'];

// クラス名から色を取得する関数
function getClassColor(className: string): string {
  if (CLASS_COLORS[className]) {
    return CLASS_COLORS[className];
  }
  // 新しいクラスの場合、文字列のハッシュに基づいて色を決定
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    const char = className.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  const colorIndex = Math.abs(hash) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[colorIndex];
}

export function ImageGallery({ images, onDeleteBbox }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  const modalFlatListRef = useRef<FlatList>(null);

  const handleSaveImage = async (image: ImageData) => {
    Alert.alert(
      '画像を保存',
      'この画像をフォトライブラリに保存しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '保存',
          onPress: async () => {
            const success = await saveImageToFiles(image);
            if (success) {
              Alert.alert('保存完了', '画像がフォトライブラリに保存されました');
            }
          }
        }
      ]
    );
  };

  const handleDeleteBbox = (imageId: string, bboxId: string) => {
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
          onPress: () => {
            if (onDeleteBbox) {
              onDeleteBbox(imageId, bboxId);
            }
          }
        }
      ]
    );
  };

  const renderImageItem = ({ item, index }: { item: ImageData; index: number }) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => {
        setSelectedImageIndex(index);
        // モーダルのFlatListを該当のインデックスにスクロール
        setTimeout(() => {
          modalFlatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      {item.label && (
        <View style={styles.labelOverlay}>
          <Text style={styles.labelText} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      )}
      {item.bboxes && item.bboxes.length > 0 && (
        <View style={styles.bboxCountOverlay}>
          <Ionicons name="square-outline" size={12} color="#ffffff" />
          <Text style={styles.bboxCountText}>
            {item.bboxes.length}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {images.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color={Colors.text + '40'} />
          <Text style={styles.emptyText}>画像がありません</Text>
          <Text style={styles.emptySubtext}>カメラで撮影してデータセットに追加しましょう</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 画像詳細モーダル */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedImageIndex(null)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            {selectedImageIndex !== null && (
              <Text style={styles.imageCounter}>
                {selectedImageIndex + 1} / {images.length}
              </Text>
            )}
            {selectedImageIndex !== null && (
              <TouchableOpacity
                onPress={() => handleSaveImage(images[selectedImageIndex])}
                style={styles.saveButton}
              >
                <Ionicons name="download-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {selectedImageIndex !== null && (
            <FlatList
              ref={modalFlatListRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              initialScrollIndex={selectedImageIndex}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setSelectedImageIndex(newIndex);
              }}
              renderItem={({ item }) => (
                <View style={styles.modalImageContainer}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.fullImage}
                      resizeMode="contain"
                      onLayout={(event) => {
                        const { width, height, x, y } = event.nativeEvent.layout;
                        setImageLayout({ width, height, x, y });
                      }}
                    />
                    
                    {/* BBoxオーバーレイ */}
                    {item.bboxes && item.bboxes.length > 0 && imageLayout && (
                      <View style={styles.bboxOverlay}>
                        {item.bboxes.map((bbox: BBox) => {
                          const bboxColor = getClassColor(bbox.label || 'object');
                          // bboxの座標は画像の実際のサイズに対する相対位置として保存されているため、
                          // 表示される画像のサイズに合わせてスケーリングする
                          const scaledX = (bbox.x / 100) * imageLayout.width;
                          const scaledY = (bbox.y / 100) * imageLayout.height;
                          const scaledWidth = (bbox.width / 100) * imageLayout.width;
                          const scaledHeight = (bbox.height / 100) * imageLayout.height;
                          
                          return (
                            <TouchableOpacity
                              key={bbox.id}
                              style={[
                                styles.bbox,
                                {
                                  left: scaledX,
                                  top: scaledY,
                                  width: scaledWidth,
                                  height: scaledHeight,
                                  borderColor: bboxColor,
                                  backgroundColor: `${bboxColor}30`,
                                }
                              ]}
                              onLongPress={() => {
                                handleDeleteBbox(item.id, bbox.id);
                              }}
                              delayLongPress={800}
                              activeOpacity={0.7}
                            >
                              {/* BBoxラベル */}
                              <View
                                style={[
                                  styles.bboxLabel,
                                  { backgroundColor: bboxColor }
                                ]}
                              >
                                <Text style={styles.bboxLabelText}>
                                  {bbox.label || 'object'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.imageInfo}>
                    {item.label && (
                      <View style={styles.infoRow}>
                        <Ionicons name="pricetag-outline" size={20} color="#ffffff" />
                        <Text style={styles.infoLabel}>ラベル</Text>
                        <Text style={styles.infoValue}>{item.label}</Text>
                      </View>
                    )}
                    
                    {item.bboxes && item.bboxes.length > 0 && (
                      <View style={styles.infoRow}>
                        <Ionicons name="square-outline" size={20} color="#ffffff" />
                        <Text style={styles.infoLabel}>BBox</Text>
                        <Text style={styles.infoValue}>{item.bboxes.length}個</Text>
                      </View>
                    )}
                    
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                      <Text style={styles.infoLabel}>撮影日時</Text>
                      <Text style={styles.infoValue}>
                        {item.createdAt.toLocaleDateString('ja-JP')} {item.createdAt.toLocaleTimeString('ja-JP')}
                      </Text>
                    </View>
                    
                    {item.bboxes && item.bboxes.length > 0 && (
                      <View style={styles.bboxHelp}>
                        <Text style={styles.bboxHelpText}>
                          長押しでBBoxを削除
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    padding: 0,
  },
  imageItem: {
    width: itemSize,
    height: itemSize,
    backgroundColor: Colors.card,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  labelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  labelText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  bboxCountOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bboxCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  imageCounter: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  modalImageContainer: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: screenWidth,
    height: '70%',
  },
  fullImage: {
    width: screenWidth,
    height: '70%',
  },
  bboxOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  bboxLabel: {
    position: 'absolute',
    top: -25,
    left: 0,
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bboxLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imageInfo: {
    padding: 20,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    opacity: 0.8,
  },
  bboxHelp: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  bboxHelpText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
});

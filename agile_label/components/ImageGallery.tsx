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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const itemSize = screenWidth / 3; // 3列表示、間隔なし

// camera.tsxと同じ画面構成（3:4の縦横比）
const topBarHeight = 120;
const bottomBarHeight = 180;
const cameraHeight = screenHeight - topBarHeight - bottomBarHeight;
const cameraWidth = screenWidth;
const aspectRatio = 3 / 4;

// カメラビューを3:4の縦横比に調整
let adjustedCameraWidth = cameraWidth;
let adjustedCameraHeight = cameraWidth / aspectRatio;

if (adjustedCameraHeight > cameraHeight) {
  adjustedCameraHeight = cameraHeight;
  adjustedCameraWidth = cameraHeight * aspectRatio;
}

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

// クラス名から色を取得する関数（camera.tsxから流用・改良）
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
  const [selectedBboxId, setSelectedBboxId] = useState<string | null>(null);
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
                // 画像が変わったらBBox選択をリセット
                setSelectedBboxId(null);
              }}
              renderItem={({ item, index }) => (
                <View style={styles.modalImageContainer}>
                  {/* 上部の黒い帯 - camera.tsxと同じ構成 */}
                  <View style={styles.topBar}>
                    <View style={styles.header}>
                      <TouchableOpacity 
                        style={styles.headerButton} 
                        onPress={() => setSelectedImageIndex(null)}
                      >
                        <Ionicons name="arrow-back" size={24} color="white" />
                      </TouchableOpacity>
                      <Text style={styles.headerTitle}>
                        {index + 1} / {images.length}
                      </Text>
                      <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => handleSaveImage(item)}
                      >
                        <Ionicons name="download-outline" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 中央の画像エリア - camera.tsxと同じ構成 */}
                  <View style={styles.cameraContainer}>
                    <Image
                      source={{ uri: item.uri }}
                      style={{
                        width: adjustedCameraWidth,
                        height: adjustedCameraHeight,
                        resizeMode: 'contain',
                        borderRadius: 8,
                      }}
                      onLayout={(event) => {
                        const { width, height, x, y } = event.nativeEvent.layout;
                        setImageLayout({ width, height, x, y });
                      }}
                    />
                    
                    {/* BBoxオーバーレイ - camera.tsxのアノテーションロジックを流用 */}
                    {item.bboxes && item.bboxes.length > 0 && imageLayout && (
                      <View style={styles.annotationOverlay}>
                        {(() => {
                          console.log('ImageGallery BBox情報:', {
                            imageId: item.id,
                            bboxCount: item.bboxes?.length || 0,
                            imageLayout,
                            adjustedCameraWidth,
                            adjustedCameraHeight,
                            bboxes: item.bboxes
                          });
                          return null;
                        })()}
                        
                        {/* テスト用BBox - 常に左上に表示 */}
                        <View
                          style={{
                            position: 'absolute',
                            left: imageLayout.x + 10,
                            top: imageLayout.y + 10,
                            width: 50,
                            height: 50,
                            borderWidth: 2,
                            borderColor: '#FF0000',
                            backgroundColor: 'rgba(255, 0, 0, 0.3)',
                          }}
                        />
                        
                        {item.bboxes.map((bbox: BBox) => {
                          const bboxColor = getClassColor(bbox.label || 'object');
                          const isSelected = selectedBboxId === bbox.id;
                          
                          // デバッグ用ログ
                          console.log('BBox描画情報:', {
                            bboxId: bbox.id,
                            originalBbox: bbox,
                            imageLayout,
                            scalingType: 'percentage-based'
                          });
                          
                          // camera.tsxと同じ座標計算ロジック
                          // camera.tsxではピクセルベースで直接使用しているため、同じアプローチを採用
                          let scaledX = bbox.x;
                          let scaledY = bbox.y;
                          let scaledWidth = bbox.width;
                          let scaledHeight = bbox.height;
                          
                          // 座標が表示サイズに対する比率の場合、スケーリング
                          if (bbox.x <= 1 && bbox.y <= 1 && bbox.width <= 1 && bbox.height <= 1) {
                            // 比率ベース（0-1の範囲）
                            scaledX = bbox.x * imageLayout.width;
                            scaledY = bbox.y * imageLayout.height;
                            scaledWidth = bbox.width * imageLayout.width;
                            scaledHeight = bbox.height * imageLayout.height;
                            
                            console.log('比率ベースとして描画:', {
                              originalBbox: bbox,
                              scaledX, scaledY, scaledWidth, scaledHeight
                            });
                          } else {
                            console.log('ピクセルベースとして描画:', {
                              originalBbox: bbox,
                              scaledX, scaledY, scaledWidth, scaledHeight
                            });
                          }
                          
                          return (
                            <View key={bbox.id} style={{ position: 'absolute' }}>
                              <TouchableOpacity
                                style={[
                                  styles.bbox,
                                  {
                                    left: imageLayout.x + scaledX,
                                    top: imageLayout.y + scaledY,
                                    width: scaledWidth,
                                    height: scaledHeight,
                                    borderColor: bboxColor,
                                    backgroundColor: `${bboxColor}30`, // 透明度30%
                                    borderWidth: isSelected ? 3 : 2, // 選択時は太い枠
                                    elevation: isSelected ? 3 : 1, // Android用の影
                                    shadowColor: bboxColor, // iOS用の影
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: isSelected ? 0.4 : 0.2,
                                    shadowRadius: isSelected ? 4 : 2,
                                  }
                                ]}
                                onPress={() => {
                                  // タップで選択状態を切り替え
                                  setSelectedBboxId(selectedBboxId === bbox.id ? null : bbox.id);
                                }}
                                onLongPress={() => {
                                  handleDeleteBbox(item.id, bbox.id);
                                }}
                                delayLongPress={800}
                                activeOpacity={0.7}
                              />
                              
                              {/* 選択時のリサイズハンドル - camera.tsxから流用 */}
                              {isSelected && imageLayout && (
                                <>
                                  {/* 四隅のリサイズハンドル */}
                                  <View style={[styles.resizeHandle, {
                                    left: imageLayout.x + scaledX - 7,
                                    top: imageLayout.y + scaledY - 7,
                                    backgroundColor: bboxColor,
                                  }]} />
                                  <View style={[styles.resizeHandle, {
                                    left: imageLayout.x + scaledX + scaledWidth - 7,
                                    top: imageLayout.y + scaledY - 7,
                                    backgroundColor: bboxColor,
                                  }]} />
                                  <View style={[styles.resizeHandle, {
                                    left: imageLayout.x + scaledX - 7,
                                    top: imageLayout.y + scaledY + scaledHeight - 7,
                                    backgroundColor: bboxColor,
                                  }]} />
                                  <View style={[styles.resizeHandle, {
                                    left: imageLayout.x + scaledX + scaledWidth - 7,
                                    top: imageLayout.y + scaledY + scaledHeight - 7,
                                    backgroundColor: bboxColor,
                                  }]} />
                                </>
                              )}
                              
                              {/* BBoxラベル - camera.tsxのスタイルを流用 */}
                              <View
                                style={[
                                  styles.bboxLabel,
                                  {
                                    left: imageLayout.x + scaledX,
                                    top: imageLayout.y + scaledY - 25,
                                    backgroundColor: bboxColor,
                                  }
                                ]}
                              >
                                <Text style={styles.bboxLabelText}>
                                  {bbox.label || 'object'}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* 下部の黒い帯 - camera.tsxと同じ構成 */}
                  <View style={styles.bottomBar}>
                    {/* 画像情報を表示 */}
                    <View style={styles.imageInfoContainer}>
                      {item.label && (
                        <View style={styles.infoItem}>
                          <Ionicons name="pricetag-outline" size={16} color="#ffffff" />
                          <Text style={styles.infoText}>ラベル: {item.label}</Text>
                        </View>
                      )}
                      
                      {item.bboxes && item.bboxes.length > 0 && (
                        <View style={styles.infoItem}>
                          <Ionicons name="square-outline" size={16} color="#ffffff" />
                          <Text style={styles.infoText}>BBox: {item.bboxes.length}個</Text>
                        </View>
                      )}
                      
                      <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={16} color="#ffffff" />
                        <Text style={styles.infoText}>
                          {item.createdAt.toLocaleDateString('ja-JP')} {item.createdAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      
                      {item.bboxes && item.bboxes.length > 0 && (
                        <Text style={styles.helpText}>
                          タップで選択 • 長押しでBBoxを削除
                        </Text>
                      )}
                    </View>
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
  // camera.tsxと同じモーダルスタイル
  modal: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalImageContainer: {
    width: screenWidth,
    flex: 1,
  },
  // camera.tsxと同じレイアウトスタイル
  topBar: {
    height: topBarHeight,
    backgroundColor: 'black',
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  bottomBar: {
    height: bottomBarHeight,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // アノテーション用のスタイル
  annotationOverlay: {
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
  resizeHandle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: '#007AFF',
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
  // 画像情報表示用のスタイル
  imageInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
  },
  helpText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 8,
  },
});

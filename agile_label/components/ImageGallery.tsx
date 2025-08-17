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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ImageData } from '../contexts/DatasetContext';

interface ImageGalleryProps {
  images: ImageData[];
}

const { width: screenWidth } = Dimensions.get('window');
const itemSize = screenWidth / 3; // 3列表示、間隔なし

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const modalFlatListRef = useRef<FlatList>(null);

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
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                  
                  <View style={styles.imageInfo}>
                    {item.label && (
                      <View style={styles.infoRow}>
                        <Ionicons name="pricetag-outline" size={20} color="#ffffff" />
                        <Text style={styles.infoLabel}>ラベル</Text>
                        <Text style={styles.infoValue}>{item.label}</Text>
                      </View>
                    )}
                    
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                      <Text style={styles.infoLabel}>撮影日時</Text>
                      <Text style={styles.infoValue}>
                        {item.createdAt.toLocaleDateString('ja-JP')} {item.createdAt.toLocaleTimeString('ja-JP')}
                      </Text>
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
  fullImage: {
    width: screenWidth,
    height: '70%',
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
});

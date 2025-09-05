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
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../constants/Colors';
import { FontStyles } from '../constants/FontStyles';
import { ImageData, BBox } from '../contexts/DatasetContext';

interface ImageGalleryProps {
  images: ImageData[];
  onDeleteBbox?: (imageId: string, bboxId: string) => void; // bbox削除コールバック
  onDeleteImage?: (imageId: string) => void; // 画像削除コールバック
  onUpdateBbox?: (imageId: string, bboxId: string, updatedBbox: BBox) => void; // bbox更新コールバック
  onAddBbox?: (imageId: string, newBbox: BBox) => void; // bbox追加コールバック
  onUpdateImageBboxes?: (imageId: string, newBboxes: BBox[]) => void; // 画像のBBoxes全体更新コールバック
}

interface HistoryAction {
  type: 'add' | 'delete';
  bbox: BBox;
  timestamp: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const itemSize = screenWidth / 3; // 3列表示、間隔なし

// camera.tsxと同じ画面構成（3:4の縦横比）
const topBarHeight = 120;
const bottomBarHeight = 120; // 180から120に減らして画像領域を確保
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

// クラス名から色を取得する関数（camera.tsxと同じロジック）
function getClassColor(className: string, allClasses?: string[]): string {
  if (CLASS_COLORS[className]) {
    return CLASS_COLORS[className];
  }
  
  // 新しいクラスの場合、インデックスに基づいて色を決定
  if (allClasses) {
    const index = allClasses.indexOf(className);
    if (index >= 0) {
      const colorIndex = index % DEFAULT_COLORS.length;
      return DEFAULT_COLORS[colorIndex];
    }
  }
  
  // allClassesが提供されていない場合は、ハッシュベースで決定（後方互換性）
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    const char = className.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  const colorIndex = Math.abs(hash) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[colorIndex];
}

export function ImageGallery({ images, onDeleteBbox, onDeleteImage, onUpdateBbox, onAddBbox, onUpdateImageBboxes }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  const [selectedBboxId, setSelectedBboxId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false); // 編集モードかどうか
  const [editingBboxes, setEditingBboxes] = useState<BBox[]>([]); // 編集中のBBox配列
  const modalFlatListRef = useRef<FlatList>(null);
  const panGestureRef = useRef(null);
  
  // アノテーション編集用の状態（camera.tsxから移植）
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBbox, setCurrentBbox] = useState<BBox | null>(null);
  const [editMode, setEditMode] = useState<'move' | 'resize' | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null>(null);
  const [initialTouchPoint, setInitialTouchPoint] = useState<{ x: number; y: number } | null>(null);
  const [classes, setClasses] = useState<string[]>(['object', 'person', 'vehicle']);
  const [selectedClass, setSelectedClass] = useState<string>('object');
  const [showClassModal, setShowClassModal] = useState(false);
  const [isClassesLoaded, setIsClassesLoaded] = useState(false);
  
  // 履歴管理（undo機能のため）
  const [history, setHistory] = useState<HistoryAction[]>([]);

  // camera.tsxからのクラス管理機能を移植
  const loadDatasetClasses = async () => {
    if (selectedImageIndex === null) return;
    
    const currentImage = images[selectedImageIndex];
    // 画像のパスからデータセットIDを推定
    const pathParts = currentImage.uri.split('/');
    const datasetIdIndex = pathParts.findIndex(part => part === 'datasets');
    if (datasetIdIndex === -1 || datasetIdIndex + 1 >= pathParts.length) {
      console.log('[ImageGallery] データセットIDが見つからないため、デフォルトクラスを使用');
      setIsClassesLoaded(true);
      return;
    }
    
    const datasetId = pathParts[datasetIdIndex + 1];
    console.log(`[ImageGallery] クラス情報読み込み開始 - データセットID: ${datasetId}`);
    
    try {
      const datasetDir = `${FileSystem.documentDirectory}datasets/${datasetId}/labels/`;
      const classesFile = `${datasetDir}classes.txt`;
      
      const fileInfo = await FileSystem.getInfoAsync(classesFile);
      if (fileInfo.exists) {
        const classesContent = await FileSystem.readAsStringAsync(classesFile);
        console.log(`[ImageGallery] classes.txtの内容:`, classesContent);
        
        const loadedClasses = classesContent
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.trim());
        
        if (loadedClasses.length > 0) {
          console.log(`[ImageGallery] classes.txtから読み込んだクラス:`, loadedClasses);
          setClasses(loadedClasses);
          setSelectedClass(loadedClasses[0]);
          setIsClassesLoaded(true);
          console.log(`[ImageGallery] クラス読み込み完了 - 選択クラス: ${loadedClasses[0]}`);
        } else {
          console.log('[ImageGallery] classes.txtにクラスが見つからないため、デフォルトクラスを使用');
          setIsClassesLoaded(true);
        }
      } else {
        console.log('[ImageGallery] classes.txtが存在しないため、デフォルトクラスを使用');
        setIsClassesLoaded(true);
      }
    } catch (error) {
      console.error('クラス情報の読み込みエラー:', error);
      setIsClassesLoaded(true);
    }
  };

  // 画像選択時または編集モード開始時にクラス情報を読み込む
  React.useEffect(() => {
    if (selectedImageIndex !== null && !isClassesLoaded) {
      loadDatasetClasses();
    }
  }, [selectedImageIndex, isClassesLoaded]);

  // 画像が変わったときにクラス情報をリセット
  React.useEffect(() => {
    setIsClassesLoaded(false);
  }, [selectedImageIndex]);

  const handleDeleteImage = (imageId: string) => {
    Alert.alert(
      '画像を削除',
      'この画像を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            if (onDeleteImage) {
              onDeleteImage(imageId);
              // 削除後の処理：他に画像がある場合は次の画像に移動、なければモーダルを閉じる
              const remainingImages = images.filter(img => img.id !== imageId);
              if (remainingImages.length === 0) {
                setSelectedImageIndex(null); // 画像がすべて削除されたらモーダルを閉じる
              } else if (selectedImageIndex !== null) {
                // 現在の画像インデックスを調整
                const currentImageId = images[selectedImageIndex]?.id;
                if (currentImageId === imageId) {
                  // 削除された画像が現在表示中の画像の場合
                  if (selectedImageIndex >= remainingImages.length) {
                    // 最後の画像が削除された場合は前の画像に移動
                    setSelectedImageIndex(remainingImages.length - 1);
                  }
                  // それ以外の場合は現在のインデックスのまま（次の画像が表示される）
                }
              }
            }
          }
        }
      ]
    );
  };

  const handleEditMode = () => {
    if (selectedImageIndex !== null) {
      const currentImage = images[selectedImageIndex];
      setEditingBboxes([...currentImage.bboxes || []]);
      setIsEditMode(true);
      setSelectedBboxId(null);
      console.log('[ImageGallery] entering edit mode, resetting history');
      setHistory([]); // 履歴をリセット
    }
  };

  const handleSaveAnnotations = () => {
    if (selectedImageIndex !== null && onUpdateImageBboxes) {
      const currentImage = images[selectedImageIndex];
      onUpdateImageBboxes(currentImage.id, editingBboxes);
      setIsEditMode(false);
      setSelectedBboxId(null);
      setHistory([]); // 履歴もリセット
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedBboxId(null);
    setEditingBboxes([]);
    setHistory([]); // 履歴もリセット
  };

  // camera.tsxからのアノテーション編集ロジック
  const handlePanStart = (event: any) => {
    if (!imageLayout || !isEditMode) return;
    
    const { x, y } = event.nativeEvent;
    setInitialTouchPoint({ x, y });
    
    console.log(`[ImageGallery] Pan start at (${x}, ${y}), edit mode: ${isEditMode}`);
    
    // 選択されたBBoxがある場合の編集処理
    if (selectedBboxId) {
      const selectedBbox = editingBboxes.find(bbox => bbox.id === selectedBboxId);
      if (selectedBbox) {
        // リサイズハンドルのチェック
        const handleSize = 20;
        const bboxLeft = imageLayout.x + selectedBbox.x;
        const bboxTop = imageLayout.y + selectedBbox.y;
        const bboxRight = bboxLeft + selectedBbox.width;
        const bboxBottom = bboxTop + selectedBbox.height;
        
        console.log(`[ImageGallery] Checking handles for selected bbox at (${bboxLeft}, ${bboxTop}, ${bboxRight}, ${bboxBottom})`);
        
        // 各リサイズハンドルの領域チェック
        if (Math.abs(x - bboxLeft) <= handleSize && Math.abs(y - bboxTop) <= handleSize) {
          setEditMode('resize');
          setResizeHandle('topLeft');
          console.log('[ImageGallery] Started resize mode: topLeft');
          return;
        } else if (Math.abs(x - bboxRight) <= handleSize && Math.abs(y - bboxTop) <= handleSize) {
          setEditMode('resize');
          setResizeHandle('topRight');
          console.log('[ImageGallery] Started resize mode: topRight');
          return;
        } else if (Math.abs(x - bboxLeft) <= handleSize && Math.abs(y - bboxBottom) <= handleSize) {
          setEditMode('resize');
          setResizeHandle('bottomLeft');
          console.log('[ImageGallery] Started resize mode: bottomLeft');
          return;
        } else if (Math.abs(x - bboxRight) <= handleSize && Math.abs(y - bboxBottom) <= handleSize) {
          setEditMode('resize');
          setResizeHandle('bottomRight');
          console.log('[ImageGallery] Started resize mode: bottomRight');
          return;
        }
        // BBox内部の場合は移動の準備をする
        else if (x >= bboxLeft && x <= bboxRight && y >= bboxTop && y <= bboxBottom) {
          console.log('[ImageGallery] Touch inside selected bbox, preparing for move');
          return;
        }
      }
    }
    
    // 既存のBBoxの選択チェック
    const clickedBbox = editingBboxes.find(bbox => {
      const bboxLeft = imageLayout.x + bbox.x;
      const bboxTop = imageLayout.y + bbox.y;
      const bboxRight = bboxLeft + bbox.width;
      const bboxBottom = bboxTop + bbox.height;
      
      return x >= bboxLeft && x <= bboxRight && y >= bboxTop && y <= bboxBottom;
    });
    
    if (clickedBbox) {
      console.log(`[ImageGallery] Clicked bbox: ${clickedBbox.id}`);
      setSelectedBboxId(clickedBbox.id);
      if (selectedBboxId === clickedBbox.id) {
        setEditMode('move');
        console.log('[ImageGallery] Started move mode for double-selected bbox');
      }
      return;
    }
    
    // 新しいBBoxの描画開始
    setSelectedBboxId(null);
    setEditMode(null);
    
    // 画像領域内かチェック
    if (
      x >= imageLayout.x &&
      x <= imageLayout.x + imageLayout.width &&
      y >= imageLayout.y &&
      y <= imageLayout.y + imageLayout.height
    ) {
      const relativeX = x - imageLayout.x;
      const relativeY = y - imageLayout.y;
      
      const newBbox: BBox = {
        id: Date.now().toString(),
        x: relativeX,
        y: relativeY,
        width: 0,
        height: 0,
        label: selectedClass,
      };
      
      console.log(`[ImageGallery] Started drawing new bbox at (${relativeX}, ${relativeY})`);
      setCurrentBbox(newBbox);
      setIsDrawing(true);
    }
  };

  const handlePanMove = (event: any) => {
    if (!isEditMode) return;
    
    const { x, y } = event.nativeEvent;
    
    // 選択されたBBoxがあり、まだ編集モードでない場合の移動開始判定
    if (selectedBboxId && !editMode && initialTouchPoint && imageLayout) {
      const selectedBbox = editingBboxes.find(bbox => bbox.id === selectedBboxId);
      if (selectedBbox) {
        const bboxLeft = imageLayout.x + selectedBbox.x;
        const bboxTop = imageLayout.y + selectedBbox.y;
        const bboxRight = bboxLeft + selectedBbox.width;
        const bboxBottom = bboxTop + selectedBbox.height;
        
        if (initialTouchPoint.x >= bboxLeft && initialTouchPoint.x <= bboxRight && 
            initialTouchPoint.y >= bboxTop && initialTouchPoint.y <= bboxBottom) {
          const deltaX = Math.abs(x - initialTouchPoint.x);
          const deltaY = Math.abs(y - initialTouchPoint.y);
          
          if (deltaX > 5 || deltaY > 5) {
            setEditMode('move');
            console.log(`[ImageGallery] Started move mode after delta: ${deltaX}, ${deltaY}`);
          }
        }
      }
    }
    
    // BBox編集モードの処理
    if (editMode && selectedBboxId && imageLayout) {
      const selectedBbox = editingBboxes.find(bbox => bbox.id === selectedBboxId);
      if (!selectedBbox) return;
      
      const relativeX = Math.max(0, Math.min(x - imageLayout.x, imageLayout.width));
      const relativeY = Math.max(0, Math.min(y - imageLayout.y, imageLayout.height));
      
      if (editMode === 'move') {
        const newCenterX = relativeX;
        const newCenterY = relativeY;
        
        const newX = Math.max(0, Math.min(newCenterX - selectedBbox.width / 2, imageLayout.width - selectedBbox.width));
        const newY = Math.max(0, Math.min(newCenterY - selectedBbox.height / 2, imageLayout.height - selectedBbox.height));
        
        setEditingBboxes(prev => prev.map(bbox => 
          bbox.id === selectedBboxId 
            ? { ...bbox, x: newX, y: newY }
            : bbox
        ));
      } else if (editMode === 'resize' && resizeHandle) {
        let newX = selectedBbox.x;
        let newY = selectedBbox.y;
        let newWidth = selectedBbox.width;
        let newHeight = selectedBbox.height;
        
        switch (resizeHandle) {
          case 'topLeft':
            newWidth = selectedBbox.x + selectedBbox.width - relativeX;
            newHeight = selectedBbox.y + selectedBbox.height - relativeY;
            newX = relativeX;
            newY = relativeY;
            break;
          case 'topRight':
            newWidth = relativeX - selectedBbox.x;
            newHeight = selectedBbox.y + selectedBbox.height - relativeY;
            newY = relativeY;
            break;
          case 'bottomLeft':
            newWidth = selectedBbox.x + selectedBbox.width - relativeX;
            newHeight = relativeY - selectedBbox.y;
            newX = relativeX;
            break;
          case 'bottomRight':
            newWidth = relativeX - selectedBbox.x;
            newHeight = relativeY - selectedBbox.y;
            break;
        }
        
        if (newWidth > 20 && newHeight > 20 && 
            newX >= 0 && newY >= 0 && 
            newX + newWidth <= imageLayout.width && 
            newY + newHeight <= imageLayout.height) {
          setEditingBboxes(prev => prev.map(bbox => 
            bbox.id === selectedBboxId 
              ? { ...bbox, x: newX, y: newY, width: newWidth, height: newHeight }
              : bbox
          ));
        }
      }
      return;
    }
    
    // 新しいBBox描画の処理
    if (!isDrawing || !currentBbox || !imageLayout) return;
    
    const relativeX = Math.max(0, Math.min(x - imageLayout.x, imageLayout.width));
    const relativeY = Math.max(0, Math.min(y - imageLayout.y, imageLayout.height));
    
    const width = relativeX - currentBbox.x;
    const height = relativeY - currentBbox.y;
    
    setCurrentBbox({
      ...currentBbox,
      width,
      height,
    });
  };

  const handlePanEnd = () => {
    if (!isEditMode) return;
    
    console.log(`[ImageGallery] Pan end - editMode: ${editMode}, isDrawing: ${isDrawing}`);
    setInitialTouchPoint(null);
    
    if (editMode) {
      setEditMode(null);
      setResizeHandle(null);
      console.log('[ImageGallery] Ended edit mode');
      return;
    }
    
    if (!isDrawing || !currentBbox) return;
    
    if (Math.abs(currentBbox.width) > 20 && Math.abs(currentBbox.height) > 20) {
      const normalizedBbox: BBox = {
        ...currentBbox,
        x: currentBbox.width < 0 ? currentBbox.x + currentBbox.width : currentBbox.x,
        y: currentBbox.height < 0 ? currentBbox.y + currentBbox.height : currentBbox.y,
        width: Math.abs(currentBbox.width),
        height: Math.abs(currentBbox.height),
        label: currentBbox.label,
      };
      
      const addAction: HistoryAction = {
        type: 'add',
        bbox: normalizedBbox,
        timestamp: Date.now(),
      };
      console.log('[ImageGallery] adding bbox to history:', addAction);
      setHistory(prev => {
        const newHistory = [...prev, addAction];
        console.log('[ImageGallery] new history length after add:', newHistory.length);
        return newHistory;
      });
      
      setEditingBboxes(prev => [...prev, normalizedBbox]);
      setSelectedBboxId(normalizedBbox.id);
      console.log(`[ImageGallery] Created new bbox: ${normalizedBbox.id}`);
    }
    
    setCurrentBbox(null);
    setIsDrawing(false);
  };

  const undoLastAction = () => {
    console.log('[ImageGallery] undoLastAction called, history length:', history.length);
    if (history.length === 0) return;
    
    const lastAction = history[history.length - 1];
    console.log('[ImageGallery] undoing action:', lastAction);
    
    if (lastAction.type === 'add') {
      // 最後に追加されたBBoxを削除
      console.log('[ImageGallery] undoing add action, removing bbox:', lastAction.bbox.id);
      setEditingBboxes(prev => {
        const newBboxes = prev.filter(bbox => bbox.id !== lastAction.bbox.id);
        console.log('[ImageGallery] new bboxes after undo add:', newBboxes.length);
        return newBboxes;
      });
    } else if (lastAction.type === 'delete') {
      // 最後に削除されたBBoxを復元
      console.log('[ImageGallery] undoing delete action, restoring bbox:', lastAction.bbox.id);
      setEditingBboxes(prev => {
        const newBboxes = [...prev, lastAction.bbox];
        console.log('[ImageGallery] new bboxes after undo delete:', newBboxes.length);
        return newBboxes;
      });
    }
    
    // 履歴から最後のアクションを削除
    setHistory(prev => {
      const newHistory = prev.slice(0, -1);
      console.log('[ImageGallery] new history length after undo:', newHistory.length);
      return newHistory;
    });
  };

  const deleteBboxFromEditing = (bboxId: string) => {
    const bboxToDelete = editingBboxes.find(bbox => bbox.id === bboxId);
    if (bboxToDelete) {
      const deleteAction: HistoryAction = {
        type: 'delete',
        bbox: bboxToDelete,
        timestamp: Date.now(),
      };
      console.log('[ImageGallery] adding delete action to history:', deleteAction);
      setHistory(prev => {
        const newHistory = [...prev, deleteAction];
        console.log('[ImageGallery] new history length after delete:', newHistory.length);
        return newHistory;
      });
    }
    
    setEditingBboxes(prev => prev.filter(bbox => bbox.id !== bboxId));
    if (selectedBboxId === bboxId) {
      setSelectedBboxId(null);
    }
  };

  const handleDeleteBbox = (imageId: string, bboxId: string) => {
    if (isEditMode) {
      // 編集モード中の場合のみ削除処理を実行
      showDeleteBboxAlert(bboxId);
    }
    // 編集モードでない場合は何もしない
  };

  const selectClass = (className: string) => {
    setSelectedClass(className);
    setShowClassModal(false);
  };

  const showDeleteBboxAlert = (bboxId: string) => {
    Alert.alert(
      'BBox削除',
      'このBBoxを削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'OK',
          style: 'destructive',
          onPress: () => deleteBboxFromEditing(bboxId),
        },
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
              scrollEnabled={!isEditMode}
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
                      {isEditMode ? (
                        <>
                          <TouchableOpacity style={styles.headerButton} onPress={handleCancelEdit}>
                            <Ionicons name="close" size={24} color="white" />
                          </TouchableOpacity>
                          <Text style={styles.headerTitle}>アノテーション</Text>
                          <View style={styles.headerButton} />
                        </>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={styles.headerButton} 
                            onPress={() => setSelectedImageIndex(null)}
                          >
                            <Ionicons name="arrow-back" size={24} color="white" />
                          </TouchableOpacity>
                          <Text style={styles.headerTitle}>
                            {index + 1} / {images.length}
                          </Text>
                          <View style={styles.headerButton} />
                        </>
                      )}
                    </View>
                  </View>

                  {/* 中央の画像エリア - camera.tsxと同じ構成 */}
                  <View style={styles.cameraContainer}>
                    {isEditMode ? (
                      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                        
                        {/* アノテーション編集用のオーバーレイ */}
                        <PanGestureHandler
                          ref={panGestureRef}
                          onGestureEvent={handlePanMove}
                          onHandlerStateChange={(event) => {
                            const { state } = event.nativeEvent;
                            console.log(`[ImageGallery] Gesture state changed: ${state}`);
                            if (state === 4) { // BEGAN
                              handlePanStart(event);
                            } else if (state === 5) { // END
                              handlePanEnd();
                            }
                          }}
                        >
                          <View style={styles.annotationOverlay}>
                            {/* 編集中のBBox */}
                            {editingBboxes.map((bbox) => {
                              const bboxColor = getClassColor(bbox.label || 'object', classes);
                              const isSelected = selectedBboxId === bbox.id;
                              return (
                                <View key={bbox.id} style={{ position: 'absolute' }}>
                                  <TouchableOpacity
                                    style={[
                                      styles.bbox,
                                      {
                                        left: imageLayout ? imageLayout.x + bbox.x : bbox.x,
                                        top: imageLayout ? imageLayout.y + bbox.y : bbox.y,
                                        width: bbox.width,
                                        height: bbox.height,
                                        borderColor: bboxColor,
                                        backgroundColor: `${bboxColor}30`,
                                        borderWidth: isSelected ? 3 : 2,
                                        opacity: editMode === 'move' && isSelected ? 0.8 : 1,
                                      }
                                    ]}
                                    onPress={() => {
                                      console.log(`[ImageGallery] BBox ${bbox.id} pressed`);
                                      setSelectedBboxId(bbox.id);
                                      setEditMode(null);
                                    }}
                                    onLongPress={() => {
                                      showDeleteBboxAlert(bbox.id);
                                    }}
                                    delayLongPress={800}
                                    activeOpacity={0.6}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                  />
                                  
                                  {/* 選択時のリサイズハンドル */}
                                  {isSelected && imageLayout && !editMode && !isDrawing && (
                                    <>
                                      <View style={[styles.resizeHandle, {
                                        left: imageLayout.x + bbox.x - 7,
                                        top: imageLayout.y + bbox.y - 7,
                                        backgroundColor: bboxColor,
                                      }]} />
                                      <View style={[styles.resizeHandle, {
                                        left: imageLayout.x + bbox.x + bbox.width - 7,
                                        top: imageLayout.y + bbox.y - 7,
                                        backgroundColor: bboxColor,
                                      }]} />
                                      <View style={[styles.resizeHandle, {
                                        left: imageLayout.x + bbox.x - 7,
                                        top: imageLayout.y + bbox.y + bbox.height - 7,
                                        backgroundColor: bboxColor,
                                      }]} />
                                      <View style={[styles.resizeHandle, {
                                        left: imageLayout.x + bbox.x + bbox.width - 7,
                                        top: imageLayout.y + bbox.y + bbox.height - 7,
                                        backgroundColor: bboxColor,
                                      }]} />
                                    </>
                                  )}
                                  
                                  {/* BBoxラベル */}
                                  <View
                                    style={[
                                      styles.bboxLabel,
                                      {
                                        left: imageLayout ? imageLayout.x + bbox.x : bbox.x,
                                        top: imageLayout ? imageLayout.y + bbox.y - 25 : bbox.y - 25,
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
                            
                            {/* 描画中のBBox */}
                            {currentBbox && imageLayout && (
                              (() => {
                                const normalizedX = currentBbox.width < 0 ? currentBbox.x + currentBbox.width : currentBbox.x;
                                const normalizedY = currentBbox.height < 0 ? currentBbox.y + currentBbox.height : currentBbox.y;
                                const normalizedWidth = Math.abs(currentBbox.width);
                                const normalizedHeight = Math.abs(currentBbox.height);
                                
                                return (
                                  <View
                                    style={[
                                      styles.bbox,
                                      styles.currentBbox,
                                      {
                                        left: imageLayout.x + normalizedX,
                                        top: imageLayout.y + normalizedY,
                                        width: normalizedWidth,
                                        height: normalizedHeight,
                                        borderColor: getClassColor(selectedClass, classes),
                                        backgroundColor: `${getClassColor(selectedClass, classes)}30`,
                                        borderStyle: 'dashed',
                                        opacity: 0.8,
                                      }
                                    ]}
                                  />
                                );
                              })()
                            )}
                          </View>
                        </PanGestureHandler>
                      </GestureHandlerRootView>
                    ) : (
                      <>
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
                        
                        {/* BBoxオーバーレイ - 読み取り専用 */}
                        {item.bboxes && item.bboxes.length > 0 && imageLayout && (
                          <View style={styles.annotationOverlay}>
                            {item.bboxes.map((bbox: BBox) => {
                              const bboxColor = getClassColor(bbox.label || 'object', classes);
                              const isSelected = selectedBboxId === bbox.id;
                              
                              const cameraScaleX = imageLayout.width / adjustedCameraWidth;
                              const cameraScaleY = imageLayout.height / adjustedCameraHeight;
                              
                              let scaledX = bbox.x * cameraScaleX;
                              let scaledY = bbox.y * cameraScaleY;
                              let scaledWidth = bbox.width * cameraScaleX;
                              let scaledHeight = bbox.height * cameraScaleY;
                              
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
                                        backgroundColor: `${bboxColor}30`,
                                        borderWidth: isSelected ? 3 : 2,
                                      }
                                    ]}
                                    onPress={() => {
                                      setSelectedBboxId(selectedBboxId === bbox.id ? null : bbox.id);
                                    }}
                                    onLongPress={undefined}
                                    activeOpacity={0.7}
                                  />
                                  
                                  {/* BBoxラベル */}
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
                      </>
                    )}
                  </View>

                  {/* 下部の黒い帯 - camera.tsxと同じ構成 */}
                  <View style={styles.bottomBar}>
                    {isEditMode ? (
                      /* ボタンを横並びに配置 - camera.tsxと同じレイアウト */
                      <View style={styles.bottomButtonsContainer}>
                        <TouchableOpacity 
                          style={[styles.bottomButton, styles.undoButtonHorizontal, { opacity: history.length > 0 ? 1 : 0.5 }]} 
                          onPress={() => {
                            console.log('[ImageGallery] undo button pressed');
                            undoLastAction();
                          }}
                          disabled={history.length === 0}
                        >
                          <Ionicons name="arrow-undo" size={24} color="white" />
                          <Text style={styles.bottomButtonText}>戻す</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.bottomButton, styles.classSelectorHorizontal, { backgroundColor: `${getClassColor(selectedClass, classes)}CC` }]} 
                          onPress={() => setShowClassModal(true)}
                        >
                          <View style={styles.classButtonContent}>
                            <View style={[styles.classColorIndicator, { backgroundColor: getClassColor(selectedClass, classes) }]} />
                            <Ionicons name="chevron-up" size={16} color="white" />
                          </View>
                          <Text style={styles.bottomButtonText}>{selectedClass}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.bottomButton, styles.saveButtonHorizontal]}
                          onPress={handleSaveAnnotations}
                        >
                          <Ionicons name="checkmark" size={24} color="white" />
                          <Text style={styles.bottomButtonText}>完了</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.bottomButtonsContainer}>
                        <TouchableOpacity
                          style={[styles.bottomButton, styles.editButtonHorizontal]}
                          onPress={handleEditMode}
                        >
                          <Ionicons name="create-outline" size={24} color="white" />
                          <Text style={styles.bottomButtonText}>編集</Text>
                        </TouchableOpacity>
                        
                        <View style={[styles.bottomButton]} />
                        
                        <TouchableOpacity
                          style={[styles.bottomButton, styles.deleteButtonHorizontal]}
                          onPress={() => handleDeleteImage(item.id)}
                        >
                          <Ionicons name="trash-outline" size={24} color="white" />
                          <Text style={styles.bottomButtonText}>削除</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </SafeAreaView>

        {/* クラス選択モーダル */}
        <Modal
          visible={showClassModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowClassModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>クラス選択</Text>
                <TouchableOpacity onPress={() => setShowClassModal(false)}>
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.classList}>
                {classes.map((className) => {
                  const classColor = getClassColor(className, classes);
                  return (
                    <TouchableOpacity
                      key={className}
                      style={[
                        styles.classButton,
                        selectedClass === className && styles.classButtonSelected,
                        selectedClass === className && { backgroundColor: classColor }
                      ]}
                      onPress={() => selectClass(className)}
                    >
                      <View style={styles.classButtonContent}>
                        <View 
                          style={[
                            styles.classColorIndicator,
                            { backgroundColor: classColor }
                          ]}
                        />
                        <Text style={[
                          styles.classButtonText,
                          selectedClass === className && styles.classButtonTextSelected
                        ]}>
                          {className}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    ...FontStyles.medium,
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
    marginLeft: 2,
    ...FontStyles.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
    ...FontStyles.bold,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text + '60',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
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
    ...FontStyles.bold,
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
  // camera.tsxと同じモーダルスタイル
  modal: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalImageContainer: {
    width: screenWidth,
    flex: 1,
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
    ...FontStyles.bold,
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
  // 編集機能用の追加スタイル
  currentBbox: {
    borderStyle: 'dashed',
    opacity: 0.8,
  },
  // 横並びボタン用のスタイル
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 12,
    minHeight: 60,
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    ...FontStyles.semiBold,
  },
  undoButtonHorizontal: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  classSelectorHorizontal: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flex: 1.5, // 他のボタンより1.5倍の幅
  },
  saveButtonHorizontal: {
    backgroundColor: 'black',
  },
  editButtonHorizontal: {
    backgroundColor: 'black',
  },
  deleteButtonHorizontal: {
    backgroundColor: 'black',
  },
  classColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  classButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  // モーダル用のスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    color: 'black',
    ...FontStyles.bold,
  },
  classList: {
    maxHeight: 200,
    paddingHorizontal: 20,
  },
  classButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginVertical: 4,
  },
  classButtonSelected: {
    backgroundColor: '#007AFF',
  },
  classButtonText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
  },
  classButtonTextSelected: {
    color: 'white',
    ...FontStyles.bold,
  },
});

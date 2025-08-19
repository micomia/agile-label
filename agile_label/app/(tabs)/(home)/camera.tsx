import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { useDatasets } from '../../../contexts/DatasetContext';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

// BBoxの型定義
interface BBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

// 3:4の縦横比でカメラビューのサイズを計算（縦長）
const topBarHeight = 120;
const bottomBarHeight = 180; // 下部の黒い帯を高くする
const cameraHeight = height - topBarHeight - bottomBarHeight; // 上下の黒い帯分を引く
const cameraWidth = width;
const aspectRatio = 3 / 4; // 縦長の比率に変更

// カメラビューを3:4の縦横比に調整（縦長）
let adjustedCameraWidth = cameraWidth;
let adjustedCameraHeight = cameraWidth / aspectRatio;

if (adjustedCameraHeight > cameraHeight) {
  adjustedCameraHeight = cameraHeight;
  adjustedCameraWidth = cameraHeight * aspectRatio;
}

export default function CameraScreen() {
  const { datasetId } = useLocalSearchParams<{ datasetId?: string }>();
  const { addImageToDataset } = useDatasets();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBbox, setCurrentBbox] = useState<BBox | null>(null);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    // カメラの権限が読み込み中
    return (
      <View style={styles.container}>
        <Text>カメラの権限を確認中...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // カメラの権限がない場合
    return (
      <View style={styles.container}>
        <Text style={styles.message}>カメラへのアクセス権限が必要です</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>権限を許可</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0, // 最高品質で撮影
          base64: false,
          skipProcessing: true, // 画像処理をスキップして元の解像度を保持
        });

        if (photo) {
          // 画像の解像度情報をログに出力
          console.log('撮影した画像の情報:', {
            width: photo.width,
            height: photo.height,
            uri: photo.uri
          });
          
          // プレビュー画面に移行
          setCapturedPhoto(photo.uri);
          setBboxes([]); // BBoxをリセット
        }
      } catch (error) {
        console.error('写真撮影エラー:', error);
        Alert.alert('エラー', '写真の撮影に失敗しました');
      }
    }
  }

  async function savePhotoToDataset(photoUri: string) {
    try {
      // ドキュメントディレクトリにデータセット用のフォルダを作成
      const datasetDir = `${FileSystem.documentDirectory}datasets/`;
      const dirInfo = await FileSystem.getInfoAsync(datasetDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(datasetDir, { intermediates: true });
      }

      // データセット固有のサブフォルダを作成（datasetIdが提供されている場合）
      let targetDir = datasetDir;
      if (datasetId) {
        targetDir = `${datasetDir}${datasetId}/`;
        const datasetDirInfo = await FileSystem.getInfoAsync(targetDir);
        if (!datasetDirInfo.exists) {
          await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
        }
      }

      // ファイル名を生成（タイムスタンプを使用）
      const timestamp = new Date().getTime();
      const fileName = `photo_${timestamp}.jpg`;
      const destinationUri = `${targetDir}${fileName}`;

      // ファイルをコピー
      await FileSystem.copyAsync({
        from: photoUri,
        to: destinationUri,
      });

      // アノテーション情報をJSONファイルとして保存
      if (bboxes.length > 0) {
        const annotationFileName = `photo_${timestamp}.json`;
        const annotationUri = `${targetDir}${annotationFileName}`;
        const annotationData = {
          image: fileName,
          bboxes: bboxes,
          timestamp: timestamp,
        };
        
        await FileSystem.writeAsStringAsync(
          annotationUri,
          JSON.stringify(annotationData, null, 2)
        );
        
        console.log('アノテーション情報を保存:', annotationData);
      }

      // DatasetContextを更新
      if (datasetId) {
        console.log('DatasetContextに画像を追加:', datasetId, destinationUri);
        addImageToDataset(datasetId, destinationUri);
      }

      Alert.alert(
        '保存完了',
        `写真がデータセットに保存されました${bboxes.length > 0 ? `\n(${bboxes.length}個のアノテーション付き)` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCapturedPhoto(null);
              setBboxes([]);
            },
          },
        ]
      );

      console.log('写真が保存されました:', destinationUri);
    } catch (error) {
      console.error('写真保存エラー:', error);
      Alert.alert('エラー', '写真の保存に失敗しました');
    }
  }

  function retakePhoto() {
    setCapturedPhoto(null);
    setBboxes([]);
  }

  // BBox描画開始
  function handlePanStart(event: any) {
    if (!imageLayout) return;
    
    const { x, y } = event.nativeEvent;
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
      };
      
      setCurrentBbox(newBbox);
      setIsDrawing(true);
    }
  }

  // BBox描画中
  function handlePanMove(event: any) {
    if (!isDrawing || !currentBbox || !imageLayout) return;
    
    const { x, y } = event.nativeEvent;
    const relativeX = Math.max(0, Math.min(x - imageLayout.x, imageLayout.width));
    const relativeY = Math.max(0, Math.min(y - imageLayout.y, imageLayout.height));
    
    const width = relativeX - currentBbox.x;
    const height = relativeY - currentBbox.y;
    
    setCurrentBbox({
      ...currentBbox,
      width,
      height,
    });
  }

  // BBox描画終了
  function handlePanEnd() {
    if (!isDrawing || !currentBbox) return;
    
    // 最小サイズチェック
    if (Math.abs(currentBbox.width) > 20 && Math.abs(currentBbox.height) > 20) {
      // 負の値を正規化
      const normalizedBbox: BBox = {
        ...currentBbox,
        x: currentBbox.width < 0 ? currentBbox.x + currentBbox.width : currentBbox.x,
        y: currentBbox.height < 0 ? currentBbox.y + currentBbox.height : currentBbox.y,
        width: Math.abs(currentBbox.width),
        height: Math.abs(currentBbox.height),
      };
      
      setBboxes(prev => [...prev, normalizedBbox]);
    }
    
    setCurrentBbox(null);
    setIsDrawing(false);
  }

  // BBox削除
  function deleteBbox(id: string) {
    setBboxes(prev => prev.filter(bbox => bbox.id !== id));
  }

  // プレビュー画面を表示
  if (capturedPhoto) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          {/* プレビュー画像 */}
          <Image 
            source={{ uri: capturedPhoto }} 
            style={styles.previewImage}
            onLayout={(event) => {
              const { width, height, x, y } = event.nativeEvent.layout;
              setImageLayout({ width, height, x, y });
            }}
          />
          
          {/* アノテーション用のオーバーレイ */}
          <PanGestureHandler
            onGestureEvent={handlePanMove}
            onHandlerStateChange={(event) => {
              if (event.nativeEvent.state === 4) { // BEGAN
                handlePanStart(event);
              } else if (event.nativeEvent.state === 5) { // END
                handlePanEnd();
              }
            }}
          >
            <View style={styles.annotationOverlay}>
              {/* 既存のBBox */}
              {bboxes.map((bbox) => (
                <TouchableOpacity
                  key={bbox.id}
                  style={[
                    styles.bbox,
                    {
                      left: imageLayout ? imageLayout.x + bbox.x : bbox.x,
                      top: imageLayout ? imageLayout.y + bbox.y : bbox.y,
                      width: bbox.width,
                      height: bbox.height,
                    }
                  ]}
                  onLongPress={() => deleteBbox(bbox.id)}
                />
              ))}
              
              {/* 描画中のBBox */}
              {currentBbox && imageLayout && (
                <View
                  style={[
                    styles.bbox,
                    styles.currentBbox,
                    {
                      left: imageLayout.x + currentBbox.x,
                      top: imageLayout.y + currentBbox.y,
                      width: currentBbox.width,
                      height: currentBbox.height,
                    }
                  ]}
                />
              )}
            </View>
          </PanGestureHandler>
          
          {/* 戻るボタン（左上） */}
          <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          {/* アノテーション情報表示 */}
          <View style={styles.annotationInfo}>
            <Text style={styles.annotationText}>
              アノテーション: {bboxes.length}個
            </Text>
            <Text style={styles.annotationHelp}>
              タップ&ドラッグでBBox作成、長押しで削除
            </Text>
          </View>
          
          {/* 保存ボタン（右下） */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => savePhotoToDataset(capturedPhoto)}
          >
            <Ionicons name="checkmark" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <View style={styles.container}>
      {/* 上部の黒い帯 */}
      <View style={styles.topBar}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>カメラ</Text>
          <TouchableOpacity style={styles.headerButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* カメラビュー */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={[styles.camera, {
            width: adjustedCameraWidth,
            height: adjustedCameraHeight,
          }]}
          facing={facing}
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        />
      </View>

      {/* 下部の黒い帯 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
          disabled={!isCameraReady}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
    fontSize: 16,
  },
  topBar: {
    height: 120,
    backgroundColor: 'black',
    justifyContent: 'flex-end',
  },
  camera: {
    backgroundColor: 'black',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  bottomBar: {
    height: 180, // 高さを120から180に増やす
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
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
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // プレビュー画面用のスタイル
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  retakeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    width: 60,
    height: 60,
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
  currentBbox: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  annotationInfo: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  annotationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  annotationHelp: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
  },
});
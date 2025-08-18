import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { useDatasets } from '../../../contexts/DatasetContext';

const { width, height } = Dimensions.get('window');

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
          
          await savePhotoToDataset(photo.uri);
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

      // DatasetContextを更新
      if (datasetId) {
        console.log('DatasetContextに画像を追加:', datasetId, destinationUri);
        addImageToDataset(datasetId, destinationUri);
      }

      Alert.alert(
        '保存完了',
        '写真がデータセットに保存されました',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      console.log('写真が保存されました:', destinationUri);
    } catch (error) {
      console.error('写真保存エラー:', error);
      Alert.alert('エラー', '写真の保存に失敗しました');
    }
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
});
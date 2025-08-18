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
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { FloatingActionButton } from '../components/FloatingActionButton';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
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
          quality: 0.8,
          base64: false,
        });

        if (photo) {
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

      // ファイル名を生成（タイムスタンプを使用）
      const timestamp = new Date().getTime();
      const fileName = `photo_${timestamp}.jpg`;
      const destinationUri = `${datasetDir}${fileName}`;

      // ファイルをコピー
      await FileSystem.copyAsync({
        from: photoUri,
        to: destinationUri,
      });

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
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      />

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
    flex: 1,
    width: width,
  },
  bottomBar: {
    height: 120,
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
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
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
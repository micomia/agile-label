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
  Modal,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect, useNavigation } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { useDatasets, BBox } from '../../../contexts/DatasetContext';
import { Colors } from '../../../constants/Colors';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

// 履歴アクションの型定義
interface HistoryAction {
  type: 'add' | 'delete';
  bbox: BBox;
  timestamp: number;
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

// クラス名から色を取得する関数
function getClassColor(className: string, allClasses: string[]): string {
  if (CLASS_COLORS[className]) {
    return CLASS_COLORS[className];
  }
  
  // 新しいクラスの場合、インデックスに基づいて色を決定
  const index = allClasses.indexOf(className);
  const colorIndex = index % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[colorIndex];
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
  const navigation = useNavigation();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [actualImageSize, setActualImageSize] = useState<{ width: number; height: number } | null>(null); // 実際の画像サイズ
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBbox, setCurrentBbox] = useState<BBox | null>(null);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  
  // クラス管理の状態
  const [classes, setClasses] = useState<string[]>(['object', 'person', 'vehicle']); // デフォルトクラス
  const [selectedClass, setSelectedClass] = useState<string>('object');
  const [showClassModal, setShowClassModal] = useState(false);
  const [isClassesLoaded, setIsClassesLoaded] = useState(false); // クラス読み込み完了フラグ
  
  // 履歴管理の状態
  const [history, setHistory] = useState<HistoryAction[]>([]);
  
  // BBox編集の状態
  const [selectedBboxId, setSelectedBboxId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'move' | 'resize' | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null>(null);
  const [initialTouchPoint, setInitialTouchPoint] = useState<{ x: number; y: number } | null>(null);
  
  // 保存完了メッセージの状態
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const cameraRef = useRef<CameraView>(null);

  // ナビゲーションバーの非表示設定
  useFocusEffect(
    React.useCallback(() => {
      // ステータスバーとタブバーの設定
      if (Platform.OS === 'android') {
        StatusBar.setHidden(true, 'slide');
      }
      
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }
      
      return () => {
        // 画面を離れる時にタブバーとステータスバーを再表示
        if (Platform.OS === 'android') {
          StatusBar.setHidden(false, 'slide');
        }
        
        if (parent) {
          // 元のタブバースタイルを復元
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: Colors.background,
              paddingTop: Platform.OS === 'android' ? 8 : 0,
            }
          });
        }
      };
    }, [navigation])
  );

  // データセット固有のクラス情報を読み込み・保存
  useEffect(() => {
    loadDatasetClasses();
  }, [datasetId]);

  // 画面にフォーカスが当たった時にクラス情報を再読み込み
  useFocusEffect(
    React.useCallback(() => {
      if (datasetId) {
        loadDatasetClasses();
      }
    }, [datasetId])
  );

  async function loadDatasetClasses() {
    if (!datasetId) return;
    
    console.log(`[カメラ] クラス情報読み込み開始 - データセットID: ${datasetId}`);
    
    try {
      const datasetDir = `${FileSystem.documentDirectory}datasets/${datasetId}/labels/`;
      const classesFile = `${datasetDir}classes.txt`;
      
      // ディレクトリが存在しない場合は作成
      const dirInfo = await FileSystem.getInfoAsync(datasetDir);
      if (!dirInfo.exists) {
        console.log(`[カメラ] ディレクトリ作成: ${datasetDir}`);
        await FileSystem.makeDirectoryAsync(datasetDir, { intermediates: true });
      }
      
      const fileInfo = await FileSystem.getInfoAsync(classesFile);
      if (fileInfo.exists) {
        const classesContent = await FileSystem.readAsStringAsync(classesFile);
        console.log(`[カメラ] classes.txtの内容:`, classesContent);
        
        const loadedClasses = classesContent
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.trim());
        
        if (loadedClasses.length > 0) {
          console.log(`[カメラ] classes.txtから読み込んだクラス:`, loadedClasses);
          setClasses(loadedClasses);
          setSelectedClass(loadedClasses[0]); // 最初のクラスを選択
          setIsClassesLoaded(true);
          console.log(`[カメラ] クラス読み込み完了 - 選択クラス: ${loadedClasses[0]}`);
        } else {
          console.log('[カメラ] classes.txtにクラスが見つからないため、デフォルトクラスを使用して保存');
          // デフォルトクラスをファイルに保存
          await saveDatasetClassesWithArray(classes);
          setIsClassesLoaded(true);
        }
      } else {
        console.log('[カメラ] classes.txtが存在しないため、デフォルトクラスを作成');
        // デフォルトクラスでファイルを作成
        await saveDatasetClassesWithArray(classes);
        setIsClassesLoaded(true);
      }
    } catch (error) {
      console.error('クラス情報の読み込みエラー:', error);
      // エラーが発生した場合はデフォルトクラスでファイルを作成
      await saveDatasetClassesWithArray(classes);
      setIsClassesLoaded(true);
    }
  }

  async function saveDatasetClasses() {
    if (!datasetId) return;
    
    try {
      const datasetDir = `${FileSystem.documentDirectory}datasets/${datasetId}/labels/`;
      const dirInfo = await FileSystem.getInfoAsync(datasetDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(datasetDir, { intermediates: true });
      }
      
      // classes.txtファイルを更新
      const classesFile = `${datasetDir}classes.txt`;
      const content = classes.sort().join('\n');
      
      console.log(`[カメラ] classes.txtに保存するクラス:`, classes.sort());
      
      await FileSystem.writeAsStringAsync(classesFile, content);
      console.log(`[カメラ] classes.txtを更新しました: ${classes.length}個のクラス`, classes);
      
      // DatasetContextのクラス数は他の関数で自動更新されます
    } catch (error) {
      console.error('クラス情報の保存エラー:', error);
    }
  }

  // 特定のクラス配列で保存する関数
  async function saveDatasetClassesWithArray(classArray: string[]) {
    if (!datasetId) {
      console.log(`[カメラ] 保存スキップ: datasetIdが未設定`);
      return;
    }
    
    console.log(`[カメラ] クラス保存開始 - データセットID: ${datasetId}, クラス:`, classArray);
    
    try {
      const datasetDir = `${FileSystem.documentDirectory}datasets/${datasetId}/labels/`;
      const dirInfo = await FileSystem.getInfoAsync(datasetDir);
      
      if (!dirInfo.exists) {
        console.log(`[カメラ] ディレクトリ作成: ${datasetDir}`);
        await FileSystem.makeDirectoryAsync(datasetDir, { intermediates: true });
      }
      
      // classes.txtファイルを更新
      const classesFile = `${datasetDir}classes.txt`;
      const content = classArray.sort().join('\n');
      
      console.log(`[カメラ] classes.txtに保存する内容:`, content);
      
      await FileSystem.writeAsStringAsync(classesFile, content);
      console.log(`[カメラ] classes.txt保存完了: ${classArray.length}個のクラス`);
      
      // 保存後にファイルの内容を確認
      const savedContent = await FileSystem.readAsStringAsync(classesFile);
      console.log(`[カメラ] 保存確認 - ファイル内容:`, savedContent);
      
      // DatasetContextのクラス数を更新（直接setDatasetsを使用して無限ループを避ける）
      console.log(`[カメラ] classes.txt保存完了、DatasetContextは自動的に同期されます`);
    } catch (error) {
      console.error('クラス情報の保存エラー:', error);
      throw error; // エラーを再スローして呼び出し元で処理
    }
  }

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
          console.log('=== 撮影した画像の詳細情報 ===');
          console.log('実際の画像サイズ:', photo.width, 'x', photo.height);
          console.log('URI:', photo.uri);
          console.log('期待値: 3024x4032かどうか:', photo.width === 3024 && photo.height === 4032);
          console.log('アスペクト比:', (photo.width / photo.height).toFixed(3), '(期待値: 0.750)');
          console.log('========================');
          
          // 実際の画像サイズを保存
          setActualImageSize({ width: photo.width, height: photo.height });
          
          // プレビュー画面に移行
          setCapturedPhoto(photo.uri);
          setBboxes([]); // BBoxをリセット
          setHistory([]); // 履歴をリセット
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

      // アノテーション情報をYOLO形式のtxtファイルとして保存
      if (bboxes.length > 0) {
        // 最新のクラス情報を再読み込み
        let currentClasses = classes;
        try {
          const classesFile = `${targetDir}labels/classes.txt`;
          const fileInfo = await FileSystem.getInfoAsync(classesFile);
          if (fileInfo.exists) {
            const classesContent = await FileSystem.readAsStringAsync(classesFile);
            const loadedClasses = classesContent
              .split('\n')
              .filter(line => line.trim() && !line.startsWith('#'))
              .map(line => line.trim());
            
            if (loadedClasses.length > 0) {
              currentClasses = loadedClasses;
              console.log(`[保存時] classes.txtから最新クラス読み込み:`, currentClasses);
            }
          }
        } catch (error) {
          console.log('クラス再読み込みエラー:', error);
        }
        
        const annotationFileName = `photo_${timestamp}.txt`;
        const annotationUri = `${targetDir}${annotationFileName}`;
        
        // YOLO形式のアノテーション文字列を作成
        const yoloAnnotations = bboxes.map(bbox => {
          // クラス名をクラス番号に変換
          const classIndex = currentClasses.indexOf(bbox.label || 'object');
          const classNumber = classIndex >= 0 ? classIndex : 0; // 見つからない場合は0番
          
          console.log(`[アノテーション変換] クラス: "${bbox.label}" -> 番号: ${classNumber}, 利用可能クラス:`, currentClasses);
          
          // 実際の画像サイズと表示サイズの比率を計算
          if (!actualImageSize || !imageLayout) {
            console.error('画像サイズ情報が不足しています:', { actualImageSize, imageLayout });
            return `${classNumber} 0 0 0 0`; // エラー時はデフォルト値
          }
          
          // 表示座標を実際の画像座標に変換
          const scaleX = actualImageSize.width / imageLayout.width;
          const scaleY = actualImageSize.height / imageLayout.height;
          
          const actualX = bbox.x * scaleX;
          const actualY = bbox.y * scaleY;
          const actualWidth = bbox.width * scaleX;
          const actualHeight = bbox.height * scaleY;
          
          // バウンディングボックスの座標を正規化 (0-1の範囲) - 実際の画像サイズで正規化
          const centerX = (actualX + actualWidth / 2) / actualImageSize.width;
          const centerY = (actualY + actualHeight / 2) / actualImageSize.height;
          const width = actualWidth / actualImageSize.width;
          const height = actualHeight / actualImageSize.height;
          
          console.log(`[座標変換詳細] BBox: ${bbox.id}`, {
            表示座標: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
            表示サイズ: { width: imageLayout.width, height: imageLayout.height },
            実際の画像サイズ: actualImageSize,
            スケール: { x: scaleX, y: scaleY },
            実際の座標: { x: actualX, y: actualY, width: actualWidth, height: actualHeight },
            正規化座標: { centerX, centerY, width, height },
            最終YOLO値: `${classNumber} ${centerX.toFixed(6)} ${centerY.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`
          });
          
          // YOLO形式: class_number center_x center_y width height (0-1正規化)
          return `${classNumber} ${centerX.toFixed(6)} ${centerY.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
        }).join('\n');
        
        await FileSystem.writeAsStringAsync(annotationUri, yoloAnnotations);
        
        console.log('=== YOLO形式アノテーション保存詳細 ===');
        console.log('ファイルパス:', annotationUri);
        console.log('画像サイズ:', actualImageSize);
        console.log('BBox数:', bboxes.length);
        console.log('アノテーション内容:');
        yoloAnnotations.split('\n').forEach((line, index) => {
          console.log(`  [${index}] ${line}`);
        });
        console.log('================================');
      }

      // DatasetContextを更新
      if (datasetId) {
        console.log('DatasetContextに画像を追加:', datasetId, destinationUri);
        await addImageToDataset(datasetId, destinationUri, bboxes);
      }

      // 保存完了メッセージを表示
      setSaveMessage(`写真がデータセットに保存されました${bboxes.length > 0 ? `\n(${bboxes.length}個のアノテーション付き)` : ''}`);
      setShowSaveMessage(true);

      // 2秒後に自動的にカメラ画面に戻る
      setTimeout(() => {
        setShowSaveMessage(false);
        setSaveMessage('');
        setCapturedPhoto(null);
        setActualImageSize(null); // 実際の画像サイズもリセット
        setBboxes([]);
        setHistory([]); // 履歴もリセット
      }, 2000);

      console.log('写真が保存されました:', destinationUri);
    } catch (error) {
      console.error('写真保存エラー:', error);
      Alert.alert('エラー', '写真の保存に失敗しました');
    }
  }

  function retakePhoto() {
    setCapturedPhoto(null);
    setActualImageSize(null); // 実際の画像サイズもリセット
    setBboxes([]);
    setHistory([]); // 履歴もリセット
  }

  // BBox描画開始
  function handlePanStart(event: any) {
    if (!imageLayout) return;
    
    const { x, y } = event.nativeEvent;
    setInitialTouchPoint({ x, y });
    
    // 選択されたBBoxがある場合の編集処理
    if (selectedBboxId) {
      const selectedBbox = bboxes.find(bbox => bbox.id === selectedBboxId);
      if (selectedBbox) {
        // リサイズハンドルのチェック
        const handleSize = 20;
        const bboxLeft = imageLayout.x + selectedBbox.x;
        const bboxTop = imageLayout.y + selectedBbox.y;
        const bboxRight = bboxLeft + selectedBbox.width;
        const bboxBottom = bboxTop + selectedBbox.height;
        
        // 各リサイズハンドルの領域チェック
        if (Math.abs(x - bboxLeft) <= handleSize && Math.abs(y - bboxTop) <= handleSize) {
          setEditMode('resize');
          setResizeHandle('topLeft');
          return;
        } else if (Math.abs(x - bboxRight) <= handleSize && Math.abs(y - bboxTop) <= handleSize) {
          setEditMode('resize');
          setResizeHandle('topRight');
          return;
        } else if (Math.abs(x - bboxLeft) <= handleSize && Math.abs(y - bboxBottom) <= handleSize) {
          setEditMode('resize');
          setResizeHandle('bottomLeft');
          return;
        } else if (Math.abs(x - bboxRight) <= handleSize && Math.abs(y - bboxBottom) <= handleSize) {
          setEditMode('resize');
          setResizeHandle('bottomRight');
          return;
        }
        // BBox内部の場合は移動の準備をする（まだ移動モードには入らない）
        else if (x >= bboxLeft && x <= bboxRight && y >= bboxTop && y <= bboxBottom) {
          console.log('選択されたBBox: 移動の準備');
          return;
        }
      }
    }
    
    // 既存のBBoxの選択チェック
    const clickedBbox = bboxes.find(bbox => {
      const bboxLeft = imageLayout.x + bbox.x;
      const bboxTop = imageLayout.y + bbox.y;
      const bboxRight = bboxLeft + bbox.width;
      const bboxBottom = bboxTop + bbox.height;
      
      return x >= bboxLeft && x <= bboxRight && y >= bboxTop && y <= bboxBottom;
    });
    
    if (clickedBbox) {
      // クリックされたBBoxを選択状態にする
      setSelectedBboxId(clickedBbox.id);
      
      // すでに選択されている場合は移動モードに入る
      if (selectedBboxId === clickedBbox.id) {
        setEditMode('move');
        console.log('既に選択されたBBox: 即座に移動モード開始');
      }
      return;
    }
    
    // 新しいBBoxの描画開始
    setSelectedBboxId(null); // 既存の選択を解除
    setEditMode(null); // 移動モードも終了
    
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
        label: selectedClass, // 選択中のクラスを設定
      };
      
      setCurrentBbox(newBbox);
      setIsDrawing(true);
    }
  }



  // 削除確認アラート
  function showDeleteAlert(bboxId: string) {
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
          onPress: () => deleteBbox(bboxId),
        },
      ]
    );
  }

  // BBox描画中
  function handlePanMove(event: any) {
    const { x, y } = event.nativeEvent;
    
    // 選択されたBBoxがあり、まだ編集モードでない場合の移動開始判定
    if (selectedBboxId && !editMode && initialTouchPoint && imageLayout) {
      const selectedBbox = bboxes.find(bbox => bbox.id === selectedBboxId);
      if (selectedBbox) {
        const bboxLeft = imageLayout.x + selectedBbox.x;
        const bboxTop = imageLayout.y + selectedBbox.y;
        const bboxRight = bboxLeft + selectedBbox.width;
        const bboxBottom = bboxTop + selectedBbox.height;
        
        // 初期タッチ位置がBBox内で、少しでも動いたら移動モード開始
        if (initialTouchPoint.x >= bboxLeft && initialTouchPoint.x <= bboxRight && 
            initialTouchPoint.y >= bboxTop && initialTouchPoint.y <= bboxBottom) {
          const deltaX = Math.abs(x - initialTouchPoint.x);
          const deltaY = Math.abs(y - initialTouchPoint.y);
          
          // 5px以上動いたら移動モード開始
          if (deltaX > 5 || deltaY > 5) {
            setEditMode('move');
            console.log('移動開始: 指の動きを検出');
          }
        }
      }
    }
    
    // BBox編集モードの処理
    if (editMode && selectedBboxId && imageLayout) {
      const selectedBbox = bboxes.find(bbox => bbox.id === selectedBboxId);
      if (!selectedBbox) return;
      
      const relativeX = Math.max(0, Math.min(x - imageLayout.x, imageLayout.width));
      const relativeY = Math.max(0, Math.min(y - imageLayout.y, imageLayout.height));
      
      if (editMode === 'move') {
        // BBox移動 - 画像境界内に制限
        // タッチポイントを基準にBBoxの中心を移動
        const newCenterX = relativeX;
        const newCenterY = relativeY;
        
        // BBoxの新しい左上位置を計算
        const newX = Math.max(0, Math.min(newCenterX - selectedBbox.width / 2, imageLayout.width - selectedBbox.width));
        const newY = Math.max(0, Math.min(newCenterY - selectedBbox.height / 2, imageLayout.height - selectedBbox.height));
        
        setBboxes(prev => prev.map(bbox => 
          bbox.id === selectedBboxId 
            ? { ...bbox, x: newX, y: newY }
            : bbox
        ));
      } else if (editMode === 'resize' && resizeHandle) {
        // BBoxリサイズ
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
        
        // 最小サイズチェックと画像境界チェック
        if (newWidth > 20 && newHeight > 20 && 
            newX >= 0 && newY >= 0 && 
            newX + newWidth <= imageLayout.width && 
            newY + newHeight <= imageLayout.height) {
          setBboxes(prev => prev.map(bbox => 
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
    
    // 幅と高さを計算（負の値も許可して自然な描画を実現）
    const width = relativeX - currentBbox.x;
    const height = relativeY - currentBbox.y;
    
    // 更新されたBBoxを設定（負の値も含めて）
    setCurrentBbox({
      ...currentBbox,
      width,
      height,
    });
  }

  // BBox描画終了
  function handlePanEnd() {
    // 初期タッチポイントをリセット
    setInitialTouchPoint(null);
    
    // 編集モード終了
    if (editMode) {
      setEditMode(null);
      setResizeHandle(null);
      
      // 編集の履歴記録（簡略化）
      if (selectedBboxId) {
        const editedBbox = bboxes.find(bbox => bbox.id === selectedBboxId);
        if (editedBbox) {
          const editAction: HistoryAction = {
            type: 'add', // 編集も追加として扱う
            bbox: editedBbox,
            timestamp: Date.now(),
          };
          setHistory(prev => [...prev, editAction]);
        }
      }
      return;
    }
    
    // 新しいBBox作成終了
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
        label: currentBbox.label, // ラベルを保持
      };
      
      setBboxes(prev => [...prev, normalizedBbox]);
      
      // 履歴に追加アクションを記録
      const addAction: HistoryAction = {
        type: 'add',
        bbox: normalizedBbox,
        timestamp: Date.now(),
      };
      setHistory(prev => [...prev, addAction]);
      
      // 新しく作成したBBoxを選択状態にする
      setSelectedBboxId(normalizedBbox.id);
    }
    
    setCurrentBbox(null);
    setIsDrawing(false);
  }

  // BBox削除
  function deleteBbox(id: string) {
    const bboxToDelete = bboxes.find(bbox => bbox.id === id);
    if (!bboxToDelete) return;
    
    setBboxes(prev => prev.filter(bbox => bbox.id !== id));
    
    // 選択状態もクリア
    if (selectedBboxId === id) {
      setSelectedBboxId(null);
    }
    
    // 履歴に削除アクションを記録
    const deleteAction: HistoryAction = {
      type: 'delete',
      bbox: bboxToDelete,
      timestamp: Date.now(),
    };
    setHistory(prev => [...prev, deleteAction]);
  }

  // Undo機能
  function undoLastAction() {
    if (history.length === 0) return;
    
    const lastAction = history[history.length - 1];
    
    if (lastAction.type === 'add') {
      // 最後に追加されたBBoxを削除
      setBboxes(prev => prev.filter(bbox => bbox.id !== lastAction.bbox.id));
    } else if (lastAction.type === 'delete') {
      // 最後に削除されたBBoxを復元
      setBboxes(prev => [...prev, lastAction.bbox]);
    }
    
    // 履歴から最後のアクションを削除
    setHistory(prev => prev.slice(0, -1));
  }

  // クラス選択時の処理
  function selectClass(className: string) {
    setSelectedClass(className);
    setShowClassModal(false);
    console.log(`[カメラ] クラス選択: "${className}"`);
  }

  // プレビュー画面を表示
  if (capturedPhoto) {
    return (
      <GestureHandlerRootView style={styles.container}>
        {Platform.OS === 'android' && <StatusBar hidden={true} />}
        {/* 上部の黒い帯 */}
        <View style={styles.topBar}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={retakePhoto}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>アノテーション</Text>
            <View style={styles.headerButton} />
          </View>
        </View>

        {/* プレビュー画像を中央に3:4で表示 */}
        <View style={styles.cameraContainer}>
          <Image
            source={{ uri: capturedPhoto }}
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
          {/* アノテーション用のオーバーレイ */}
          <PanGestureHandler
            onGestureEvent={handlePanMove}
            onHandlerStateChange={(event) => {
              if (event.nativeEvent.state === 4) {
                handlePanStart(event);
              } else if (event.nativeEvent.state === 5) {
                handlePanEnd();
              }
            }}
          >
            <View style={styles.annotationOverlay}>
              {/* 既存のBBox */}
              {bboxes.map((bbox) => {
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
                          backgroundColor: `${bboxColor}30`, // 透明度を追加
                          borderWidth: isSelected ? 3 : 2, // 選択時は太い枠
                          opacity: editMode === 'move' && isSelected ? 0.8 : 1, // 移動中は少し透明に
                        }
                      ]}
                      onPress={() => {
                        // タップで選択状態を切り替え
                        setSelectedBboxId(bbox.id);
                        setEditMode(null);
                      }}
                      onLongPress={() => {
                        // 長押しで削除確認ダイアログを表示
                        showDeleteAlert(bbox.id);
                      }}
                      delayLongPress={800} // 長押し判定を800msに設定
                      activeOpacity={0.7}
                    />
                    
                    {/* 選択時のリサイズハンドル */}
                    {isSelected && imageLayout && (
                      <>
                        {/* 四隅のリサイズハンドル */}
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
                    
                    {/* BBoxのラベル表示 */}
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
                      <Text style={styles.bboxLabelText}>{bbox.label || 'object'}</Text>
                    </View>
                  </View>
                );
              })}
              
              {/* 描画中のBBox */}
              {currentBbox && imageLayout && (
                (() => {
                  // 負のwidth/heightに対応した正規化された座標を計算
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
                          borderStyle: 'dashed', // 描画中は破線で表示
                          opacity: 0.8,
                        }
                      ]}
                    />
                  );
                })()
              )}
            </View>
          </PanGestureHandler>
        </View>

        {/* 下部の黒い帯 */}
        <View style={styles.bottomBar}>
          {/* ボタンを横並びに配置 */}
          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity 
              style={[styles.bottomButton, styles.undoButtonHorizontal, { opacity: history.length > 0 ? 1 : 0.5 }]} 
              onPress={undoLastAction}
              disabled={history.length === 0}
            >
              <Ionicons name="arrow-undo" size={24} color="white" />
              <Text style={styles.bottomButtonText}>戻す</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.bottomButton, styles.classSelectorHorizontal, styles.classSelectorWide, { backgroundColor: `${getClassColor(selectedClass, classes)}CC` }]} 
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
              onPress={() => savePhotoToDataset(capturedPhoto)}
            >
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.bottomButtonText}>完了</Text>
            </TouchableOpacity>
          </View>
        </View>

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

        {/* 保存完了メッセージのオーバーレイ */}
        {showSaveMessage && (
          <View style={styles.saveMessageOverlay}>
            <View style={styles.saveMessageContainer}>
              <Text style={styles.saveMessageTitle}>保存完了</Text>
              <Text style={styles.saveMessageText}>{saveMessage}</Text>
            </View>
          </View>
        )}
      </GestureHandlerRootView>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && <StatusBar hidden={true} />}
      {/* 上部の黒い帯 */}
      <View style={styles.topBar}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="white" />
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000, // Android用の elevation を追加
    ...Platform.select({
      android: {
        height: Dimensions.get('window').height,
        width: Dimensions.get('window').width,
      },
    }),
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
  undoButton: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    borderColor: '#FF6B6B', // デフォルト色（動的に上書きされる）
    backgroundColor: 'rgba(255, 107, 107, 0.2)', // デフォルト色（動的に上書きされる）
  },
  currentBbox: {
    // 描画中のBBoxの視覚的フィードバックを改善
    borderStyle: 'dashed',
    opacity: 0.8,
    elevation: 2, // Android用の影
    shadowColor: '#000', // iOS用の影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  // BBoxラベル用のスタイル
  bboxLabel: {
    position: 'absolute',
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
  // クラス選択用のスタイル
  classSelector: {
    position: 'absolute',
    bottom: 120,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  classSelectorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: 'black',
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
  classButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  classButtonText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
  },
  classButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  // 横並びボタン用のスタイル
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  undoButtonHorizontal: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  classSelectorHorizontal: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  classSelectorWide: {
    flex: 1.5, // 他のボタンより1.5倍の幅
  },
  saveButtonHorizontal: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  // 保存メッセージ用のスタイル
  saveMessageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  saveMessageContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    marginHorizontal: 40,
    alignItems: 'center',
  },
  saveMessageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  saveMessageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
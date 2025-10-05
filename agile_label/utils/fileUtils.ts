import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { ImageData } from '../contexts/DatasetContext';

// react-native-zip-archiveをオプショナルでインポート
let zip: ((source: string, target: string) => Promise<void>) | null = null;
try {
  const zipArchive = require('react-native-zip-archive');
  zip = zipArchive.zip;
} catch (error) {
  console.log('[ZIP] react-native-zip-archiveは利用できません (Expo Go環境)');
}

// 単一の画像をダウンロードして保存する関数
export async function saveImageToFiles(image: ImageData): Promise<boolean> {
  try {
    // メディアライブラリの権限を確認
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'フォトライブラリへの保存にはアクセス権限が必要です');
      return false;
    }

    // 画像をダウンロード
    const filename = `image_${image.id}_${Date.now()}.jpg`;
    const fileUri = FileSystem.documentDirectory + filename;
    
    const downloadResult = await FileSystem.downloadAsync(image.uri, fileUri);
    
    if (downloadResult.status === 200) {
      // フォトライブラリに保存
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
      // アルバムを作成または取得
      let album = await MediaLibrary.getAlbumAsync('AgileLabel');
      if (album == null) {
        album = await MediaLibrary.createAlbumAsync('AgileLabel', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      return true;
    } else {
      throw new Error('画像のダウンロードに失敗しました');
    }
  } catch (error) {
    console.error('画像保存エラー:', error);
    Alert.alert('エラー', '画像の保存に失敗しました');
    return false;
  }
}

// 複数の画像を一括でダウンロードして保存する関数
export async function saveMultipleImagesToFiles(images: ImageData[], datasetName: string): Promise<boolean> {
  try {
    // メディアライブラリの権限を確認
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'フォトライブラリへの保存にはアクセス権限が必要です');
      return false;
    }

    const assets = [];
    
    // 各画像をダウンロード
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = `${datasetName}_${image.id}_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      try {
        const downloadResult = await FileSystem.downloadAsync(image.uri, fileUri);
        
        if (downloadResult.status === 200) {
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          assets.push(asset);
        }
      } catch (error) {
        console.error(`画像 ${image.id} の保存に失敗:`, error);
      }
    }
    
    if (assets.length > 0) {
      // アルバムを作成または取得
      const albumName = `AgileLabel_${datasetName}`;
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (album == null) {
        album = await MediaLibrary.createAlbumAsync(albumName, assets[0], false);
        if (assets.length > 1) {
          await MediaLibrary.addAssetsToAlbumAsync(assets.slice(1), album, false);
        }
      } else {
        await MediaLibrary.addAssetsToAlbumAsync(assets, album, false);
      }
      
      return true;
    } else {
      throw new Error('保存できる画像がありませんでした');
    }
  } catch (error) {
    console.error('画像一括保存エラー:', error);
    Alert.alert('エラー', '画像の保存に失敗しました');
    return false;
  }
}

// ZIPファイルを作成してシェアする関数（iOSでファイルアプリに保存）
export async function createAndShareDatasetZip(images: ImageData[], datasetName: string, datasetId?: string): Promise<boolean> {
  try {
    const tempDir = FileSystem.documentDirectory + `${datasetName}_${Date.now()}/`;
    const imagesDir = tempDir + 'images/';
    const labelsDir = tempDir + 'labels/';
    
    // ディレクトリ構造を作成
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(labelsDir, { intermediates: true });
    
    // classes.txtファイルを作成（共有用の一時フォルダ内）
    let classList: string[] = [];
    try {
      let allClasses: string[] = [];
      
      // 元のデータセットのclasses.txtから既存のクラス名を読み取り（datasetIdが提供されている場合）
      if (datasetId) {
        try {
          const originalClassesPath = `${FileSystem.documentDirectory}datasets/${datasetId}/labels/classes.txt`;
          const originalClassesInfo = await FileSystem.getInfoAsync(originalClassesPath);
          
          if (originalClassesInfo.exists) {
            const originalContent = await FileSystem.readAsStringAsync(originalClassesPath);
            const existingClasses = originalContent
              .split('\n')
              .filter(line => line.trim() && !line.startsWith('#'))
              .map(line => line.trim());
            
            allClasses.push(...existingClasses);
            console.log(`[共有用] 元のclasses.txtから読み込み:`, existingClasses);
          }
        } catch (readError) {
          console.log('元のclasses.txt読み取りエラー (続行):', readError);
        }
      }
      
      // 画像のラベルからもクラス名を取得
      const imageLabels = Array.from(new Set(images.filter(img => img.label).map(img => img.label!)));
      allClasses.push(...imageLabels);
      
      // 重複を除去してソート
      const uniqueLabels = Array.from(new Set(allClasses.filter(label => label))).sort();
      classList = uniqueLabels;
      
      const classesContent = uniqueLabels.join('\n');
      
      const classesFilePath = labelsDir + 'classes.txt';
      await FileSystem.writeAsStringAsync(classesFilePath, classesContent);
      console.log(`[共有用] classes.txtを作成しました: ${uniqueLabels.length}個のクラス (一時フォルダ: ${classesFilePath})`, uniqueLabels);
    } catch (error) {
      console.error('共有用classes.txtの作成エラー:', error);
    }
    
    // 各画像をimagesフォルダにダウンロードし、対応するYOLO形式ラベルファイルを作成
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = `${image.id}.jpg`;
      const fileUri = imagesDir + filename;
      
      try {
        // ローカルファイルの場合はcopyAsync、リモートURLの場合はdownloadAsyncを使用
        if (image.uri.startsWith('file://') || image.uri.startsWith('/')) {
          // ローカルファイルをコピー
          await FileSystem.copyAsync({
            from: image.uri,
            to: fileUri,
          });
          console.log(`[エクスポート] ローカル画像をコピー: ${image.uri} -> ${fileUri}`);
        } else {
          // リモートURLからダウンロード
          await FileSystem.downloadAsync(image.uri, fileUri);
          console.log(`[エクスポート] リモート画像をダウンロード: ${image.uri} -> ${fileUri}`);
        }
        
        // バウンディングボックス情報があれば、既存のYOLO形式ラベルファイルをコピー
        if (image.bboxes && image.bboxes.length > 0) {
          const labelFilename = `${image.id}.txt`;
          const labelFileUri = labelsDir + labelFilename;
          
          // 既存のYOLO形式txtファイルを探す
          const imageName = image.uri.split('/').pop();
          const imageBaseName = imageName ? imageName.replace(/\.[^/.]+$/, '') : `image_${image.id}`;
          
          // camera.tsxで保存される実際のファイル名パターンに合わせる
          // 1. まず元のファイル名と同じ名前のtxtファイルを探す（photo_1234567890.txt）
          let originalLabelFile = `${FileSystem.documentDirectory}datasets/${datasetId}/${imageBaseName}.txt`;
          
          console.log(`[エクスポート] 既存ラベルファイル検索: ${originalLabelFile}`);
          
          try {
            let originalLabelInfo = await FileSystem.getInfoAsync(originalLabelFile);
            let yoloContent = '';
            
            if (originalLabelInfo.exists) {
              // 既存のYOLO形式ファイルをそのままコピー（正しい座標が保存されている）
              yoloContent = await FileSystem.readAsStringAsync(originalLabelFile);
              console.log(`[エクスポート] 既存ラベルファイルをコピー: ${originalLabelFile} -> ${labelFileUri}`);
              console.log(`[エクスポート] ラベル内容:\n${yoloContent}`);
            } else {
              // camera.tsxの実際の保存パターンに合わせて、データセットディレクトリ内のすべてのtxtファイルを確認
              console.warn(`[エクスポート] 標準パターンでラベルファイルが見つかりません: ${originalLabelFile}`);
              console.log(`[エクスポート] データセットディレクトリ内のtxtファイルを検索します...`);
              
              try {
                const datasetDir = `${FileSystem.documentDirectory}datasets/${datasetId}/`;
                const files = await FileSystem.readDirectoryAsync(datasetDir);
                const txtFiles = files.filter(file => file.endsWith('.txt'));
                
                console.log(`[エクスポート] 見つかったtxtファイル:`, txtFiles);
                
                // 画像ファイル名に対応するtxtファイルを探す（camera.tsxではphoto_timestampパターンで保存）
                // 例: photo_1234567890.jpg → photo_1234567890.txt
                const correspondingTxtFile = txtFiles.find(txtFile => {
                  const txtBaseName = txtFile.replace('.txt', '');
                  return imageBaseName === txtBaseName;
                });
                
                if (correspondingTxtFile) {
                  const correspondingTxtPath = `${datasetDir}${correspondingTxtFile}`;
                  console.log(`[エクスポート] 対応するtxtファイルを発見: ${correspondingTxtPath}`);
                  yoloContent = await FileSystem.readAsStringAsync(correspondingTxtPath);
                  console.log(`[エクスポート] 対応ラベルファイルをコピー: ${correspondingTxtPath} -> ${labelFileUri}`);
                  console.log(`[エクスポート] ラベル内容:\n${yoloContent}`);
                } else {
                  console.warn(`[エクスポート] 対応するtxtファイルが見つかりません。画像: ${imageBaseName}, txtファイル:`, txtFiles);
                }
              } catch (dirError) {
                console.error(`[エクスポート] ディレクトリ読み取りエラー:`, dirError);
              }
            }
            
            if (yoloContent) {
              await FileSystem.writeAsStringAsync(labelFileUri, yoloContent);
            } else {
              console.warn(`[エクスポート] 既存ラベルファイルが見つかりません: ${originalLabelFile}`);
              
              // 既存ファイルが見つからない場合は、camera.tsxと同じロジックで新規作成
              // ただし、実際の画像サイズが不明なので、標準サイズ（3024x4032）を仮定
              const CAMERA_IMAGE_WIDTH = 3024;
              const CAMERA_IMAGE_HEIGHT = 4032;
              
              // ImageGalleryの表示サイズ（adjustedCameraWidth/Height）を計算
              const screenWidth = 393; // 仮の値 - 実際にはDimensions.get('window').widthを使用
              const aspectRatio = 3 / 4;
              const adjustedCameraWidth = screenWidth;
              const adjustedCameraHeight = screenWidth / aspectRatio;
              
              const yoloAnnotations = image.bboxes.map(bbox => {
                // クラス名をクラス番号に変換
                const classIndex = classList.indexOf(bbox.label || 'object');
                const classNumber = classIndex >= 0 ? classIndex : 0;
                
                // BBox座標は表示座標なので、実際の画像座標に変換してからYOLO形式に正規化
                const scaleX = CAMERA_IMAGE_WIDTH / adjustedCameraWidth;
                const scaleY = CAMERA_IMAGE_HEIGHT / adjustedCameraHeight;
                
                const actualX = bbox.x * scaleX;
                const actualY = bbox.y * scaleY;
                const actualWidth = bbox.width * scaleX;
                const actualHeight = bbox.height * scaleY;
                
                // YOLO形式に正規化
                const centerX = (actualX + actualWidth / 2) / CAMERA_IMAGE_WIDTH;
                const centerY = (actualY + actualHeight / 2) / CAMERA_IMAGE_HEIGHT;
                const width = actualWidth / CAMERA_IMAGE_WIDTH;
                const height = actualHeight / CAMERA_IMAGE_HEIGHT;
                
                console.log(`[エクスポート-新規] BBox変換:`, {
                  表示座標: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
                  実際座標: { x: actualX, y: actualY, width: actualWidth, height: actualHeight },
                  正規化: { centerX, centerY, width, height }
                });
                
                return `${classNumber} ${centerX.toFixed(6)} ${centerY.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
              }).join('\n');
              
              await FileSystem.writeAsStringAsync(labelFileUri, yoloAnnotations);
              console.log(`[エクスポート] 新規ラベルファイルを作成: ${labelFileUri}`);
            }
          } catch (error) {
            console.error(`[エクスポート] ラベルファイル処理エラー:`, error);
          }
        }
      } catch (error) {
        console.error(`画像 ${image.id} のダウンロードに失敗:`, error);
      }
    }
    
    // ZIPファイルを作成してシェア
    try {
      const zipFileName = `${datasetName}_${Date.now()}.zip`;
      const zipFilePath = FileSystem.documentDirectory + zipFileName;
      
      // ZIP機能が利用可能かチェック
      if (zip) {
        // react-native-zip-archiveを使用してZIPファイルを作成
        await zip(tempDir, zipFilePath);
        console.log(`ZIPファイルを作成: ${zipFilePath}`);
        
        // ZIPファイルを共有
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(zipFilePath, {
            mimeType: 'application/zip',
            dialogTitle: `${datasetName}.zip を保存`
          });
          
          // 一時ファイルをクリーンアップ
          await FileSystem.deleteAsync(tempDir, { idempotent: true });
          await FileSystem.deleteAsync(zipFilePath, { idempotent: true });
          
          return true;
        } else {
          Alert.alert('エラー', 'この端末ではファイル共有機能を利用できません');
          return false;
        }
      } else {
        // ZIP機能が利用できない場合（Expo Go環境）
        throw new Error('ZIP機能が利用できません (Expo Go環境)');
      }
    } catch (zipError) {
      console.error('ZIP作成エラー:', zipError);
      
      // ZIP作成に失敗した場合、フォルダを直接共有（Expo Go環境の場合）
      Alert.alert(
        'ZIP作成不可',
        'この環境ではZIPファイルの作成ができません。フォルダとして共有しますか？\n\n（注意: Development Buildを使用するとZIP機能が利用できます）',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'フォルダで共有',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(tempDir, {
                  mimeType: 'application/zip',
                  dialogTitle: `${datasetName}フォルダを保存`
                });
              }
            }
          }
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('ZIP作成エラー:', error);
    Alert.alert('エラー', 'データセットの保存に失敗しました');
    return false;
  }
}

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { ImageData } from '../contexts/DatasetContext';

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
      const filename = `${datasetName}_${image.label || 'unlabeled'}_${image.id}_${Date.now()}.jpg`;
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
    const imgsDir = tempDir + 'imgs/';
    const labelsDir = tempDir + 'labels/';
    
    // ディレクトリ構造を作成
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(imgsDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(labelsDir, { intermediates: true });
    
    // 各画像をimgsフォルダにダウンロード
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = `${image.label || 'unlabeled'}_${image.id}.jpg`;
      const fileUri = imgsDir + filename;
      
      try {
        await FileSystem.downloadAsync(image.uri, fileUri);
        
        // ラベル情報があれば、対応するテキストファイルをlabelsフォルダに作成
        if (image.label) {
          const labelFilename = `${image.label}_${image.id}.txt`;
          const labelFileUri = labelsDir + labelFilename;
          await FileSystem.writeAsStringAsync(labelFileUri, image.label);
        }
      } catch (error) {
        console.error(`画像 ${image.id} のダウンロードに失敗:`, error);
      }
    }

    // classes.txtファイルを作成（共有用の一時フォルダ内）
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
      
      const classesContent = [
        '# クラス一覧',
        '# このデータセットに含まれるクラス名のリスト',
        '',
        ...uniqueLabels
      ].join('\n');
      
      const classesFilePath = labelsDir + 'classes.txt';
      await FileSystem.writeAsStringAsync(classesFilePath, classesContent);
      console.log(`[共有用] classes.txtを作成しました: ${uniqueLabels.length}個のクラス (一時フォルダ: ${classesFilePath})`, uniqueLabels);
    } catch (error) {
      console.error('共有用classes.txtの作成エラー:', error);
    }
    
    // シェア機能を使用（iOSではファイルアプリに保存可能）
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(tempDir, {
        mimeType: 'application/zip',
        dialogTitle: `${datasetName}を保存`
      });
      return true;
    } else {
      Alert.alert('エラー', 'この端末ではシェア機能を利用できません');
      return false;
    }
  } catch (error) {
    console.error('ZIP作成エラー:', error);
    Alert.alert('エラー', 'データセットの保存に失敗しました');
    return false;
  }
}

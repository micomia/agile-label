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
export async function createAndShareDatasetZip(images: ImageData[], datasetName: string): Promise<boolean> {
  try {
    const tempDir = FileSystem.documentDirectory + `${datasetName}_${Date.now()}/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    
    // 各画像をダウンロード
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = `${image.label || 'unlabeled'}_${image.id}.jpg`;
      const fileUri = tempDir + filename;
      
      try {
        await FileSystem.downloadAsync(image.uri, fileUri);
      } catch (error) {
        console.error(`画像 ${image.id} のダウンロードに失敗:`, error);
      }
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

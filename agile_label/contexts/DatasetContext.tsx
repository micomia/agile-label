import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BBoxの型定義
export interface BBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

// 画像データの型定義
export interface ImageData {
  id: string;
  uri: string;
  label?: string;
  createdAt: Date;
  bboxes?: BBox[]; // バウンディングボックス情報を追加
}

// データセットの型定義
export interface Dataset {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  imageCount: number; // 画像の枚数を追加
  labelCount: number; // ラベル数（クラス数）を追加
  images: ImageData[]; // 画像データの配列を追加
}

// コンテキストの型定義
interface DatasetContextType {
  datasets: Dataset[];
  isLoading: boolean;
  addDataset: (name: string, description: string, classNames?: string) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  addImageToDataset: (datasetId: string, imageUri: string, bboxes?: BBox[]) => Promise<void>;
  loadDatasetImages: (datasetId: string) => Promise<void>;
  deleteBboxFromImage: (datasetId: string, imageId: string, bboxId: string) => Promise<void>;
  deleteImageFromDataset: (datasetId: string, imageId: string) => Promise<void>;
  updateBboxInImage: (datasetId: string, imageId: string, bboxId: string, updatedBbox: BBox) => Promise<void>;
  addBboxToImage: (datasetId: string, imageId: string, newBbox: BBox) => Promise<void>;
  updateImageBboxes: (datasetId: string, imageId: string, newBboxes: BBox[]) => Promise<void>;
}

// コンテキストの作成
const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function DatasetProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 読み込み済みデータセットを追跡
  const [loadedDatasets, setLoadedDatasets] = useState<Set<string>>(new Set());

  // AsyncStorageのキー
  const DATASETS_STORAGE_KEY = 'agile_label_datasets';

  // 初期化時にデータを読み込み
  useEffect(() => {
    loadDatasetsFromStorage();
  }, []);

  // AsyncStorageからデータセット情報を読み込む
  const loadDatasetsFromStorage = async () => {
    try {
      setIsLoading(true);
      const storedData = await AsyncStorage.getItem(DATASETS_STORAGE_KEY);
      
      if (storedData) {
        const parsedDatasets: Dataset[] = JSON.parse(storedData);
        
        // Date オブジェクトを復元
        const datasetsWithDates = parsedDatasets.map(dataset => ({
          ...dataset,
          createdAt: new Date(dataset.createdAt),
          images: dataset.images.map(image => ({
            ...image,
            createdAt: new Date(image.createdAt)
          }))
        }));
        
        setDatasets(datasetsWithDates);
        console.log(`[データ復元] ${datasetsWithDates.length}個のデータセットを復元しました`);
      } else {
        console.log('[データ復元] 保存されたデータが見つかりません');
      }
    } catch (error) {
      console.error('データセット読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // AsyncStorageにデータセット情報を保存する
  const saveDatasetsToStorage = async (updatedDatasets: Dataset[]) => {
    try {
      const dataToStore = JSON.stringify(updatedDatasets);
      await AsyncStorage.setItem(DATASETS_STORAGE_KEY, dataToStore);
      console.log(`[データ保存] ${updatedDatasets.length}個のデータセットを保存しました`);
    } catch (error) {
      console.error('データセット保存エラー:', error);
    }
  };

  // データセット更新時に自動的に保存する関数
  const updateDatasetsWithPersistence = (updateFunction: (prev: Dataset[]) => Dataset[]) => {
    setDatasets(prev => {
      const updated = updateFunction(prev);
      // 非同期で保存
      saveDatasetsToStorage(updated);
      return updated;
    });
  };

  // classes.txtファイルからクラス数を読み取って更新する関数
  const updateLabelCountFromClassesFile = async (datasetId: string) => {
    try {
      const classesFilePath = `${FileSystem.documentDirectory}datasets/${datasetId}/labels/classes.txt`;
      const fileInfo = await FileSystem.getInfoAsync(classesFilePath);
      
      if (fileInfo.exists) {
        const classesContent = await FileSystem.readAsStringAsync(classesFilePath);
        const classes = classesContent
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.trim());
        
        const actualClassCount = classes.length;
        
        setDatasets(prev => prev.map(dataset => {
          if (dataset.id === datasetId) {
            console.log(`[クラス数更新] データセット ${datasetId}: ${dataset.labelCount} -> ${actualClassCount}`);
            return {
              ...dataset,
              labelCount: actualClassCount,
            };
          }
          return dataset;
        }));
        
        console.log(`[クラス数更新] classes.txtから読み取ったクラス数: ${actualClassCount}`, classes);
      }
    } catch (error) {
      console.error('classes.txtからのクラス数読み取りエラー:', error);
    }
  };

  // classes.txtファイルを更新する関数
  const updateClassesFile = async (datasetId: string, allLabels: string[]) => {
    try {
      const labelsDir = `${FileSystem.documentDirectory}datasets/${datasetId}/labels/`;
      const classesFilePath = `${labelsDir}classes.txt`;
      
      // 既存のclasses.txtから既存のクラス名を読み取り
      let existingClasses: string[] = [];
      try {
        const existingContent = await FileSystem.readAsStringAsync(classesFilePath);
        existingClasses = existingContent
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.trim());
      } catch (readError) {
        console.log('既存のclasses.txt読み取りエラー (新規作成):', readError);
      }
      
      // 既存のクラス名と新しいラベルをマージ
      const allClasses = [...existingClasses, ...allLabels];
      const uniqueLabels = Array.from(new Set(allClasses.filter(label => label))).sort();
      
      // classes.txtの内容を作成
      const content = uniqueLabels.join('\n');
      
      await FileSystem.writeAsStringAsync(classesFilePath, content);
      console.log(`classes.txtを更新しました: ${uniqueLabels.length}個のクラス`, uniqueLabels);
      
      // 更新されたクラス数を返す
      return uniqueLabels.length;
    } catch (error) {
      console.error('classes.txtの更新エラー:', error);
      return 0;
    }
  };

  const addDataset = async (name: string, description: string, classNames?: string) => {
    const newDataset: Dataset = {
      id: Date.now().toString(), // 簡単なID生成
      name,
      description,
      createdAt: new Date(),
      imageCount: 0, // 新規作成時は0枚
      labelCount: 0, // 新規作成時は0クラス
      images: [], // 新規作成時は空の配列
    };

    // データセット用のディレクトリ構造を作成
    try {
      const datasetDir = `${FileSystem.documentDirectory}datasets/${newDataset.id}/`;
      const imgsDir = `${datasetDir}imgs/`;
      const labelsDir = `${datasetDir}labels/`;
      
      // メインディレクトリと、imgs、labelsフォルダを作成
      await FileSystem.makeDirectoryAsync(datasetDir, { intermediates: true });
      await FileSystem.makeDirectoryAsync(imgsDir, { intermediates: true });
      await FileSystem.makeDirectoryAsync(labelsDir, { intermediates: true });
      
      // クラス名を処理してclasses.txtファイルを作成
      const classesFilePath = `${labelsDir}classes.txt`;
      let classesContent = '';
      
      if (classNames && classNames.trim()) {
        // クラス名を改行とカンマで分割し、空の値を除去してトリム
        const classList = classNames
          .split(/[\n,]/)
          .map(cls => cls.trim())
          .filter(cls => cls.length > 0);
        
        if (classList.length > 0) {
          // 重複を除去してソート
          const uniqueClasses = Array.from(new Set(classList)).sort();
          classesContent = uniqueClasses.join('\n');
          
          // labelCountを更新
          newDataset.labelCount = uniqueClasses.length;
        }
      }
      
      await FileSystem.writeAsStringAsync(classesFilePath, classesContent);
      
      console.log(`データセット ${newDataset.id} のフォルダ構造を作成しました:`, {
        datasetDir,
        imgsDir,
        labelsDir,
        classesFile: classesFilePath,
        classCount: newDataset.labelCount
      });
    } catch (error) {
      console.error('データセットフォルダの作成エラー:', error);
    }

    // 永続化機能を使ってデータセットを追加
    updateDatasetsWithPersistence(prev => [newDataset, ...prev]);
  };  const deleteDataset = async (id: string) => {
    // データセットのディレクトリを削除
    try {
      const datasetDir = `${FileSystem.documentDirectory}datasets/${id}/`;
      const dirInfo = await FileSystem.getInfoAsync(datasetDir);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(datasetDir, { idempotent: true });
        console.log(`データセット ${id} のフォルダを削除しました:`, datasetDir);
      }
    } catch (error) {
      console.error('データセットフォルダの削除エラー:', error);
    }

    // 永続化機能を使ってデータセットを削除
    updateDatasetsWithPersistence(prev => prev.filter(dataset => dataset.id !== id));

    // 読み込み済みリストからも削除
    setLoadedDatasets(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

    const addImageToDataset = async (datasetId: string, imageUri: string, bboxes?: BBox[]) => {
    // 新しい画像オブジェクトを作成
    const newImage: ImageData = {
      id: `${datasetId}-${Date.now()}`,
      uri: imageUri,
      createdAt: new Date(),
      bboxes: bboxes || [],
    };

    // classes.txtファイルを更新（既存の画像のラベルも含める）
    const existingDataset = datasets.find(d => d.id === datasetId);
    const existingLabels = existingDataset?.images?.filter(img => img.label).map(img => img.label!) || [];
    const newLabels = bboxes?.map(bbox => bbox.label).filter(Boolean) || [];
    const allLabels = [...existingLabels, ...newLabels].filter(Boolean) as string[];
    
    const actualClassCount = await updateClassesFile(datasetId, allLabels);
    
    // 永続化機能を使ってデータセットを更新
    updateDatasetsWithPersistence(prev => prev.map(dataset => {
      if (dataset.id === datasetId) {
        const updatedImages = [...dataset.images, newImage];
        
        console.log('データセット更新:', {
          datasetId,
          previousImageCount: dataset.images.length,
          newImageCount: updatedImages.length,
          labelCount: actualClassCount,
        });

        return {
          ...dataset,
          images: updatedImages,
          imageCount: updatedImages.length,
          labelCount: actualClassCount,
        };
      }
      return dataset;
    }));

    // 新しい画像が追加されたので、次回は再読み込みできるようにリセット
    setLoadedDatasets(prev => {
      const newSet = new Set(prev);
      newSet.delete(datasetId);
      return newSet;
    });
  };

  const loadDatasetImages = async (datasetId: string) => {
    // 既に読み込み済みの場合はスキップ
    if (loadedDatasets.has(datasetId)) {
      return;
    }

    try {
      const datasetDir = `${FileSystem.documentDirectory}datasets/${datasetId}/`;
      const dirInfo = await FileSystem.getInfoAsync(datasetDir);
      
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(datasetDir);
        const imageFiles = files.filter(file => 
          file.toLowerCase().endsWith('.jpg') || 
          file.toLowerCase().endsWith('.jpeg') || 
          file.toLowerCase().endsWith('.png')
        );

        const loadedImages: ImageData[] = imageFiles.map((fileName) => {
          const fullPath = `${datasetDir}${fileName}`;
          return {
            id: `${datasetId}-${fileName}`, // ファイル名を使ってユニークなIDを生成
            uri: fullPath,
            createdAt: new Date(),
          };
        });

        updateDatasetsWithPersistence(prev => prev.map(dataset => {
          if (dataset.id === datasetId) {
            // 既存の画像とファイルシステムの画像をマージ
            const existingUrls = new Set(dataset.images.map(img => img.uri));
            const newImages = loadedImages.filter(img => !existingUrls.has(img.uri));
            const allImages = [...dataset.images, ...newImages];
            const uniqueLabels = new Set(allImages.filter(img => img.label).map(img => img.label));
            
            console.log(`データセット ${datasetId} の画像を読み込み:`, {
              existing: dataset.images.length,
              loaded: loadedImages.length,
              new: newImages.length,
              total: allImages.length,
              labelCount: uniqueLabels.size
            });

            // classes.txtファイルを更新
            const allLabels = allImages.filter(img => img.label).map(img => img.label!);
            
            // 非同期処理のため、setDatasetsの外で実行してからsetDatasetsを呼ぶ
            updateClassesFile(datasetId, allLabels).then(actualClassCount => {
              updateDatasetsWithPersistence(prevDatasets => prevDatasets.map(prevDataset => {
                if (prevDataset.id === datasetId) {
                  return {
                    ...prevDataset,
                    labelCount: actualClassCount,
                  };
                }
                return prevDataset;
              }));
            });
            
            return {
              ...dataset,
              images: allImages,
              imageCount: allImages.length,
              labelCount: uniqueLabels.size,
            };
          }
          return dataset;
        }));

        // 読み込み済みとしてマーク
        setLoadedDatasets(prev => new Set(prev).add(datasetId));
      }
    } catch (error) {
      console.error('画像の読み込みエラー:', error);
    }
  };

  const deleteBboxFromImage = async (datasetId: string, imageId: string, bboxId: string) => {
    try {
      updateDatasetsWithPersistence(prev => prev.map(dataset => {
        if (dataset.id === datasetId) {
          const updatedImages = dataset.images.map(image => {
            if (image.id === imageId && image.bboxes) {
              const updatedBboxes = image.bboxes.filter(bbox => bbox.id !== bboxId);
              return {
                ...image,
                bboxes: updatedBboxes.length > 0 ? updatedBboxes : undefined
              };
            }
            return image;
          });

          // アノテーションファイルも更新
          const targetImage = updatedImages.find(img => img.id === imageId);
          if (targetImage) {
            updateAnnotationFile(targetImage, updatedImages.find(img => img.id === imageId)?.bboxes || []);
          }

          return {
            ...dataset,
            images: updatedImages
          };
        }
        return dataset;
      }));
    } catch (error) {
      console.error('BBox削除エラー:', error);
    }
  };

  // アノテーションファイルを更新する関数
  const updateAnnotationFile = async (image: ImageData, bboxes: BBox[]) => {
    try {
      const imageName = image.uri.split('/').pop();
      if (imageName) {
        const annotationName = imageName.replace(/\.(jpg|jpeg|png)$/i, '.txt');
        const annotationPath = image.uri.replace(imageName, annotationName);
        
        // datasetIdを取得
        const datasetId = image.uri.split('/')[image.uri.split('/').length - 2];
        const classesPath = `${FileSystem.documentDirectory}datasets/${datasetId}/labels/classes.txt`;
        
        // classes.txtからクラス名リストを取得
        let classList: string[] = [];
        try {
          const classesContent = await FileSystem.readAsStringAsync(classesPath);
          classList = classesContent.split('\n').filter(line => line.trim()).map(line => line.trim());
        } catch (classError) {
          console.log('classes.txt読み取りエラー:', classError);
        }
        
        // camera.tsxで既に正しいYOLO形式で保存されているため、再計算は不要
        // ただし、BBox削除の場合は既存ファイルを更新する必要がある
        if (bboxes.length === 0) {
          // BBoxがすべて削除された場合は、ファイルを削除または空にする
          await FileSystem.writeAsStringAsync(annotationPath, '');
          console.log('アノテーションファイルを空にしました:', annotationPath);
        } else {
          // 実際の画像サイズ（3024x4032）を使用してYOLO形式に変換
          const CAMERA_IMAGE_WIDTH = 3024;
          const CAMERA_IMAGE_HEIGHT = 4032;
          
          // ImageGalleryの表示サイズを計算（camera.tsxと同じロジック）
          const screenWidth = 393; // 仮の値
          const aspectRatio = 3 / 4;
          const adjustedCameraWidth = screenWidth;
          const adjustedCameraHeight = screenWidth / aspectRatio;
          
          // YOLO形式のアノテーション文字列を作成
          const yoloAnnotations = bboxes.map(bbox => {
            // クラス名をクラス番号に変換
            const classIndex = classList.indexOf(bbox.label || 'object');
            const classNumber = classIndex >= 0 ? classIndex : 0;
            
            // BBox座標（表示座標）を実際の画像座標に変換してからYOLO形式に正規化
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
            
            console.log(`[DatasetContext] BBox変換: "${bbox.label}" (${classNumber})`, {
              表示座標: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
              実際座標: { x: actualX, y: actualY, width: actualWidth, height: actualHeight },
              正規化: { centerX, centerY, width, height }
            });
            
            return `${classNumber} ${centerX.toFixed(6)} ${centerY.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
          }).join('\n');

          await FileSystem.writeAsStringAsync(annotationPath, yoloAnnotations);
          console.log('YOLO形式アノテーションファイルを更新:', annotationPath);
        }
      }
    } catch (error) {
      console.error('アノテーションファイル更新エラー:', error);
    }
  };

  // 画像削除機能
  const deleteImageFromDataset = async (datasetId: string, imageId: string) => {
    try {
      console.log(`[DatasetContext] 画像削除開始: ${imageId}`);
      
      // 永続化機能を使ってデータセットから画像を削除
      updateDatasetsWithPersistence(prevDatasets => 
        prevDatasets.map(dataset => {
          if (dataset.id === datasetId) {
            const updatedImages = dataset.images.filter(img => img.id !== imageId);
            return {
              ...dataset,
              images: updatedImages,
              imageCount: updatedImages.length
            };
          }
          return dataset;
        })
      );
      
      // ファイルシステムからも削除
      const targetImage = datasets.find(d => d.id === datasetId)?.images.find(img => img.id === imageId);
      if (targetImage) {
        // 画像ファイルを削除
        const imageExists = await FileSystem.getInfoAsync(targetImage.uri);
        if (imageExists.exists) {
          await FileSystem.deleteAsync(targetImage.uri);
          console.log('画像ファイル削除:', targetImage.uri);
        }
        
        // アノテーションファイルを削除
        const annotationPath = targetImage.uri.replace(/\.(jpg|jpeg|png)$/i, '.txt');
        const annotationExists = await FileSystem.getInfoAsync(annotationPath);
        if (annotationExists.exists) {
          await FileSystem.deleteAsync(annotationPath);
          console.log('アノテーションファイル削除:', annotationPath);
        }
      }
      
      console.log(`[DatasetContext] 画像削除完了: ${imageId}`);
    } catch (error) {
      console.error('画像削除エラー:', error);
      throw error;
    }
  };

  // BBox更新機能
  const updateBboxInImage = async (datasetId: string, imageId: string, bboxId: string, updatedBbox: BBox) => {
    try {
      console.log(`[DatasetContext] BBox更新開始: ${bboxId}`, updatedBbox);
      
      // メモリ内のデータを更新
      updateDatasetsWithPersistence(prevDatasets => 
        prevDatasets.map(dataset => {
          if (dataset.id === datasetId) {
            const updatedImages = dataset.images.map(image => {
              if (image.id === imageId) {
                const updatedBboxes = (image.bboxes || []).map(bbox => 
                  bbox.id === bboxId ? updatedBbox : bbox
                );
                return {
                  ...image,
                  bboxes: updatedBboxes
                };
              }
              return image;
            });
            return {
              ...dataset,
              images: updatedImages
            };
          }
          return dataset;
        })
      );
      
      // アノテーションファイルを更新
      const updatedDataset = datasets.find(d => d.id === datasetId);
      const updatedImage = updatedDataset?.images.find(img => img.id === imageId);
      if (updatedImage) {
        await updateAnnotationFile(updatedImage, updatedImage.bboxes || []);
      }
      
      console.log(`[DatasetContext] BBox更新完了: ${bboxId}`);
    } catch (error) {
      console.error('BBox更新エラー:', error);
      throw error;
    }
  };

  // BBox追加機能
  const addBboxToImage = async (datasetId: string, imageId: string, newBbox: BBox) => {
    try {
      console.log(`[DatasetContext] BBox追加開始: ${newBbox.id}`, newBbox);
      
      // メモリ内のデータを更新
      updateDatasetsWithPersistence(prevDatasets => 
        prevDatasets.map(dataset => {
          if (dataset.id === datasetId) {
            const updatedImages = dataset.images.map(image => {
              if (image.id === imageId) {
                const existingBboxes = image.bboxes || [];
                return {
                  ...image,
                  bboxes: [...existingBboxes, newBbox]
                };
              }
              return image;
            });
            return {
              ...dataset,
              images: updatedImages
            };
          }
          return dataset;
        })
      );
      
      // アノテーションファイルを更新
      const updatedDataset = datasets.find(d => d.id === datasetId);
      const updatedImage = updatedDataset?.images.find(img => img.id === imageId);
      if (updatedImage) {
        await updateAnnotationFile(updatedImage, updatedImage.bboxes || []);
      }
      
      console.log(`[DatasetContext] BBox追加完了: ${newBbox.id}`);
    } catch (error) {
      console.error('BBox追加エラー:', error);
      throw error;
    }
  };

  // 画像のBBoxes全体を更新する機能
  const updateImageBboxes = async (datasetId: string, imageId: string, newBboxes: BBox[]) => {
    try {
      console.log(`[DatasetContext] 画像のBBoxes全体更新開始: ${imageId}`, newBboxes);
      
      // メモリ内のデータを更新
      updateDatasetsWithPersistence(prevDatasets => 
        prevDatasets.map(dataset => {
          if (dataset.id === datasetId) {
            const updatedImages = dataset.images.map(image => {
              if (image.id === imageId) {
                return {
                  ...image,
                  bboxes: newBboxes
                };
              }
              return image;
            });
            return {
              ...dataset,
              images: updatedImages
            };
          }
          return dataset;
        })
      );
      
      // アノテーションファイルを更新
      const updatedDataset = datasets.find(d => d.id === datasetId);
      const updatedImage = updatedDataset?.images.find(img => img.id === imageId);
      if (updatedImage) {
        await updateAnnotationFile(updatedImage, newBboxes);
      }
      
      console.log(`[DatasetContext] 画像のBBoxes全体更新完了: ${imageId}`);
    } catch (error) {
      console.error('画像のBBoxes更新エラー:', error);
      throw error;
    }
  };

  return (
    <DatasetContext.Provider value={{ 
      datasets,
      isLoading,
      addDataset, 
      deleteDataset, 
      addImageToDataset, 
      loadDatasetImages,
      deleteBboxFromImage,
      deleteImageFromDataset,
      updateBboxInImage,
      addBboxToImage,
      updateImageBboxes
    }}>
      {children}
    </DatasetContext.Provider>
  );
}

// カスタムフック
export function useDatasets() {
  const context = useContext(DatasetContext);
  if (context === undefined) {
    throw new Error('useDatasets must be used within a DatasetProvider');
  }
  return context;
}

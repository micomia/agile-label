import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as FileSystem from 'expo-file-system';

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
  addDataset: (name: string, description: string, classNames?: string) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  addImageToDataset: (datasetId: string, imageUri: string, bboxes?: BBox[]) => Promise<void>;
  loadDatasetImages: (datasetId: string) => Promise<void>;
  deleteBboxFromImage: (datasetId: string, imageId: string, bboxId: string) => Promise<void>;
}

// コンテキストの作成
const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function DatasetProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  // 読み込み済みデータセットを追跡
  const [loadedDatasets, setLoadedDatasets] = useState<Set<string>>(new Set());

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

    setDatasets(prev => [newDataset, ...prev]); // 新しいデータセットを最初に追加
  };

  const deleteDataset = async (id: string) => {
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

    setDatasets(prev => prev.filter(dataset => dataset.id !== id));
    
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
    
    setDatasets(prev => prev.map(dataset => {
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

        setDatasets(prev => prev.map(dataset => {
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
              setDatasets(prevDatasets => prevDatasets.map(prevDataset => {
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
      setDatasets(prev => prev.map(dataset => {
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
        
        // 画像の実際のサイズを取得（アノテーション座標が保存されているのは表示サイズ基準のため）
        // ここでは仮の値を使用。実際には画像ファイルから取得する必要があります
        const imageWidth = 1000; // 仮の値 - 実装時は実際の画像サイズを取得
        const imageHeight = 1000; // 仮の値 - 実装時は実際の画像サイズを取得
        
        // YOLO形式のアノテーション文字列を作成
        const yoloAnnotations = bboxes.map(bbox => {
          // クラス名をクラス番号に変換
          const classIndex = classList.indexOf(bbox.label || 'object');
          const classNumber = classIndex >= 0 ? classIndex : 0;
          
          console.log(`[DatasetContext] クラス変換: "${bbox.label}" -> 番号: ${classNumber}, 利用可能クラス:`, classList);
          
          // 座標を正規化 (0-1の範囲)
          const centerX = (bbox.x + bbox.width / 2) / imageWidth;
          const centerY = (bbox.y + bbox.height / 2) / imageHeight;
          const width = bbox.width / imageWidth;
          const height = bbox.height / imageHeight;
          
          return `${classNumber} ${centerX.toFixed(6)} ${centerY.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
        }).join('\n');

        await FileSystem.writeAsStringAsync(annotationPath, yoloAnnotations);
        
        console.log('YOLO形式アノテーションファイルを更新:', annotationPath);
      }
    } catch (error) {
      console.error('アノテーションファイル更新エラー:', error);
    }
  };

  return (
    <DatasetContext.Provider value={{ 
      datasets, 
      addDataset, 
      deleteDataset, 
      addImageToDataset, 
      loadDatasetImages,
      deleteBboxFromImage
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

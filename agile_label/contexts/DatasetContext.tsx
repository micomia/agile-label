import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as FileSystem from 'expo-file-system';

// 画像データの型定義
export interface ImageData {
  id: string;
  uri: string;
  label?: string;
  createdAt: Date;
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
  addDataset: (name: string, description: string) => void;
  deleteDataset: (id: string) => void;
  addImageToDataset: (datasetId: string, imageUri: string) => void;
  loadDatasetImages: (datasetId: string) => Promise<void>;
}

// コンテキストの作成
const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function DatasetProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  // 読み込み済みデータセットを追跡
  const [loadedDatasets, setLoadedDatasets] = useState<Set<string>>(new Set());

  const addDataset = (name: string, description: string) => {
    const newDataset: Dataset = {
      id: Date.now().toString(), // 簡単なID生成
      name,
      description,
      createdAt: new Date(),
      imageCount: 0, // 新規作成時は0枚
      labelCount: 0, // 新規作成時は0クラス
      images: [], // 新規作成時は空の配列
    };
    setDatasets(prev => [newDataset, ...prev]); // 新しいデータセットを最初に追加
  };

  const deleteDataset = (id: string) => {
    setDatasets(prev => prev.filter(dataset => dataset.id !== id));
  };

  const addImageToDataset = (datasetId: string, imageUri: string) => {
    const newImage: ImageData = {
      id: Date.now().toString(),
      uri: imageUri,
      createdAt: new Date(),
    };

    console.log('addImageToDataset呼び出し:', { datasetId, imageUri });

    setDatasets(prev => prev.map(dataset => {
      if (dataset.id === datasetId) {
        const updatedImages = [...dataset.images, newImage];
        const uniqueLabels = new Set(updatedImages.filter(img => img.label).map(img => img.label));
        
        console.log('データセット更新:', {
          datasetId,
          previousImageCount: dataset.images.length,
          newImageCount: updatedImages.length,
          labelCount: uniqueLabels.size
        });
        
        return {
          ...dataset,
          images: updatedImages,
          imageCount: updatedImages.length,
          labelCount: uniqueLabels.size,
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

  return (
    <DatasetContext.Provider value={{ datasets, addDataset, deleteDataset, addImageToDataset, loadDatasetImages }}>
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

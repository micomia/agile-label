import React, { createContext, useContext, useState, ReactNode } from 'react';

// データセットの型定義
export interface Dataset {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

// コンテキストの型定義
interface DatasetContextType {
  datasets: Dataset[];
  addDataset: (name: string, description: string) => void;
  deleteDataset: (id: string) => void;
}

// コンテキストの作成
const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function DatasetProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([
    // サンプルデータ
    {
      id: '1',
      name: 'birds_dataset',
      description: '鳥類の画像分類のためのデータセット',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'flower_dataset',
      description: '花の種類を分類するためのデータセット',
      createdAt: new Date('2024-01-20'),
    },
  ]);

  const addDataset = (name: string, description: string) => {
    const newDataset: Dataset = {
      id: Date.now().toString(), // 簡単なID生成
      name,
      description,
      createdAt: new Date(),
    };
    setDatasets(prev => [newDataset, ...prev]); // 新しいデータセットを最初に追加
  };

  const deleteDataset = (id: string) => {
    setDatasets(prev => prev.filter(dataset => dataset.id !== id));
  };

  return (
    <DatasetContext.Provider value={{ datasets, addDataset, deleteDataset }}>
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Expo Goでの動作を確認するため、広告機能を条件付きで無効化
let mobileAds: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;
let AdsConsent: any = null;
let AdsConsentStatus: any = null;

try {
  // react-native-google-mobile-adsが利用可能な場合のみインポート
  const adsModule = require('react-native-google-mobile-ads');
  mobileAds = adsModule.default;
  InterstitialAd = adsModule.InterstitialAd;
  AdEventType = adsModule.AdEventType;
  TestIds = adsModule.TestIds;
  AdsConsent = adsModule.AdsConsent;
  AdsConsentStatus = adsModule.AdsConsentStatus;
} catch (error) {
  console.log('[Ad] Google Mobile Ads SDK is not available (Expo Go環境)');
}

// 広告コンテキストの型定義
interface AdContextType {
  photoCount: number;
  incrementPhotoCount: () => Promise<boolean>;
  resetPhotoCount: () => void;
  showInterstitial: () => Promise<void>;
  isAdLoaded: boolean;
}

// コンテキストの作成
const AdContext = createContext<AdContextType | undefined>(undefined);

// 広告IDの設定（プラットフォーム別）
// 開発環境・本番環境ともに実際のAd Unit IDを使用
const getAdUnitId = () => {
  // 常に本番用のAd Unit IDを使用
  return Platform.select({
    ios: 'ca-app-pub-1162211168125164/5241012212',     // iOSのインタースティシャル広告ID
    android: 'ca-app-pub-1162211168125164/4961810614', // Androidのインタースティシャル広告ID
    default: 'ca-app-pub-1162211168125164/4961810614'
  });
};

const adUnitId = getAdUnitId();

// プロバイダーコンポーネント
export function AdProvider({ children }: { children: ReactNode }) {
  const [photoCount, setPhotoCount] = useState(0);
  const [interstitial, setInterstitial] = useState<any | null>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  // AsyncStorageのキー
  const PHOTO_COUNT_KEY = 'agile_label_photo_count';

  // Mobile Ads SDKの初期化
  useEffect(() => {
    const initializeAds = async () => {
      try {
        console.log('[Ad] ========== 広告SDK初期化開始 ==========');
        console.log('[Ad] SDK利用可能性チェック:', {
          mobileAds: !!mobileAds,
          AdsConsent: !!AdsConsent,
          AdsConsentStatus: !!AdsConsentStatus,
          InterstitialAd: !!InterstitialAd,
          TestIds: !!TestIds
        });
        
        // Google Mobile Ads SDKが利用可能でない場合はスキップ
        if (!mobileAds || !AdsConsent || !AdsConsentStatus || !InterstitialAd) {
          console.log('[Ad] Google Mobile Ads SDK is not available - skipping initialization');
          console.log('[Ad] これはExpo Go環境で実行している可能性があります');
          return;
        }

        console.log('[Ad] 使用するAd Unit ID:', adUnitId);
        console.log('[Ad] 開発環境:', __DEV__);

        // プライバシー同意の確認（開発環境ではスキップ）
        console.log('[Ad] プライバシー同意の確認中...');
        
        if (!__DEV__) {
          // 本番環境のみプライバシー同意を処理
          try {
            const consentInfo = await AdsConsent.requestInfoUpdate();
            console.log('[Ad] 同意情報:', consentInfo);
            
            if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
              console.log('[Ad] 同意フォームを表示');
              await AdsConsent.showForm();
            }
          } catch (consentError) {
            console.warn('[Ad] プライバシー同意処理でエラー（続行）:', consentError);
          }
        } else {
          console.log('[Ad] 開発環境のためプライバシー同意処理をスキップ');
        }

        // Mobile Ads SDKを初期化
        console.log('[Ad] Mobile Ads SDKを初期化中...');
        await mobileAds().initialize();
        console.log('[Ad] Mobile Ads SDK初期化完了');
        
        // インタースティシャル広告を作成・設定
        console.log('[Ad] インタースティシャル広告を作成中...');
        const interstitialAd = InterstitialAd.createForAdRequest(adUnitId);
        console.log('[Ad] インタースティシャル広告オブジェクト作成完了');
        
        // 広告の読み込み完了イベント
        interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
          console.log('[Ad] インタースティシャル広告が読み込まれました - 表示準備完了');
          setIsAdLoaded(true);
        });

        // 広告表示完了イベント
        interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('[Ad] インタースティシャル広告が閉じられました - 次の広告を読み込み');
          setIsAdLoaded(false);
          // 次の広告を即座に読み込み
          setTimeout(() => {
            if (interstitialAd) {
              console.log('[Ad] 次回表示用の広告読み込みを開始');
              interstitialAd.load();
            }
          }, 100);
        });

        // エラーイベント
        interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
          console.error('[Ad] 広告エラー:', error);
          setIsAdLoaded(false);
          
          // 403エラーの場合は詳細ログ出力
          if (error?.message?.includes('403') || error?.message?.includes('no-fill')) {
            console.warn('[Ad] 広告配信なし (no-fill): 地域・時間・デバイスの制限、またはAd Unit IDの問題');
            console.warn('[Ad] 開発環境ではテスト用IDを使用することを推奨');
          }
          
          // エラー後も再試行（5秒後）
          setTimeout(() => {
            if (interstitialAd) {
              console.log('[Ad] 広告の再読み込みを試行');
              interstitialAd.load();
            }
          }, 5000);
        });

        setInterstitial(interstitialAd);
        console.log('[Ad] インタースティシャル広告オブジェクトをステートに保存');
        
        // 初回広告読み込み
        console.log('[Ad] 初回広告読み込みを開始');
        interstitialAd.load();
        console.log('[Ad] ========== 広告SDK初期化完了 ==========');
        
      } catch (error) {
        console.error('[Ad] ========== 広告SDKの初期化に失敗 ==========');
        console.error('[Ad] エラー詳細:', error);
        console.error('[Ad] エラースタック:', error instanceof Error ? error.stack : 'スタックなし');
      }
    };

    console.log('[Ad] 広告初期化処理を実行');
    initializeAds();
    loadPhotoCount();
  }, []);

  // AsyncStorageから写真カウントを読み込む
  const loadPhotoCount = async () => {
    try {
      const storedCount = await AsyncStorage.getItem(PHOTO_COUNT_KEY);
      if (storedCount) {
        setPhotoCount(parseInt(storedCount, 10));
      }
    } catch (error) {
      console.error('[Ad] 写真カウントの読み込みに失敗:', error);
    }
  };

  // AsyncStorageに写真カウントを保存
  const savePhotoCount = async (count: number) => {
    try {
      await AsyncStorage.setItem(PHOTO_COUNT_KEY, count.toString());
    } catch (error) {
      console.error('[Ad] 写真カウントの保存に失敗:', error);
    }
  };

  // 写真カウントを増加（5枚に達したら広告表示）
  const incrementPhotoCount = async (): Promise<boolean> => {
    const newCount = photoCount + 1;
    setPhotoCount(newCount);
    savePhotoCount(newCount);
    console.log(`[Ad] 写真カウント: ${newCount}`);

    // 5枚に達した場合は広告を表示して true を返す
    if (newCount >= 5) {
      console.log(`[Ad] 写真カウント${newCount}枚に達しました。広告表示を試行します。`);
      console.log(`[Ad] 広告の状態 - interstitial: ${!!interstitial}, isAdLoaded: ${isAdLoaded}`);
      console.log(`[Ad] 使用中のAd Unit ID: ${adUnitId}`);
      console.log(`[Ad] 開発環境: ${__DEV__}`);
      
      // カウントを先にリセット（広告表示失敗でも無限ループを防ぐ）
      resetPhotoCount();
      
      // Google Mobile Ads SDKが利用できない場合はスキップ
      if (!interstitial) {
        console.log('[Ad] Google Mobile Ads SDKが利用できないため、広告をスキップ');
        return false;
      }
      
      try {
        await showInterstitial();
        console.log('[Ad] 広告表示完了');
        return true; // 広告が表示されたことを示す
      } catch (error) {
        console.error('[Ad] 広告表示エラー:', error);
        return false; // 広告表示に失敗したが続行
      }
    }
    
    return false; // 通常の写真保存
  };

  // 写真カウントをリセット
  const resetPhotoCount = () => {
    setPhotoCount(0);
    savePhotoCount(0);
    console.log('[Ad] 写真カウントをリセット');
  };

  // インタースティシャル広告を表示
  const showInterstitial = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!interstitial) {
        console.log('[Ad] 広告オブジェクトが存在しません');
        resolve();
        return;
      }

      if (!isAdLoaded) {
        console.log('[Ad] 広告が読み込まれていません。広告読み込みを開始します。');
        // 広告が読み込まれていない場合は読み込みを試行
        try {
          interstitial.load();
          console.log('[Ad] 広告の読み込みを開始しました（次回表示用）');
        } catch (error) {
          console.error('[Ad] 広告読み込みエラー:', error);
        }
        resolve();
        return;
      }

      console.log('[Ad] 広告表示を開始します...');
      
      let isResolved = false;

      // 広告が閉じられた時のリスナーを一時的に追加
      const closeListener = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        if (!isResolved) {
          isResolved = true;
          console.log('[Ad] 広告が閉じられました（ユーザー操作）');
          closeListener?.();
          errorListener?.();
          resolve();
        }
      });

      // エラー時のリスナーを一時的に追加
      const errorListener = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        if (!isResolved) {
          isResolved = true;
          console.error('[Ad] 広告表示エラー:', error);
          closeListener?.();
          errorListener?.();
          
          // no-fillエラーの場合は正常終了として扱う
          if (error?.message?.includes('403') || error?.message?.includes('no-fill')) {
            console.log('[Ad] 広告配信なし（no-fill）のため正常終了');
            resolve();
          } else {
            reject(error);
          }
        }
      });

      try {
        console.log('[Ad] interstitial.show() を呼び出します');
        interstitial.show();
        console.log('[Ad] interstitial.show() 完了');
      } catch (error: any) {
        if (!isResolved) {
          isResolved = true;
          console.error('[Ad] 広告表示に失敗:', error);
          closeListener?.();
          errorListener?.();
          reject(error);
        }
      }
    });
  };

  return (
    <AdContext.Provider
      value={{
        photoCount,
        incrementPhotoCount,
        resetPhotoCount,
        showInterstitial,
        isAdLoaded,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}

// カスタムフック
export function useAds() {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}

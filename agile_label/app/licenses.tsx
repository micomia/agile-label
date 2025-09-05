import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { FontStyles } from '../constants/FontStyles';

interface LicenseInfo {
  licenses: string;
  repository?: string;
  publisher?: string;
  email?: string;
  path: string;
  licenseFile?: string;
  licenseText?: string;
  normalizedRepo?: {
    owner: string;
    repo: string;
    url: string;
  };
  licenseUrls?: string[];
  primaryLicenseUrl?: string;
}

interface LicensesData {
  [key: string]: LicenseInfo;
}

export default function LicensesScreen() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<LicensesData>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<{
    packageName: string;
    licenseType: string;
    licenseText: string;
  } | null>(null);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      // licenses-with-full-text.json を読み込み（実際のライセンステキスト付き）
      const licensesData = require('../licenses-with-full-text.json');
      
      const licensesWithText: LicensesData = {};
      
      for (const [packageName, info] of Object.entries(licensesData)) {
        const licenseInfo = info as LicenseInfo;
        
        // 実際のライセンステキストがある場合はそれを使用、なければフォールバック
        const licenseText = licenseInfo.licenseText || 
          getStandardLicenseText(licenseInfo.licenses, licenseInfo.publisher);
        
        licensesWithText[packageName] = {
          ...licenseInfo,
          licenseText
        };
      }
      
      setLicenses(licensesWithText);
    } catch (error) {
      console.error('ライセンス情報の読み込みに失敗しました:', error);
      Alert.alert('エラー', 'ライセンス情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getStandardLicenseText = (licenseType: string, publisher?: string): string => {
    // パッケージ名から著作権者を推測する関数
    const getCopyrightHolder = () => {
      if (publisher) {
        return publisher;
      }
      // publisherがない場合は一般的な表記を使用
      return 'The respective authors and contributors';
    };

    const copyrightHolder = getCopyrightHolder();

    switch (licenseType) {
      case 'MIT':
        return `MIT License

Copyright (c) ${copyrightHolder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

      case 'Apache-2.0':
        return `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;

      case 'BSD-3-Clause':
        return `BSD 3-Clause License

Copyright (c) ${copyrightHolder}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;

      case 'ISC':
        return `ISC License

Copyright (c) ${copyrightHolder}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`;

      default:
        return `${licenseType} License

This software is licensed under the ${licenseType} license.
${publisher ? `Copyright (c) ${publisher}` : 'Copyright (c) The respective authors and contributors'}

For the full license text, please refer to the project repository.`;
    }
  };

  const showLicenseText = (packageName: string, licenseType: string, licenseText?: string) => {
    setSelectedLicense({
      packageName,
      licenseType,
      licenseText: licenseText || 'ライセンステキストが見つかりません'
    });
    setModalVisible(true);
  };

  // ライセンス表示の処理
  const handleLicensePress = (packageName: string, info: LicenseInfo) => {
    // 直接ライセンステキストを表示
    showLicenseText(packageName, info.licenses, info.licenseText);
  };

  const handleBack = () => {
    router.back();
  };

  // パッケージを名前順でソートする関数
  const getSortedPackages = () => {
    return Object.entries(licenses).sort(([a], [b]) => a.localeCompare(b));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { zIndex: 1000 }]}>
        {/* カスタムヘッダー（ギャラリー画面と同じスタイル） */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ライセンス</Text>
          <View style={styles.rightSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sortedPackages = getSortedPackages();
  const totalPackages = Object.keys(licenses).length;

  return (
    <SafeAreaView style={[styles.container, { zIndex: 1000 }]}>
      {/* カスタムヘッダー（ギャラリー画面と同じスタイル） */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ライセンス</Text>
          <View style={styles.rightSpacer} />
        </View>

      {/* メインコンテンツエリア */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ライブラリごとのカード */}
        {sortedPackages.map(([packageName, info]) => (
          <TouchableOpacity
            key={packageName}
            style={styles.libraryCard}
            onPress={() => handleLicensePress(packageName, info)}
          >
            <View style={styles.libraryHeader}>
              <Text style={styles.libraryName}>{packageName}</Text>
              <View style={styles.licenseTag}>
                <Text style={styles.licenseTagText}>{info.licenses || 'Unknown'}</Text>
              </View>
            </View>
            
            <View style={styles.libraryDetails}>
              {info.repository && (
                <View style={styles.detailRow}>
                  <Ionicons name="logo-github" size={14} color={Colors.textSecondary} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {info.repository}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.libraryFooter}>
              <Text style={styles.viewLicenseText}>
                ライセンス全文を表示
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}

        {/* 統計情報カード */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>統計情報</Text>
          <Text style={styles.statsText}>総ライブラリ数: {totalPackages}個</Text>
        </View>

        {/* 最後に余白を追加 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ライセンス全文表示モーダル */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedLicense?.packageName}
            </Text>
            <View style={styles.rightSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.licenseTypeHeader}>
              {selectedLicense?.licenseType} License
            </Text>
            <Text style={styles.licenseFullText}>
              {selectedLicense?.licenseText}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Androidでのステータスバー対応
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    ...FontStyles.semiBold,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 28, // backButtonの幅を考慮してセンタリング
  },
  rightSpacer: {
    width: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // 新しいライブラリカード用スタイル
  libraryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  libraryName: {
    fontSize: 16,
    ...FontStyles.bold,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  licenseTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  licenseTagText: {
    fontSize: 12,
    ...FontStyles.medium,
    color: Colors.primary,
  },
  libraryDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  libraryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '30',
  },
  viewLicenseText: {
    fontSize: 14,
    color: Colors.primary,
    ...FontStyles.medium,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    ...FontStyles.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    ...FontStyles.bold,
    color: Colors.text,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  licenseCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  packageContent: {
    flex: 1,
  },
  packageName: {
    fontSize: 15,
    ...FontStyles.medium,
    color: Colors.text,
    marginBottom: 4,
  },
  packageDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  packageRepository: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bottomSpacer: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    ...FontStyles.semiBold,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 28,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  licenseTypeHeader: {
    fontSize: 20,
    ...FontStyles.bold,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  licenseFullText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
});

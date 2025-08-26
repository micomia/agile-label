import { Text, View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function PrivacyScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* カスタムヘッダー（ギャラリー画面と同じスタイル） */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>プライバシーポリシー</Text>
        <View style={styles.rightSpacer} />
      </View>

      {/* メインコンテンツエリア */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* タイトルと第1条の間にスペースを追加 */}
        <View style={styles.spacer} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第1条（基本方針）</Text>
          <Text style={styles.sectionText}>
            株式会社micomia（以下「当社」といいます）は、スマートフォンアプリケーション「Agile Label」（以下「本アプリ」といいます）において、利用者のプライバシーを尊重し、個人情報の保護に努めます。本プライバシーポリシーは、本アプリにおける個人情報の取扱いについて定めるものです。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第2条（収集する情報）</Text>
          <Text style={styles.sectionText}>
            本アプリは、以下の情報を収集する場合があります：
          </Text>
          <Text style={styles.listItem}>• デバイス情報（OS、機種名、アプリバージョンなど）</Text>
          <Text style={styles.listItem}>• アプリの利用状況（クラッシュレポート、パフォーマンス情報など）</Text>
          <Text style={styles.listItem}>• カメラで撮影された画像データ（デバイス内のみ保存）</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第3条（画像データの取扱い）</Text>
          <Text style={styles.sectionText}>
            本アプリで撮影された画像データについて：
          </Text>
          <Text style={styles.listItem}>• すべての画像データは利用者のデバイス内にのみ保存されます</Text>
          <Text style={styles.listItem}>• 当社のサーバーや外部サービスに送信されることはありません</Text>
          <Text style={styles.listItem}>• 画像データの管理・利用は利用者の責任において行われます</Text>
          <Text style={styles.listItem}>• アプリをアンインストールすると、すべてのデータが削除されます</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第4条（権限の利用目的）</Text>
          <Text style={styles.sectionText}>
            本アプリは以下の権限を利用します：
          </Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>カメラアクセス権限</Text>: 機械学習用データセット作成のための写真撮影</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>ストレージアクセス権限</Text>: 撮影した画像の保存とデータセットの管理</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>フォトライブラリアクセス権限</Text>: データセットの保存とエクスポート</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第5条（第三者への提供）</Text>
          <Text style={styles.sectionText}>
            当社は、利用者の個人情報を第三者に提供することはありません。ただし、以下の場合を除きます：
          </Text>
          <Text style={styles.listItem}>• 利用者の同意がある場合</Text>
          <Text style={styles.listItem}>• 法令に基づく場合</Text>
          <Text style={styles.listItem}>• 人の生命、身体または財産の保護のために必要がある場合</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第6条（セキュリティ）</Text>
          <Text style={styles.sectionText}>
            当社は、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。本アプリは、データの暗号化、安全な通信プロトコルの使用など、業界標準のセキュリティ対策を実装しています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第7条（お問い合わせ）</Text>
          <Text style={styles.sectionText}>
            本プライバシーポリシーに関するお問い合わせは、アプリ内のお問い合わせ機能またはサポートページよりご連絡ください。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第8条（プライバシーポリシーの変更）</Text>
          <Text style={styles.sectionText}>
            当社は、必要に応じて本プライバシーポリシーを変更することができます。変更は、本アプリ内での通知または当社ウェブサイトでの公表により効力を生じるものとします。重要な変更については、アプリ起動時に通知いたします。
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.companyInfo}>
            株式会社micomia{'\n'}
            © 2025 micomia Co., Ltd. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  rightSpacer: {
    width: 40, // backButtonと同じ幅でバランスを取る
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  spacer: {
    height: 24,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    textAlign: 'justify',
  },
  listItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginLeft: 8,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 32,
    marginBottom: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  companyInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

import { Text, View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>利用規約</Text>
        <View style={styles.rightSpacer} />
      </View>

      {/* メインコンテンツエリア */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* タイトルと第1条の間にスペースを追加 */}
        <View style={styles.spacer} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第1条（適用）</Text>
          <Text style={styles.sectionText}>
            本利用規約（以下「本規約」といいます）は、株式会社micomia（以下「当社」といいます）が提供するスマートフォンアプリケーション「Agile Label」（以下「本アプリ」といいます）の利用条件を定めるものです。本アプリをご利用になる場合には、本規約にご同意いただいたものとみなします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第2条（利用目的）</Text>
          <Text style={styles.sectionText}>
            本アプリは、機械学習用データセットの作成を支援することを目的として提供されています。利用者は、この目的に沿って本アプリを使用するものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第3条（禁止事項）</Text>
          <Text style={styles.sectionText}>
            利用者は、本アプリの利用にあたり、以下の行為を行ってはなりません：
          </Text>
          <Text style={styles.listItem}>• 法令または公序良俗に違反する行為</Text>
          <Text style={styles.listItem}>• 他者の著作権、肖像権、プライバシー権その他の権利を侵害する行為</Text>
          <Text style={styles.listItem}>• 本アプリの運営を妨害する行為</Text>
          <Text style={styles.listItem}>• 本アプリを商用目的で無断使用する行為</Text>
          <Text style={styles.listItem}>• その他当社が不適切と判断する行為</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第4条（知的財産権）</Text>
          <Text style={styles.sectionText}>
            本アプリに関する知的財産権は、当社または正当な権利者に帰属します。本規約に基づく本アプリの利用許諾は、本アプリに関する当社または正当な権利者の知的財産権の使用許諾を意味するものではありません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第5条（免責事項）</Text>
          <Text style={styles.sectionText}>
            当社は、本アプリの利用により利用者に生じた損害について、一切の責任を負いません。ただし、当社の故意または重大な過失による場合は、この限りではありません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第6条（プライバシー）</Text>
          <Text style={styles.sectionText}>
            当社は、利用者のプライバシーを尊重し、個人情報の取扱いについては、別途定めるプライバシーポリシーに従います。本アプリで撮影された画像データは、利用者のデバイス内にのみ保存され、当社のサーバーに送信されることはありません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第7条（規約の変更）</Text>
          <Text style={styles.sectionText}>
            当社は、必要に応じて本規約を変更することができます。規約の変更は、本アプリ内での通知または当社ウェブサイトでの公表により効力を生じるものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第8条（準拠法・管轄裁判所）</Text>
          <Text style={styles.sectionText}>
            本規約は、日本法に準拠し、本規約に関する紛争については、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
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
  headerBorder: {
    height: 1,
    backgroundColor: Colors.border,
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

import { Text, View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Linking, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontStyles } from '../../constants/FontStyles';

export default function AboutScreen() {
  const router = useRouter();

  const handleLinkPress = (url: string, title: string) => {
    Alert.alert(
      title,
      `${url}を開きますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '開く', 
          onPress: () => Linking.openURL(url).catch(() => 
            Alert.alert('エラー', 'リンクを開けませんでした')
          )
        }
      ]
    );
  };

  const handlePrivacyPress = () => {
    router.push('../privacy' as any);
  };

  const handleLicensePress = () => {
    router.push('../licenses' as any);
  };

  const handleTermsPress = () => {
    router.push('../terms' as any);
  };

  const handleHelpPress = () => {
    router.push('../help' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* カスタムヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>その他</Text>
      </View>
      
      {/* メインコンテンツエリア */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* アプリ情報セクション */}
        <View style={styles.section}>
          <View style={styles.appInfo}>
            <Image 
              source={require('../../assets/images/icon_agilelabel.png')} 
              style={styles.appIcon}
            />
            <Text style={styles.appName}>Agile Label</Text>
            <Text style={styles.appDescription}>
              機械学習用データセット作成アプリ
            </Text>
          </View>
        </View>

        {/* このアプリについてセクション */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>このアプリについて</Text>
        </View>

        {/* メニューセクション */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleHelpPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>ヘルプ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>プライバシーポリシー</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTermsPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>利用規約</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLicensePress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>ライセンス</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.versionItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>バージョン</Text>
            </View>
            <Text style={styles.versionText}>0.1.0</Text>
          </View>
        </View>

        {/* 著作権情報 */}
        <View style={styles.section}>
          <Text style={styles.copyright}>
            © 2025 micomia Co., Ltd.
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
    // Androidでのステータスバー対応
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 24,
    color: Colors.text,
    ...FontStyles.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  aboutSection: {
    marginBottom: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appName: {
    fontSize: 28,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 4,
    ...FontStyles.bold,
  },
  appVersion: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.cardBackground,
    marginBottom: 1,
    borderRadius: 8,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.cardBackground,
    marginBottom: 1,
    borderRadius: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 16,
  },
  versionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...FontStyles.medium,
  },
  sectionTitle: {
    fontSize: 20,
    color: Colors.text,
    marginBottom: 16,
    ...FontStyles.semiBold,
  },
  copyright: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 8, // 角を少し丸くする
  },
});

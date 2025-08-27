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
          <Text style={styles.sectionTitle}>お客様から取得する情報</Text>
          <Text style={styles.sectionText}>
            当社は、お客様から以下の情報を取得します。
          </Text>
          <Text style={styles.listItem}>• 写真や動画</Text>
          <Text style={styles.listItem}>• OSが生成するID、端末の種類、端末識別子等のお客様が利用するOSや端末に関する情報</Text>
          <Text style={styles.listItem}>• 当社アプリの起動時間、入力履歴、購買履歴等の当社アプリの利用履歴</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>お客様の情報を利用する目的</Text>
          <Text style={styles.sectionText}>
            当社は、お客様から取得した情報を、以下の目的のために利用します。
          </Text>
          <Text style={styles.listItem}>• 当社サービスに関する登録の受付、お客様の本人確認、認証のため</Text>
          <Text style={styles.listItem}>• お客様の当社サービスの利用履歴を管理するため</Text>
          <Text style={styles.listItem}>• 利用料金の決済のため</Text>
          <Text style={styles.listItem}>• 当社サービスにおけるお客様の行動履歴を分析し、当社サービスの維持改善に役立てるため</Text>
          <Text style={styles.listItem}>• 広告の配信、表示及び効果測定のため</Text>
          <Text style={styles.listItem}>• お客様の趣味嗜好にあわせたターゲティング広告を表示するため</Text>
          <Text style={styles.listItem}>• 当社のサービスに関するご案内をするため</Text>
          <Text style={styles.listItem}>• 提携する事業者・サービスのご案内をお送りするため</Text>
          <Text style={styles.listItem}>• お客様からのお問い合わせに対応するため</Text>
          <Text style={styles.listItem}>• 当社の規約や法令に違反する行為に対応するため</Text>
          <Text style={styles.listItem}>• 当社サービスの変更、提供中止、終了、契約解除をご連絡するため</Text>
          <Text style={styles.listItem}>• 当社規約の変更等を通知するため</Text>
          <Text style={styles.listItem}>• 以上の他、当社サービスの提供、維持、保護及び改善のため</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>安全管理のために講じた措置</Text>
          <Text style={styles.sectionText}>
            当社が、お客様から取得した情報に関して安全管理のために講じた措置につきましては、末尾記載のお問い合わせ先にご連絡をいただきましたら、法令の定めに従い個別にご回答させていただきます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第三者提供</Text>
          <Text style={styles.sectionText}>
            当社は、お客様から取得する情報のうち、個人データ（個人情報保護法第１６条第３項）に該当するものついては、あらかじめお客様の同意を得ずに、第三者（日本国外にある者を含みます。）に提供しません。但し、次の場合は除きます。
          </Text>
          <Text style={styles.listItem}>• 個人データの取扱いを外部に委託する場合</Text>
          <Text style={styles.listItem}>• 当社や当社サービスが買収された場合</Text>
          <Text style={styles.listItem}>• 事業パートナーと共同利用する場合（具体的な共同利用がある場合は、その内容を別途公表します。）</Text>
          <Text style={styles.listItem}>• その他、法律によって合法的に第三者提供が許されている場合</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アクセス解析ツール</Text>
          <Text style={styles.sectionText}>
            当社は、お客様のアクセス解析のために、「Googleアナリティクス」を利用しています。Googleアナリティクスは、トラフィックデータの収集のためにCookieを使用しています。トラフィックデータは匿名で収集されており、個人を特定するものではありません。Cookieを無効にすれば、これらの情報の収集を拒否することができます。詳しくはお使いのブラウザの設定をご確認ください。Googleアナリティクスについて、詳しくは以下からご確認ください。
          </Text>
          <Text style={[styles.sectionText, styles.bold]}>
            https://marketingplatform.google.com/about/analytics/terms/jp/
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>広告の配信</Text>
          <Text style={styles.sectionText}>
            当社は、Google及びそのパートナー（第三者配信事業者）の提供する広告を設置しています。広告配信にはCookieを使用し、お客様が過去に当社ウェブサイトやその他のサイトにアクセスした情報に基づいて広告を配信します。Google やそのパートナーは、Cookieを使用することにより適切な広告を表示しています。
          </Text>
          <Text style={styles.sectionText}>
            お客様は、以下のGoogleアカウントの広告設定ページから、パーソナライズ広告を無効にできます。
          </Text>
          <Text style={[styles.sectionText, styles.bold]}>
            https://adssettings.google.com/u/0/authenticated
          </Text>
          <Text style={styles.sectionText}>
            また aboutads.info のページにアクセスし、パーソナライズ広告掲載に使用される第三者配信事業者のCookieを無効にすることもできます。その他、GoogleによるCookieの取り扱い詳細については、以下のGoogleのポリシーと規約のページをご覧ください。
          </Text>
          <Text style={[styles.sectionText, styles.bold]}>
            https://policies.google.com/technologies/ads
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プライバシーポリシーの変更</Text>
          <Text style={styles.sectionText}>
            当社は、必要に応じて、このプライバシーポリシーの内容を変更します。この場合、変更後のプライバシーポリシーの施行時期と内容を適切な方法により周知または通知します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>お問い合わせ</Text>
          <Text style={styles.sectionText}>
            お客様の情報の開示、情報の訂正、利用停止、削除をご希望の場合は、以下のメールアドレスにご連絡ください。
          </Text>
          <Text style={[styles.sectionText, styles.bold]}>
            support@agilelabel.com
          </Text>
          <Text style={styles.sectionText}>
            この場合、必ず、運転免許証のご提示等当社が指定する方法により、ご本人からのご請求であることの確認をさせていただきます。なお、情報の開示請求については、開示の有無に関わらず、ご申請時に一件あたり1,000円の事務手数料を申し受けます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>事業者の名前</Text>
          <Text style={styles.sectionText}>
            micomia株式会社
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>代表者氏名</Text>
          <Text style={styles.sectionText}>
            畑井駿佑
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>事業者の住所</Text>
          <Text style={styles.sectionText}>
            兵庫県神戸市中央区磯辺通1丁目1番18号カサベラ国際プラザビル707号室
          </Text>
          <Text style={styles.sectionText}>
          2025年08月26日 制定
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

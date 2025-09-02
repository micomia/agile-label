import { Text, View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function HelpScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* カスタムヘッダー（terms画面と同じスタイル） */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ヘルプ</Text>
                <View style={styles.rightSpacer} />
            </View>

            {/* メインコンテンツエリア */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* タイトルとコンテンツの間にスペースを追加 */}

                {/* アプリ概要セクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Agile Labelについて</Text>
                    <Text style={styles.text}>
                        Agile Labelは機械学習用のデータセットをスマートフォンのみで、誰でもどこでも簡単に作成することができるアプリです。
                        
                    </Text>
                </View>

                {/* 主な機能セクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>主な機能</Text>
                
                    <View style={styles.featureItem}>
                        <Ionicons name="folder" size={24} color={Colors.primary} />
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>データセット管理</Text>
                            <Text style={styles.featureDescription}>
                                複数のデータセットを作成・管理し、目的に応じて画像とラベルを整理できます。
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="pricetag" size={24} color={Colors.primary} />
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>ラベル付けワークフロー</Text>
                            <Text style={styles.featureDescription}>
                                撮影した写真に対して簡単にラベルを付けることができ、機械学習用の教師データとして活用できます。
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="download" size={24} color={Colors.primary} />
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>データエクスポート</Text>
                            <Text style={styles.featureDescription}>
                                作成したデータセットをワンタップで簡単にZIP形式で書き出すことができます。
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 使い方セクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>使い方</Text>
                    
                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>データセットを作成</Text>
                            <Text style={styles.stepDescription}>
                                ホーム画面の「＋」ボタンから新しいデータセットを作成します。
                                名前と説明を入力し、ラベル（クラス）を定義してください。
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>写真を撮影</Text>
                            <Text style={styles.stepDescription}>
                                データセットの詳細画面でカメラアイコンをタップし、写真を撮影します。
                                撮影後、ラベルを選択してBBoxを作成してください。
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>アノテーション修正</Text>
                            <Text style={styles.stepDescription}>
                                撮影した写真のアノテーションは、データセットの詳細画面でいつでも修正可能です。
                                BBoxの位置やラベルを変更したり、不要なアノテーションを削除できます。
                                
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>4</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>データセットをエクスポート</Text>
                            <Text style={styles.stepDescription}>
                                完成したデータセットは、ダウンロードアイコンから書き出すことができます。
                                ZIP形式でエクスポートされ、他のアプリで利用できます。
                            </Text>
                        </View>
                    </View>
                </View>

                {/* よくある質問セクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>よくある質問</Text>
                    
                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>Q. 写真の品質はどのくらいですか？</Text>
                        <Text style={styles.faqAnswer}>
                            A. 3024×4032ピクセルの高解像度で撮影され、機械学習に適した品質の画像を取得できます。
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>Q. データセットのサイズ制限はありますか？</Text>
                        <Text style={styles.faqAnswer}>
                            A. アプリ自体にサイズ制限はありませんが、デバイスのストレージ容量に依存します。
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>Q. エクスポートしたデータの形式は？</Text>
                        <Text style={styles.faqAnswer}>
                            A. ZIP形式で書き出され、画像（jpg）とラベル（txt）のディレクトリがそれぞれ保存されます。
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>Q. データセットを削除したい場合は？</Text>
                        <Text style={styles.faqAnswer}>
                            A. ホーム画面でデータセットカードを長押しすると、削除オプションが表示されます。
                        </Text>
                    </View>
                </View>

                {/* サポートセクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>サポート</Text>
                    <Text style={styles.text}>
                        その他のご質問やサポートが必要な場合は、開発者までお問い合わせください。
                    </Text>
                </View>

                {/* 余白 */}
                <View style={styles.bottomSpacing} />
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
    // spacer: {
    //     height: 24,
    // },
    section: {
        // marginBottom: 32,
        marginTop: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
    },
    featureItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    featureContent: {
        flex: 1,
        marginLeft: 16,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    stepContent: {
        flex: 1,
        marginLeft: 16,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    faqItem: {
        marginBottom: 20,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    faqAnswer: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    bottomSpacing: {
        height: 40,
    },
});

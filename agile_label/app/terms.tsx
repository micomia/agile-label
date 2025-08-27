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
                    <Text style={styles.sectionText}>
                        この利用規約(以下、「本規約」といいます。)は、本サービス(本サイトを含むものとし、以下、特に両者を区別しません。)の利用条件を定めるものです。本規約は、本サービスを利用するすべてのユーザーに適用されます。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>本規約への同意</Text>
                    <Text style={styles.sectionText}>
                        ユーザーは、本サービスを利用することによって、本規約に有効かつ取り消し不能な同意をしたものとみなされます。本規約に同意しないユーザーは、本サービスをご利用いただけません。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>未成年による利用</Text>
                    <Text style={styles.sectionText}>
                        ユーザーが未成年である場合には、法定代理人の同意を得た上で、本サービスを利用してください。本サービスのご利用にあたり必要となるスマートフォンその他デバイスについても、必ず法定代理人の同意を得た上でご使用下さい。{"\n"}
                        法定代理人の同意を得ずに本サービスのご利用を開始したユーザーが成年に達した場合、未成年者であった間の利用行為を追認したものとみなします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>コンテンツのご利用</Text>
                    <Text style={styles.sectionText}>
                        当社は、ユーザーに対し、本サービスが提供する文章、画像、動画、音声、音楽、ソフトウェア、プログラム、コードその他のコンテンツについて、本サービスの利用範囲内における私的な利用を許諾します。有償コンテンツについては、当社が定める利用料金の支払が完了した場合に、本サービスの利用範囲内における私的な利用を許諾します。これは、譲渡及び再許諾できない、非独占的な利用権です。この範囲を超えて本サービスが提供するコンテンツを利用することは一切禁止します。{"\n"}
                        理由の如何を問わず、ユーザーが本サービスを利用する権利を失った場合、本サービスの一切のコンテンツの利用ができなくなることを、ユーザーは予め承諾するものとします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>遅延損害金</Text>
                    <Text style={styles.sectionText}>
                        当社に対する金銭債務の支払を遅滞したユーザーは、当社に対し、年14.6％の割合による遅延損害金を支払うものとします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>広告の表示</Text>
                    <Text style={styles.sectionText}>
                        当社は、本サービスに当社または第三者の広告を掲載することができるものとします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>第6条（プライバシー）</Text>
                    <Text style={styles.sectionText}>
                        当社は、利用者のプライバシーを尊重し、個人情報の取扱いについては、別途定めるプライバシーポリシーに従います。本アプリで撮影された画像データは、利用者のデバイス内にのみ保存され、当社のサーバーに送信されることはありません。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>禁止事項</Text>
                    <Text style={styles.sectionText}>
                        ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                    </Text>
                    <Text style={styles.listItem}>・法令、裁判所の判決、決定若しくは命令、又は法令上拘束力のある行政措置に違反する行為又はこれらを助長する行為</Text>
                    <Text style={styles.listItem}>・犯罪行為に関連する行為</Text>
                    <Text style={styles.listItem}>・当社や第三者の知的財産権を侵害する行為</Text>
                    <Text style={styles.listItem}>・当社や第三者の肖像権、プライバシー、名誉、その他の権利又は利益を侵害する行為</Text>
                    <Text style={styles.listItem}>・当社や第三者のサーバーまたはネットワークに過度の負担をかけたり、その正常な作動を妨害する行為</Text>
                    <Text style={styles.listItem}>・当社のサービスの運営を妨害するおそれのある行為</Text>
                    <Text style={styles.listItem}>・不正アクセスをし、またはこれを試みる行為</Text>
                    <Text style={styles.listItem}>・逆アセンブル、逆コンパイル、リバースエンジニアリング等によって本サービスのソースコードを解析する行為</Text>
                    <Text style={styles.listItem}>・本サービスに接続しているシステムに権限なく不正にアクセスし又は当社設備に蓄積された情報を不正に書き換え若しくは消去する行為</Text>
                    <Text style={styles.listItem}>・本サービスのウェブサイトやソフトウェアを複製、送信、譲渡、貸与又は改変する行為</Text>
                    <Text style={styles.listItem}>・本サービス上のアカウント又はコンテンツを第三者に有償で貸与、譲渡、売買等をする行為</Text>
                    <Text style={styles.listItem}>・本サービスによって得られた情報を商業的に利用する行為</Text>
                    <Text style={styles.listItem}>・当社が意図しない方法によって本サービスに関連して利益を得ることを目的とする行為</Text>
                    <Text style={styles.listItem}>・当社が許諾しない本サービス上での宣伝、広告、勧誘、または営業行為</Text>
                    <Text style={styles.listItem}>・他のユーザーに関する個人情報等を収集または蓄積する行為</Text>
                    <Text style={styles.listItem}>・違法、不正又は不当な目的を持って本サービスを利用する行為</Text>
                    <Text style={styles.listItem}>・本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</Text>
                    <Text style={styles.listItem}>・他のユーザーに成りすます行為</Text>
                    <Text style={styles.listItem}>・他のユーザーのアカウントを利用する行為</Text>
                    <Text style={styles.listItem}>・面識のない異性との出会いを目的とした行為</Text>
                    <Text style={styles.listItem}>・反社会的勢力に対して直接または間接に利益を供与する行為</Text>
                    <Text style={styles.listItem}>・公序良俗に違反する行為</Text>
                    <Text style={styles.listItem}>・歩行中、車両運転中、その他本サービスの利用が不適切な状況又は態様において本サービスを利用する行為</Text>
                    <Text style={styles.listItem}>・その他、当社が不適切と判断する行為</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>換金行為の禁止 </Text>
                    <Text style={styles.sectionText}>
                        本サービス内で取得した一切のコンテンツまたは本仮想通貨については、手段の如何を問わず、以下の取引を一切禁止します。
                    </Text>
                    <Text style={styles.listItem}>・売買</Text>
                    <Text style={styles.listItem}>・金銭その他の対価を授受する形でのあらゆる譲渡、譲受、貸与、借用等</Text>
                    <Text style={styles.listItem}>・その他換金行為に該当すると当社が判断する一切の行為</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>反社会的勢力の排除 </Text>
                    <Text style={styles.sectionText}>
                        ユーザーは、次の各号のいずれか一にも該当しないことを表明し、かつ将来にわたっても該当しないことを表明し、保証するものとします。
                    </Text>
                    <Text style={styles.listItem}>・自ら（法人その他の団体にあっては、自らの役員を含みます。）が、暴力団、暴力団員、暴力団員でなくなった時から5年を経過しない者、暴力団準構成員、暴力団関係企業、総会屋、社会運動等標ぼうゴロまたは特殊知能暴力集団等その他これらに準じる者（以下総称して「暴力団員等」といいます。）であること</Text>
                    <Text style={styles.listItem}>・ユーザーが法人その他の団体の場合にあっては、暴力団員等が経営を支配していると認められる関係を有すること</Text>
                    <Text style={styles.listItem}>・ユーザーが法人その他の団体の場合にあっては、暴力団員等が経営に実質的に関与していると認められる関係を有すること</Text>
                    <Text style={styles.listItem}>・自らもしくは第三者の不正の利益を図る目的または第三者に損害を加える目的をもって取引を行うなど、暴力団員等を利用していると認められる関係を有すること</Text>
                    <Text style={styles.listItem}>・暴力団員等に対して資金等を提供し、または便宜を供与するなどの関与をしていると認められる関係を有すること</Text>
                    <Text style={styles.listItem}>・ユーザーが法人その他の団体の場合にあっては、自らの役員または自らの経営に実質的に関与している者が暴力団員等と社会的に非難されるべき関係を有すること</Text>
                    <Text style={styles.sectionText}>
                        ユーザーは、自らまたは第三者を利用して次の各号のいずれか一にでも該当する行為を行わないことを保証するものとします。
                    </Text>
                    <Text style={styles.listItem}>・暴力的な要求行為</Text>
                    <Text style={styles.listItem}>・法的な責任を超えた不当な要求行為</Text>
                    <Text style={styles.listItem}>・取引に関して、脅迫的な言動をし、または暴力を用いる行為</Text>
                    <Text style={styles.listItem}>・風説を流布し、偽計を用い、または威力を用いて、当社の信用を毀損し、または当社の業務を妨害する行為</Text>
                    <Text style={styles.listItem}>・その他前各号に準ずる行為</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>利用制限</Text>
                    <Text style={styles.sectionText}>
                        当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。当社は、本条に基づき当社が行った行為によりユーザーに生じた損害について、一切の責任を負いません。
                    </Text>
                    <Text style={styles.listItem}>・本規約のいずれかの条項に違反した場合</Text>
                    <Text style={styles.listItem}>・登録事項に虚偽の事実があることが判明した場合</Text>
                    <Text style={styles.listItem}>・金銭債務の不履行があった場合</Text>
                    <Text style={styles.listItem}>・当社からの連絡に対し、相当の期間が経過しても返答がない場合</Text>
                    <Text style={styles.listItem}>・最終のご利用日から相当期間、本サービスのご利用がない場合</Text>
                    <Text style={styles.listItem}>・反社会的勢力等であるか、反社会的勢力等との何らかの交流若しくは関与を行っていると当社が判断した場合</Text>
                    <Text style={styles.listItem}>・その他、当社が本サービスの利用を適当でないと判断した場合</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>本サービスの提供の停止</Text>
                    <Text style={styles.sectionText}>
                        当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。当社は、この場合にユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
                    </Text>
                    <Text style={styles.listItem}>・本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</Text>
                    <Text style={styles.listItem}>・地震、落雷、火災、停電、天災またはウィルスの蔓延などの不可抗力により、本サービスの提供が困難となった場合</Text>
                    <Text style={styles.listItem}>・コンピュータまたは通信回線等が事故により停止した場合</Text>
                    <Text style={styles.listItem}>・その他、当社が本サービスの提供が困難と判断した場合</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>保証の否認</Text>
                    <Text style={styles.sectionText}>
                        当社は、本サービスや本サービスが提供するコンテンツに、システムバグや第三者の権利侵害が含まれないことを保証するものではありません。また、安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性を保証するものでもありません。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>免責</Text>
                    <Text style={styles.sectionText}>
                        当社は、本サービスに関してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。{"\n"}
                        消費者契約に該当する場合であっても、当社は、当社の過失（重過失を除きます。）によってユーザーに生じた損害のうち、ユーザーに直接かつ現実に発生した損害についてのみ賠償責任を負うものとし、また、その賠償額は、本サービスの利用料金の直近1ヶ月分または金1万円のいずれか低い方を上限とします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>サービス内容の変更</Text>
                    <Text style={styles.sectionText}>
                        当社は、ユーザーに通知することなく、本サービスの内容を変更したり、本サービスの提供を中止、終了することができるものとします。ユーザーは、本サービスが終了した場合、有料コンテンツを利用する一切の権利を失い、以後、当該有料コンテンツを利用できなくなることについて、あらかじめ、異議なく同意するものとします。当社は、これらによってユーザーに生じた損害について一切の責任を負いません。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>利用規約の変更</Text>
                    <Text style={styles.sectionText}>
                        当社は、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。変更後の本規約は、当社ウェブサイトに掲示された時点から効力を生じるものとします。本規約の変更後、本サービスの利用を継続したユーザーは、変更後の本規約に同意したものとみなします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>個人情報の取扱い</Text>
                    <Text style={styles.sectionText}>
                        本サービスの利用によって取得するユーザーの個人情報については、当社のプライバシーポリシーに従い適切に取り扱うものとします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>通知または連絡</Text>
                    <Text style={styles.sectionText}>
                        ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>権利義務の譲渡</Text>
                    <Text style={styles.sectionText}>
                        ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>事業譲渡</Text>
                    <Text style={styles.sectionText}>
                        当社は本サービスにかかる事業を他社に事業譲渡（事業譲渡、会社分割その他事業が移転するあらゆる場合を含みます。）した場合には、当該事業譲渡に伴い利用契約上の地位、本規約に基づく権利及び義務並びにユーザーの情報を当該事業譲渡の譲受人に譲渡することができるものとします。ユーザーは、かかる譲渡につき予め同意したものとみなします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>適用関係</Text>
                    <Text style={styles.sectionText}>
                        本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。{"\n"}
                        当社は本サービスに関し、本規約のほか、ご利用にあたってのルールを定めることがあります。これらのルールは、その名称のいかんに関わらず、本規約の一部を構成するものとします。本規約がこれらのルールと矛盾する場合には、これらのルールが優先して適用されるものとします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>分離可能性</Text>
                    <Text style={styles.sectionText}>
                        本規約のいずれかの条項又はその一部が無効又は執行不能と判断された場合であっても、当該判断は他の部分に影響を及ぼさず、本規約の残りの部分は、引き続き有効かつ執行力を有するものとします。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>準拠法・裁判管轄</Text>
                    <Text style={styles.sectionText}>
                        本規約の解釈にあたっては、日本法を準拠法とします。
                        本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する地方裁判所を専属的合意管轄とします。
                    </Text>
                </View>

                <View style={styles.section}>
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

});

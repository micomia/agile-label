// Colorsという色をまとめたtsxファイルを作成し、定数を定義してインポートしています。
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { router } from 'expo-router';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { Ionicons } from '@expo/vector-icons';
import { useDatasets, Dataset } from '../../../contexts/DatasetContext';

export default function Index() {
  const { datasets, deleteDataset } = useDatasets();

  const handleFabPress = () => {
    router.push('/create');
  };

  const handleDeleteDataset = (dataset: Dataset) => {
    Alert.alert(
      'データセットを削除',
      `「${dataset.name}」を削除しますか？この操作は取り消せません。`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteDataset(dataset.id),
        },
      ]
    );
  };

  const handleShareDataset = (dataset: Dataset) => {
    Alert.alert(
      'データセットを共有',
      `「${dataset.name}」を共有しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '共有',
          onPress: () => {
            // TODO: 実際の共有機能を実装
            Alert.alert('共有', 'データセットの共有機能は開発中です');
          },
        },
      ]
    );
  };

  const handleCardPress = (dataset: Dataset) => {
    router.push(`/dataset/${dataset.id}`);
  };

  // データセットカードをレンダリングする関数
  const renderDatasetCard = ({ item }: { item: Dataset }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleCardPress(item)}
      onLongPress={() => handleDeleteDataset(item)}
      delayLongPress={500}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleShareDataset(item);
          }}
          style={styles.shareButton}
        >
          <Ionicons name="share-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      {item.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <Ionicons name="image-outline" size={16} color={Colors.text + '60'} />
        <Text style={styles.imageCount}>{item.imageCount}枚</Text>
        <Ionicons name="pricetag-outline" size={16} color={Colors.text + '60'} style={styles.labelIcon} />
        <Text style={styles.labelCount}>{item.labelCount}クラス</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 固定ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>データセット</Text>
      </View>
      
      {/* メインコンテンツエリア */}
      <View style={styles.content}>
        {datasets.length === 0 ? (
          <Text style={styles.text}>データセットを作成しましょう</Text>
        ) : (
          <FlatList
            data={datasets}
            renderItem={renderDatasetCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Floating Action Button */}
      <FloatingActionButton onPress={handleFabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  text: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 100,
  },
  listContainer: {
    paddingBottom: 100, // FABとの重複を避ける
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareButton: {
    padding: 4,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.text + '80',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCount: {
    fontSize: 12,
    color: Colors.text + '60',
    marginLeft: 4,
  },
  labelIcon: {
    marginLeft: 12,
  },
  labelCount: {
    fontSize: 12,
    color: Colors.text + '60',
    marginLeft: 4,
  },
});

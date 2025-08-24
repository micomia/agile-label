import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useDatasets } from '../contexts/DatasetContext';

export default function CreateScreen() {
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [classNames, setClassNames] = useState('');
  const { addDataset } = useDatasets();

  const handleClose = () => {
    router.back();
  };

  const handleCreate = () => {
    if (!datasetName.trim()) {
      Alert.alert('エラー', 'データセット名を入力してください');
      return;
    }

    if (!datasetDescription.trim()) {
      Alert.alert('エラー', 'データセットの説明を入力してください');
      return;
    }

    if (!classNames.trim()) {
      Alert.alert('エラー', 'クラス名を入力してください');
      return;
    }

    // データセットを作成（クラス名も含めて）
    addDataset(datasetName.trim(), datasetDescription.trim(), classNames.trim());
    
    Alert.alert(
      '作成完了', 
      `データセット「${datasetName}」を作成しました！`, 
      [
        { 
          text: 'OK', 
          onPress: () => router.back() 
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>データセット作成</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        {/* データセット名入力 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>データセット名</Text>
          <TextInput
            style={styles.input}
            value={datasetName}
            onChangeText={setDatasetName}
            placeholder="birds_dataset"
            placeholderTextColor={Colors.text + '80'}
            maxLength={50}
          />
          <Text style={styles.characterCount}>{datasetName.length}/50</Text>
        </View>

        {/* データセット説明入力 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>データセットの説明</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={datasetDescription}
            onChangeText={setDatasetDescription}
            placeholder="複数の鳥の画像データセット"
            placeholderTextColor={Colors.text + '80'}
            multiline
            numberOfLines={4}
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{datasetDescription.length}/200</Text>
        </View>

        {/* クラス名入力 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>クラス名</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={classNames}
            onChangeText={setClassNames}
            placeholder="duck, swan, penguin&#10;（改行またはカンマ区切りで複数のクラスを入力）"
            placeholderTextColor={Colors.text + '80'}
            multiline
            numberOfLines={3}
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{classNames.length}/300</Text>
        </View>

        {/* 注意事項 */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.noteText}>
            クラス名入力は改行区切りにも対応しています。
          </Text>
        </View>
      </ScrollView>

      {/* 下部の作成ボタン */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleCreate} 
          style={[
            styles.createButton,
            (!datasetName.trim() || !datasetDescription.trim() || !classNames.trim()) && styles.createButtonDisabled
          ]}
          disabled={!datasetName.trim() || !datasetDescription.trim() || !classNames.trim()}
        >
          <Text style={[
            styles.createButtonText,
            (!datasetName.trim() || !datasetDescription.trim() || !classNames.trim()) && styles.createButtonTextDisabled
          ]}>
            作成
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40, // closeButtonと同じ幅でバランスを取る
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  createButtonDisabled: {
    backgroundColor: Colors.text + '30',
  },
  createButtonTextDisabled: {
    color: Colors.text + '60',
  },
  footer: {
    padding: 20,
    paddingBottom: 34, // セーフエリア対応
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // フッターの高さ分余白を追加
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text + '60',
    textAlign: 'right',
    marginTop: 4,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    marginTop: 12,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

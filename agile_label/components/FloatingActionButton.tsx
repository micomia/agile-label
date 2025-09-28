import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { FontStyles } from '../constants/FontStyles';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
  iconName?: keyof typeof AntDesign.glyphMap;
  iconLibrary?: 'AntDesign' | 'Ionicons';
  ioniconsName?: keyof typeof Ionicons.glyphMap;
  showText?: boolean;
  text?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  style,
  size = 56,
  backgroundColor = Colors.primary,
  iconColor = '#FFFFFF',
  iconSize = 24,
  iconName = 'plus',
  iconLibrary = 'AntDesign',
  ioniconsName,
  showText = false,
  text = 'camera',
}) => {
  const insets = useSafeAreaInsets();
  
  // タブバーの高さを正確に計算
  const tabBarHeight = Platform.OS === 'ios' ? 84 : 70 + insets.bottom; // 新しいAndroid高さに合わせる
  const bottomOffset = tabBarHeight + 20; // よりシンプルな計算でマージンを確保

  const renderIcon = () => {
    if (iconLibrary === 'Ionicons' && ioniconsName) {
      return <Ionicons name={ioniconsName} size={iconSize} color={iconColor} />;
    }
    return <AntDesign name={iconName} size={iconSize} color={iconColor} />;
  };

  return (
    <TouchableOpacity
      style={[
        showText ? styles.fabWithText : styles.fab,
        {
          backgroundColor,
          bottom: bottomOffset, // 動的に計算されたbottom値
          ...(showText ? {} : {
          width: size,
          height: size,
          borderRadius: size / 2,
          }),
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {showText ? (
        <View style={styles.fabContent}>
          {renderIcon()}
          <Text style={[styles.fabText, { color: iconColor }]}>{text}</Text>
        </View>
      ) : (
        renderIcon()
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  fabWithText: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
    minWidth: 120,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    marginLeft: 8,
    fontSize: 16,
    ...FontStyles.semiBold,
  },
});

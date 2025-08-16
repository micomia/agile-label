import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
  iconName?: keyof typeof AntDesign.glyphMap;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  style,
  size = 56,
  backgroundColor = Colors.primary,
  iconColor = '#FFFFFF',
  iconSize = 24,
  iconName = 'plus',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <AntDesign name={iconName} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
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
});

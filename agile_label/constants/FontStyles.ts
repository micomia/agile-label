import { Platform, TextStyle } from 'react-native';

export const FontStyles = {
  // ベースフォントファミリー
  fontFamily: Platform.select({
    ios: 'NotoSansJP',
    android: 'NotoSansJP',
    default: 'NotoSansJP',
  }),

  // 基本的なテキストスタイル
  regular: {
    fontFamily: Platform.select({
      ios: 'NotoSansJP',
      android: 'NotoSansJP',
      default: 'NotoSansJP',
    }),
    fontWeight: '400' as TextStyle['fontWeight'],
  },

  medium: {
    fontFamily: Platform.select({
      ios: 'NotoSansJP-Medium',
      android: 'NotoSansJP-Medium',
      default: 'NotoSansJP-Medium',
    }),
    fontWeight: '500' as TextStyle['fontWeight'],
  },

  semiBold: {
    fontFamily: Platform.select({
      ios: 'NotoSansJP-SemiBold',
      android: 'NotoSansJP-SemiBold',
      default: 'NotoSansJP-SemiBold',
    }),
    fontWeight: '600' as TextStyle['fontWeight'],
  },

  bold: {
    fontFamily: Platform.select({
      ios: 'NotoSansJP-Bold',
      android: 'NotoSansJP-Bold',
      default: 'NotoSansJP-Bold',
    }),
    fontWeight: '700' as TextStyle['fontWeight'],
  },
};

// Textコンポーネントのデフォルトプロパティを設定する関数
export const setGlobalFontFamily = () => {
  const { Text } = require('react-native');
  
  if (Text.defaultProps == null) {
    Text.defaultProps = {};
  }
  Text.defaultProps.style = {
    fontFamily: FontStyles.fontFamily,
    ...Text.defaultProps.style,
  };
};

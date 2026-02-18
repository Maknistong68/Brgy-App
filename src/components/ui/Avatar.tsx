import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType, ViewStyle } from 'react-native';
import { colors, fontSize, fontWeight } from '@/theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: ImageSourcePropType | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, { container: number; fontSize: number }> = {
  sm: { container: 32, fontSize: fontSize.sm },
  md: { container: 40, fontSize: fontSize.md },
  lg: { container: 56, fontSize: fontSize.xl },
  xl: { container: 80, fontSize: fontSize.xxl },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name?: string): string {
  if (!name) return colors.grey[400];
  const palettes = [
    colors.primary[500],
    colors.secondary[500],
    colors.success.main,
    colors.warning.main,
    colors.info.main,
    '#9C27B0',
    '#00BCD4',
    '#FF5722',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
}

export default function Avatar({ source, name, size = 'md', style }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const dimensions = sizeMap[size];
  const showImage = source && !imageError;

  const containerStyle: ViewStyle = {
    width: dimensions.container,
    height: dimensions.container,
    borderRadius: dimensions.container / 2,
    backgroundColor: getColorFromName(name),
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {showImage ? (
        <Image
          source={source}
          onError={() => setImageError(true)}
          style={{
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.container / 2,
          }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: dimensions.fontSize }]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
});

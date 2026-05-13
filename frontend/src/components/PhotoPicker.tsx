import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme, spacing, radius } from '../theme';

interface Props {
  value?: string | null;
  onChange: (base64: string | null) => void;
  size?: number;
  testID?: string;
}

export default function PhotoPicker({ value, onChange, size = 100, testID }: Props) {
  const [loading, setLoading] = useState(false);

  const pick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin diperlukan', 'Beri izin akses galeri foto');
        return;
      }
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        onChange(dataUri);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal memilih foto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      testID={testID || 'photo-picker'}
      onPress={pick}
      activeOpacity={0.7}
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : value ? (
        <>
          <Image source={{ uri: value }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color={theme.bg} />
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="camera" size={size * 0.3} color={theme.primary} />
          <Text style={styles.placeholderText}>UPLOAD</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  placeholderText: { color: theme.primary, fontSize: 9, letterSpacing: 1.5, fontWeight: '900', marginTop: 2 },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.bg,
  },
});

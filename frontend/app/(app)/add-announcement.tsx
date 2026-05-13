import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client';
import { theme, spacing, radius } from '../../src/theme';

export default function AddAnnouncement() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title || !content) {
      Alert.alert('Error', 'Judul dan isi pengumuman wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/announcements', { title, content });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} testID="ann-close"><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={styles.title}>PENGUMUMAN BARU</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>JUDUL</Text>
          <TextInput testID="ann-title" value={title} onChangeText={setTitle} placeholder="Judul pengumuman" placeholderTextColor={theme.textDim} style={styles.input} />

          <Text style={styles.label}>ISI</Text>
          <TextInput testID="ann-content" value={content} onChangeText={setContent} placeholder="Tulis pengumuman..." placeholderTextColor={theme.textDim} multiline style={[styles.input, { height: 160, paddingTop: 12, textAlignVertical: 'top' }]} />

          <TouchableOpacity testID="ann-submit" onPress={submit} disabled={loading} style={[styles.primaryBtn, loading && { opacity: 0.6 }]}>
            <Text style={styles.primaryText}>{loading ? 'MEMPUBLIKASIKAN...' : 'PUBLIKASIKAN'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { color: theme.text, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  label: { color: theme.textMuted, fontSize: 11, letterSpacing: 1.5, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, color: theme.text, paddingHorizontal: spacing.md, height: 52, fontSize: 15 },
  primaryBtn: { backgroundColor: theme.primary, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, borderRadius: radius.md },
  primaryText: { color: theme.bg, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});

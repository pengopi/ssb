import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client';
import { theme, spacing, radius } from '../../src/theme';

export default function AddMatch() {
  const router = useRouter();
  const [form, setForm] = useState({ opponent: '', date: '', location: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.opponent || !form.date || !form.location) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/matches', { ...form, status: 'upcoming' });
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
          <TouchableOpacity onPress={() => router.back()} testID="match-close"><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={styles.title}>PERTANDINGAN BARU</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>NAMA TIM LAWAN</Text>
          <TextInput testID="match-opp" value={form.opponent} onChangeText={(t) => setForm({ ...form, opponent: t })} placeholder="SSB Garuda" placeholderTextColor={theme.textDim} style={styles.input} />

          <Text style={styles.label}>TANGGAL (YYYY-MM-DD)</Text>
          <TextInput testID="match-date" value={form.date} onChangeText={(t) => setForm({ ...form, date: t })} placeholder="2026-04-10" placeholderTextColor={theme.textDim} style={styles.input} />

          <Text style={styles.label}>LOKASI</Text>
          <TextInput testID="match-loc" value={form.location} onChangeText={(t) => setForm({ ...form, location: t })} placeholder="Stadion Mini" placeholderTextColor={theme.textDim} style={styles.input} />

          <TouchableOpacity testID="match-submit" onPress={submit} disabled={loading} style={[styles.primaryBtn, loading && { opacity: 0.6 }]}>
            <Text style={styles.primaryText}>{loading ? 'MENYIMPAN...' : 'JADWALKAN'}</Text>
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

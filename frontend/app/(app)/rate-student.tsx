import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/api/client';
import { theme, spacing, radius } from '../../src/theme';

const DIMS = [
  { key: 'teknik', label: 'TEKNIK' },
  { key: 'fisik', label: 'FISIK' },
  { key: 'mental', label: 'MENTAL' },
  { key: 'taktik', label: 'TAKTIK' },
  { key: 'kerjasama', label: 'KERJASAMA' },
] as const;

export default function RateStudent() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, number>>({ teknik: 5, fisik: 5, mental: 5, taktik: 5, kerjasama: 5 });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/ratings', { student_id: studentId, ...vals, notes });
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
          <TouchableOpacity onPress={() => router.back()} testID="rate-close"><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={styles.title}>EVALUASI SKILL</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {DIMS.map((d) => (
            <View key={d.key} style={{ marginBottom: spacing.lg }}>
              <View style={styles.dimHead}>
                <Text style={styles.dimLabel}>{d.label}</Text>
                <Text style={styles.dimVal}>{vals[d.key]}/10</Text>
              </View>
              <View style={styles.bar}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    testID={`rate-${d.key}-${n}`}
                    onPress={() => setVals((v) => ({ ...v, [d.key]: n }))}
                    style={[styles.barSeg, n <= vals[d.key] && styles.barSegActive]}
                  />
                ))}
              </View>
            </View>
          ))}

          <Text style={styles.label}>CATATAN PELATIH (OPSIONAL)</Text>
          <TextInput
            testID="rate-notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Tulis catatan untuk siswa..."
            placeholderTextColor={theme.textDim}
            multiline
            style={styles.textarea}
          />

          <TouchableOpacity testID="rate-submit" onPress={submit} disabled={loading} style={[styles.primaryBtn, loading && { opacity: 0.6 }]}>
            <Text style={styles.primaryText}>{loading ? 'MENYIMPAN...' : 'SIMPAN EVALUASI'}</Text>
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
  dimHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  dimLabel: { color: theme.text, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  dimVal: { color: theme.primary, fontSize: 14, fontWeight: '900' },
  bar: { flexDirection: 'row', gap: 3 },
  barSeg: { flex: 1, height: 16, backgroundColor: theme.surface, borderRadius: 2 },
  barSegActive: { backgroundColor: theme.primary },
  label: { color: theme.textMuted, fontSize: 11, letterSpacing: 1.5, marginBottom: spacing.xs, marginTop: spacing.sm },
  textarea: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, color: theme.text, padding: spacing.md, borderRadius: radius.md, minHeight: 80, textAlignVertical: 'top', fontSize: 14 },
  primaryBtn: { backgroundColor: theme.primary, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, borderRadius: radius.md },
  primaryText: { color: theme.bg, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client';
import { theme, spacing, radius } from '../../src/theme';

export default function AddPermission() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [type, setType] = useState<'sick' | 'excused'>('sick');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, ss] = await Promise.all([
        api.get<any[]>('/students'),
        api.get<any[]>('/sessions'),
      ]);
      setStudents(s);
      setSessions(ss);
      if (s.length > 0) setStudentId(s[0].id);
      if (ss.length > 0) setSessionId(ss[0].id);
    })();
  }, []);

  const submit = async () => {
    if (!studentId || !sessionId || !reason) {
      Alert.alert('Error', 'Lengkapi semua field');
      return;
    }
    setLoading(true);
    try {
      await api.post('/permissions', { student_id: studentId, session_id: sessionId, type, reason });
      Alert.alert('Berhasil', 'Izin telah dikirim ke pelatih', [{ text: 'OK', onPress: () => router.back() }]);
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
          <TouchableOpacity onPress={() => router.back()} testID="perm-close"><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={styles.title}>AJUKAN IZIN</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>PILIH ANAK</Text>
          <View style={styles.row}>
            {students.map((s) => (
              <TouchableOpacity
                key={s.id}
                testID={`perm-student-${s.id}`}
                onPress={() => setStudentId(s.id)}
                style={[styles.chip, studentId === s.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, studentId === s.id && styles.chipTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>SESI LATIHAN</Text>
          {sessions.length === 0 ? (
            <Text style={styles.empty}>Tidak ada sesi terjadwal</Text>
          ) : (
            sessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                testID={`perm-session-${s.id}`}
                onPress={() => setSessionId(s.id)}
                style={[styles.sessRow, sessionId === s.id && styles.sessRowActive]}
              >
                <Ionicons name={sessionId === s.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={sessionId === s.id ? theme.primary : theme.textMuted} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text style={styles.sessTitle}>{s.title}</Text>
                  <Text style={styles.sessMeta}>{s.date} • {s.time} • {s.location}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.label}>JENIS IZIN</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity testID="type-sick" onPress={() => setType('sick')} style={[styles.typeBtn, type === 'sick' && { backgroundColor: theme.warning, borderColor: theme.warning }]}>
              <Ionicons name="medkit" size={18} color={type === 'sick' ? theme.bg : theme.warning} />
              <Text style={[styles.typeText, type === 'sick' && { color: theme.bg }]}>SAKIT</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="type-excused" onPress={() => setType('excused')} style={[styles.typeBtn, type === 'excused' && { backgroundColor: theme.secondary, borderColor: theme.secondary }]}>
              <Ionicons name="briefcase" size={18} color={type === 'excused' ? theme.bg : theme.secondary} />
              <Text style={[styles.typeText, type === 'excused' && { color: theme.bg }]}>IZIN</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>ALASAN</Text>
          <TextInput
            testID="perm-reason"
            value={reason}
            onChangeText={setReason}
            placeholder="Contoh: demam tinggi, ada acara keluarga..."
            placeholderTextColor={theme.textDim}
            multiline
            style={[styles.input, { height: 100, paddingTop: 12, textAlignVertical: 'top' }]}
          />

          <TouchableOpacity testID="perm-submit" onPress={submit} disabled={loading || !sessionId} style={[styles.primaryBtn, (loading || !sessionId) && { opacity: 0.6 }]}>
            <Text style={styles.primaryText}>{loading ? 'MENGIRIM...' : 'KIRIM IZIN'}</Text>
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
  input: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, color: theme.text, paddingHorizontal: spacing.md, fontSize: 15 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: theme.textMuted, fontWeight: '700' },
  chipTextActive: { color: theme.bg, fontWeight: '900' },
  sessRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, marginBottom: spacing.xs },
  sessRowActive: { borderColor: theme.primary },
  sessTitle: { color: theme.text, fontWeight: '700', fontSize: 14 },
  sessMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, backgroundColor: theme.card },
  typeText: { color: theme.text, fontWeight: '900', letterSpacing: 1 },
  primaryBtn: { backgroundColor: theme.primary, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, borderRadius: radius.md },
  primaryText: { color: theme.bg, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  empty: { color: theme.textMuted, fontStyle: 'italic', padding: spacing.md, textAlign: 'center' },
});

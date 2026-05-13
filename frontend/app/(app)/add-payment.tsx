import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client';
import { theme, spacing, radius } from '../../src/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function AddPayment() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [amount, setAmount] = useState<string>('150000');
  const [status, setStatus] = useState<'paid' | 'unpaid'>('paid');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<any[]>('/students').then((d) => {
      setStudents(d);
      if (d.length > 0) setStudentId(d[0].id);
    });
  }, []);

  const submit = async () => {
    if (!studentId || !amount) {
      Alert.alert('Error', 'Pilih siswa dan masukkan jumlah');
      return;
    }
    setLoading(true);
    try {
      await api.post('/payments', {
        student_id: studentId,
        month,
        year: parseInt(year),
        amount: parseFloat(amount),
        status,
      });
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
          <TouchableOpacity onPress={() => router.back()} testID="pay-close"><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={styles.title}>CATAT PEMBAYARAN</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>SISWA</Text>
          <View style={styles.studentList}>
            {students.map((s) => (
              <TouchableOpacity
                key={s.id}
                testID={`pay-student-${s.id}`}
                onPress={() => setStudentId(s.id)}
                style={[styles.studentChip, studentId === s.id && styles.studentChipActive]}
              >
                <Text style={[styles.studentText, studentId === s.id && styles.studentTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>BULAN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setMonth(i + 1)}
                  style={[styles.monthChip, month === i + 1 && styles.monthChipActive]}
                >
                  <Text style={[styles.monthText, month === i + 1 && styles.monthTextActive]}>{m.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>TAHUN</Text>
          <TextInput testID="pay-year" value={year} onChangeText={setYear} keyboardType="numeric" style={styles.input} placeholderTextColor={theme.textDim} />

          <Text style={styles.label}>JUMLAH (RP)</Text>
          <TextInput testID="pay-amount" value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="150000" placeholderTextColor={theme.textDim} style={styles.input} />

          <Text style={styles.label}>STATUS</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity testID="pay-paid" onPress={() => setStatus('paid')} style={[styles.statusBtn, status === 'paid' && { backgroundColor: theme.success, borderColor: theme.success }]}>
              <Text style={[styles.statusBtnText, status === 'paid' && { color: theme.bg }]}>LUNAS</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="pay-unpaid" onPress={() => setStatus('unpaid')} style={[styles.statusBtn, status === 'unpaid' && { backgroundColor: theme.danger, borderColor: theme.danger }]}>
              <Text style={[styles.statusBtnText, status === 'unpaid' && { color: theme.text }]}>BELUM</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="pay-submit" onPress={submit} disabled={loading} style={[styles.primaryBtn, loading && { opacity: 0.6 }]}>
            <Text style={styles.primaryText}>{loading ? 'MENYIMPAN...' : 'SIMPAN PEMBAYARAN'}</Text>
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
  studentList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  studentChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md },
  studentChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  studentText: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
  studentTextActive: { color: theme.bg, fontWeight: '800' },
  monthChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.pill },
  monthChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  monthText: { color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  monthTextActive: { color: theme.bg },
  statusBtn: { flex: 1, paddingVertical: 14, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, alignItems: 'center', backgroundColor: theme.card },
  statusBtnText: { color: theme.textMuted, fontWeight: '900', letterSpacing: 1 },
  primaryBtn: { backgroundColor: theme.primary, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, borderRadius: radius.md },
  primaryText: { color: theme.bg, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});

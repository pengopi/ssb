import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client';
import { theme, spacing, radius } from '../../src/theme';
import PhotoPicker from '../../src/components/PhotoPicker';

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

export default function AddStudent() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', dob: '', position: 'Midfielder', jersey_number: '', parent_email: '' });
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name || !form.dob) {
      Alert.alert('Error', 'Nama dan tanggal lahir harus diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/students', {
        name: form.name,
        dob: form.dob,
        position: form.position,
        jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
        parent_email: form.parent_email || null,
        photo: photo,
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
          <TouchableOpacity onPress={() => router.back()} testID="add-student-close"><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={styles.title}>TAMBAH SISWA</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <PhotoPicker value={photo} onChange={setPhoto} size={110} testID="student-photo" />
            <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1.5, marginTop: spacing.sm }}>FOTO SISWA (OPSIONAL)</Text>
          </View>
          <Text style={styles.label}>NAMA LENGKAP</Text>
          <TextInput testID="form-name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Nama" placeholderTextColor={theme.textDim} style={styles.input} />

          <Text style={styles.label}>TANGGAL LAHIR (YYYY-MM-DD)</Text>
          <TextInput testID="form-dob" value={form.dob} onChangeText={(t) => setForm({ ...form, dob: t })} placeholder="2012-03-15" placeholderTextColor={theme.textDim} style={styles.input} />

          <Text style={styles.label}>POSISI</Text>
          <View style={styles.posRow}>
            {POSITIONS.map((p) => (
              <TouchableOpacity
                key={p}
                testID={`pos-${p}`}
                onPress={() => setForm({ ...form, position: p })}
                style={[styles.posChip, form.position === p && styles.posChipActive]}
              >
                <Text style={[styles.posText, form.position === p && styles.posTextActive]}>{p.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>NO. PUNGGUNG</Text>
          <TextInput testID="form-jersey" value={form.jersey_number} onChangeText={(t) => setForm({ ...form, jersey_number: t.replace(/[^0-9]/g, '') })} placeholder="10" placeholderTextColor={theme.textDim} keyboardType="numeric" style={styles.input} />

          <Text style={styles.label}>EMAIL ORANGTUA (OPSIONAL)</Text>
          <TextInput testID="form-parent-email" value={form.parent_email} onChangeText={(t) => setForm({ ...form, parent_email: t })} placeholder="parent@email.com" placeholderTextColor={theme.textDim} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

          <TouchableOpacity testID="form-submit" onPress={submit} disabled={loading} style={[styles.primaryBtn, loading && { opacity: 0.6 }]}>
            <Text style={styles.primaryText}>{loading ? 'MENYIMPAN...' : 'TAMBAH SISWA'}</Text>
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
  posRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  posChip: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md },
  posChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  posText: { color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  posTextActive: { color: theme.bg },
  primaryBtn: { backgroundColor: theme.primary, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, borderRadius: radius.md },
  primaryText: { color: theme.bg, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});

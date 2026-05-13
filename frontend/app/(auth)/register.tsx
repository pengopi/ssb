import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, Role } from '../../src/context/AuthContext';
import { theme, spacing, radius } from '../../src/theme';

const ROLES: { value: Role; label: string }[] = [
  { value: 'parent', label: 'Orangtua' },
  { value: 'coach', label: 'Pelatih' },
];

export default function Register() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('parent');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Nama, email, password wajib diisi');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      await signUp({ name, email: email.trim().toLowerCase(), password, phone, role });
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Pendaftaran Gagal', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="register-back">
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={styles.title}>DAFTAR AKUN</Text>
          <Text style={styles.subtitle}>Gabung sebagai pelatih atau orangtua siswa</Text>

          <Text style={styles.label}>SAYA ADALAH</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                testID={`role-${r.value}`}
                onPress={() => setRole(r.value)}
                style={[styles.roleChip, role === r.value && styles.roleChipActive]}
              >
                <Text style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}>
                  {r.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>NAMA LENGKAP</Text>
          <TextInput testID="reg-name" value={name} onChangeText={setName} placeholder="Nama Lengkap" placeholderTextColor={theme.textDim} style={styles.input} />

          <Text style={styles.label}>EMAIL</Text>
          <TextInput testID="reg-email" value={email} onChangeText={setEmail} placeholder="nama@email.com" placeholderTextColor={theme.textDim} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

          <Text style={styles.label}>TELEPON (OPSIONAL)</Text>
          <TextInput testID="reg-phone" value={phone} onChangeText={setPhone} placeholder="081234567890" placeholderTextColor={theme.textDim} keyboardType="phone-pad" style={styles.input} />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput testID="reg-password" value={password} onChangeText={setPassword} placeholder="Min. 6 karakter" placeholderTextColor={theme.textDim} secureTextEntry style={styles.input} />

          <TouchableOpacity testID="register-submit" onPress={handle} disabled={loading} style={[styles.primaryBtn, loading && { opacity: 0.6 }]}>
            {loading ? <ActivityIndicator color={theme.bg} /> : <Text style={styles.primaryBtnText}>DAFTAR</Text>}
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.linkText}>Sudah punya akun? <Text style={{ color: theme.primary }}>MASUK</Text></Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.lg },
  title: { color: theme.text, fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: theme.textMuted, fontSize: 14, marginTop: spacing.xs, marginBottom: spacing.lg },
  label: { color: theme.textMuted, fontSize: 11, letterSpacing: 1.5, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, color: theme.text, paddingHorizontal: spacing.md, height: 52, fontSize: 15 },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  roleChip: { flex: 1, paddingVertical: spacing.md, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, alignItems: 'center', backgroundColor: theme.card },
  roleChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  roleChipText: { color: theme.textMuted, fontWeight: '700', letterSpacing: 1, fontSize: 13 },
  roleChipTextActive: { color: theme.bg },
  primaryBtn: { backgroundColor: theme.primary, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, borderRadius: radius.md },
  primaryBtnText: { color: theme.bg, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  linkBtn: { alignItems: 'center', marginTop: spacing.md },
  linkText: { color: theme.textMuted, fontSize: 13 },
});

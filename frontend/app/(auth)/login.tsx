import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { theme, spacing, radius } from '../../src/theme';

const DEMO = [
  { label: 'Admin', email: 'admin@ssb.id', password: 'admin123', color: theme.primary },
  { label: 'Pelatih', email: 'coach@ssb.id', password: 'coach123', color: theme.secondary },
  { label: 'Orangtua', email: 'parent@ssb.id', password: 'parent123', color: theme.warning },
];

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Login Gagal', e.message || 'Periksa kredensial Anda');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d: typeof DEMO[0]) => {
    setEmail(d.email);
    setPassword(d.password);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="football" size={40} color={theme.bg} />
            </View>
            <Text style={styles.brand}>SSB ACADEMY</Text>
            <Text style={styles.tag}>SEKOLAH SEPAK BOLA — TRAINING APP</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              testID="login-email"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              placeholderTextColor={theme.textDim}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>PASSWORD</Text>
            <TextInput
              testID="login-password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textDim}
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity
              testID="login-submit"
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator color={theme.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>MASUK</Text>
              )}
            </TouchableOpacity>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity testID="goto-register" style={styles.linkBtn}>
                <Text style={styles.linkText}>
                  Belum punya akun? <Text style={{ color: theme.primary }}>DAFTAR</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>DEMO ACCOUNTS — TAP TO FILL</Text>
            {DEMO.map((d) => (
              <TouchableOpacity
                key={d.email}
                testID={`demo-${d.label.toLowerCase()}`}
                onPress={() => fillDemo(d)}
                activeOpacity={0.7}
                style={styles.demoRow}
              >
                <View style={[styles.demoDot, { backgroundColor: d.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoLabel}>{d.label.toUpperCase()}</Text>
                  <Text style={styles.demoEmail}>{d.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brand: { color: theme.text, fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  tag: { color: theme.textMuted, fontSize: 11, letterSpacing: 2, marginTop: spacing.xs },
  form: { marginBottom: spacing.lg },
  label: { color: theme.textMuted, fontSize: 11, letterSpacing: 1.5, marginBottom: spacing.xs },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    color: theme.text,
    paddingHorizontal: spacing.md,
    height: 52,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: theme.primary,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    borderRadius: radius.md,
  },
  primaryBtnText: { color: theme.bg, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  linkBtn: { alignItems: 'center', marginTop: spacing.md },
  linkText: { color: theme.textMuted, fontSize: 13 },
  demoBox: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  demoTitle: { color: theme.textMuted, fontSize: 10, letterSpacing: 2, marginBottom: spacing.sm },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.surface,
  },
  demoDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  demoLabel: { color: theme.text, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  demoEmail: { color: theme.textMuted, fontSize: 12 },
});

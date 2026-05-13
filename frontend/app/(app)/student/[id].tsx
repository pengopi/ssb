import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { api } from '../../../src/api/client';
import { theme, spacing, radius } from '../../../src/theme';
import RadarChart from '../../../src/components/RadarChart';

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, r, p, a] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/ratings/student/${id}`),
        api.get(`/payments/student/${id}`),
        api.get(`/attendance/student/${id}`),
      ]);
      setStudent(s);
      setRatings(r);
      setPayments(p);
      setAttendance(a);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (!student) return null;

  const latest = ratings[0];
  const radarValues = latest
    ? [
        { label: 'Teknik', value: latest.teknik },
        { label: 'Fisik', value: latest.fisik },
        { label: 'Mental', value: latest.mental },
        { label: 'Taktik', value: latest.taktik },
        { label: 'Kerjasama', value: latest.kerjasama },
      ]
    : [
        { label: 'Teknik', value: 0 },
        { label: 'Fisik', value: 0 },
        { label: 'Mental', value: 0 },
        { label: 'Taktik', value: 0 },
        { label: 'Kerjasama', value: 0 },
      ];

  const presentCount = attendance.filter((x) => x.status === 'present').length;
  const attRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const canRate = user?.role === 'admin' || user?.role === 'coach';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="detail-back">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFIL SISWA</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>#{student.jersey_number ?? '-'}</Text>
          </View>
          <Text style={styles.name}>{student.name.toUpperCase()}</Text>
          <Text style={styles.position}>{student.position.toUpperCase()}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoVal}>{attRate}%</Text>
              <Text style={styles.infoLabel}>KEHADIRAN</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoVal}>{ratings.length}</Text>
              <Text style={styles.infoLabel}>EVALUASI</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoVal}>{student.dob.slice(0, 4)}</Text>
              <Text style={styles.infoLabel}>LAHIR</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.accent} />
          <Text style={styles.sectionTitle}>RATING SKILL</Text>
          {canRate && (
            <TouchableOpacity
              testID="rate-btn"
              onPress={() => router.push({ pathname: '/(app)/rate-student', params: { studentId: id } })}
              style={styles.smallBtn}
            >
              <Ionicons name="add" size={14} color={theme.bg} />
              <Text style={styles.smallBtnText}>EVALUASI</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chartCard}>
          <RadarChart values={radarValues} size={280} />
          {!latest && <Text style={styles.empty}>Belum ada evaluasi</Text>}
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.accent} />
          <Text style={styles.sectionTitle}>RIWAYAT SPP</Text>
        </View>
        {payments.length === 0 ? (
          <Text style={styles.empty}>Belum ada catatan pembayaran</Text>
        ) : (
          payments.slice(0, 6).map((p) => (
            <View key={p.id} style={styles.paymentRow}>
              <View style={[styles.dot, { backgroundColor: p.status === 'paid' ? theme.success : theme.danger }]} />
              <Text style={styles.payMonth}>BULAN {p.month}/{p.year}</Text>
              <Text style={[styles.payStatus, { color: p.status === 'paid' ? theme.success : theme.danger }]}>
                {p.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
              </Text>
            </View>
          ))
        )}

        {latest?.notes && (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.accent} />
              <Text style={styles.sectionTitle}>CATATAN PELATIH</Text>
            </View>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{latest.notes}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  headerTitle: { color: theme.text, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  profileCard: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.primary },
  avatarText: { color: theme.primary, fontSize: 24, fontWeight: '900' },
  name: { color: theme.text, fontSize: 22, fontWeight: '900', marginTop: spacing.md, letterSpacing: 1 },
  position: { color: theme.primary, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  infoRow: { flexDirection: 'row', marginTop: spacing.lg, width: '100%', justifyContent: 'space-around' },
  infoItem: { alignItems: 'center' },
  infoVal: { color: theme.text, fontSize: 20, fontWeight: '900' },
  infoLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 2, marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  accent: { width: 4, height: 18, backgroundColor: theme.primary, marginRight: spacing.sm },
  sectionTitle: { color: theme.text, fontSize: 14, fontWeight: '900', letterSpacing: 2, flex: 1 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  smallBtnText: { color: theme.bg, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginLeft: 4 },
  chartCard: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  empty: { color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', padding: spacing.md },
  paymentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: spacing.md, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, marginBottom: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  payMonth: { flex: 1, color: theme.text, fontWeight: '700', letterSpacing: 1, fontSize: 12 },
  payStatus: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  noteCard: { backgroundColor: theme.card, padding: spacing.md, borderRadius: radius.lg, borderLeftWidth: 3, borderLeftColor: theme.primary },
  noteText: { color: theme.text, fontSize: 13, lineHeight: 19 },
});

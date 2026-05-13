import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { api } from '../../../src/api/client';
import { theme, spacing, radius } from '../../../src/theme';

interface Stats {
  total_students: number;
  total_sessions: number;
  upcoming_matches: number;
  unpaid_payments: number;
}

export default function Home() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, a, m] = await Promise.all([
        api.get<Stats>('/stats'),
        api.get<any[]>('/announcements'),
        api.get<any[]>('/matches'),
      ]);
      setStats(s);
      setAnnouncements(a.slice(0, 3));
      setMatches(m.filter((x) => x.status === 'upcoming').slice(0, 2));
    } catch (e) {
      console.log('load error', e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const roleLabel: Record<string, string> = { admin: 'ADMINISTRATOR', coach: 'PELATIH', parent: 'ORANGTUA' };
  const roleColor: Record<string, string> = { admin: theme.primary, coach: theme.secondary, parent: theme.warning };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>HALO,</Text>
            <Text style={styles.name} testID="home-username">{user?.name}</Text>
            <View style={[styles.roleBadge, { borderColor: roleColor[user?.role || 'parent'] }]}>
              <View style={[styles.roleDot, { backgroundColor: roleColor[user?.role || 'parent'] }]} />
              <Text style={styles.roleText}>{roleLabel[user?.role || 'parent']}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={signOut} testID="logout-btn" style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="people" label="SISWA" value={stats?.total_students ?? '-'} color={theme.primary} />
          <StatCard icon="calendar" label="LATIHAN" value={stats?.total_sessions ?? '-'} color={theme.secondary} />
          <StatCard icon="trophy" label="MATCH" value={stats?.upcoming_matches ?? '-'} color={theme.warning} />
          <StatCard icon="alert-circle" label="SPP BLM" value={stats?.unpaid_payments ?? '-'} color={theme.danger} />
        </View>

        <SectionHeader title="PERTANDINGAN MENDATANG" />
        {matches.length === 0 ? (
          <Text style={styles.empty}>Belum ada pertandingan terjadwal</Text>
        ) : (
          matches.map((m) => (
            <View key={m.id} style={styles.matchCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchVs}>SSB ACADEMY  ✕  {m.opponent.toUpperCase()}</Text>
                <Text style={styles.matchMeta}>{m.date} • {m.location}</Text>
              </View>
              <Ionicons name="football" size={22} color={theme.primary} />
            </View>
          ))
        )}

        <SectionHeader title="PENGUMUMAN TERBARU" />
        {announcements.length === 0 ? (
          <Text style={styles.empty}>Belum ada pengumuman</Text>
        ) : (
          announcements.map((a) => (
            <TouchableOpacity key={a.id} style={styles.annCard} onPress={() => router.push('/(app)/(tabs)/more')}>
              <Text style={styles.annTitle}>{a.title}</Text>
              <Text style={styles.annBody} numberOfLines={2}>{a.content}</Text>
              <Text style={styles.annMeta}>{new Date(a.created_at).toLocaleDateString('id-ID')} • {a.created_by_name}</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.accent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greet: { color: theme.textMuted, fontSize: 12, letterSpacing: 2 },
  name: { color: theme.text, fontSize: 26, fontWeight: '900', marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'flex-start' },
  roleDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  roleText: { color: theme.text, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, minWidth: '47%', backgroundColor: theme.card, borderWidth: 1, padding: spacing.md, borderRadius: radius.lg },
  statValue: { color: theme.text, fontSize: 28, fontWeight: '900', marginTop: spacing.sm },
  statLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 2, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  accent: { width: 4, height: 18, backgroundColor: theme.primary, marginRight: spacing.sm },
  sectionTitle: { color: theme.text, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  matchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm },
  matchVs: { color: theme.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  matchMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  annCard: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm },
  annTitle: { color: theme.text, fontSize: 15, fontWeight: '800' },
  annBody: { color: theme.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  annMeta: { color: theme.textDim, fontSize: 11, marginTop: 6 },
  empty: { color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.md },
});

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { api } from '../../../src/api/client';
import { theme, spacing, radius } from '../../../src/theme';

export default function More() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'ann' | 'matches'>('ann');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([
        api.get<any[]>('/announcements'),
        api.get<any[]>('/matches'),
      ]);
      setAnnouncements(a);
      setMatches(m);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const canEdit = user?.role === 'admin' || user?.role === 'coach';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>LAINNYA</Text>
        <TouchableOpacity onPress={signOut} style={styles.iconBtn} testID="more-logout">
          <Ionicons name="log-out-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity testID="tab-announcements" onPress={() => setTab('ann')} style={[styles.tab, tab === 'ann' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'ann' && styles.tabTextActive]}>PENGUMUMAN</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tab-matches" onPress={() => setTab('matches')} style={[styles.tab, tab === 'matches' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'matches' && styles.tabTextActive]}>PERTANDINGAN</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.primary} />}
      >
        {tab === 'ann' && (
          <>
            {canEdit && (
              <TouchableOpacity testID="add-ann-btn" onPress={() => router.push('/(app)/add-announcement')} style={styles.addRow}>
                <Ionicons name="add-circle" size={20} color={theme.primary} />
                <Text style={styles.addText}>BUAT PENGUMUMAN</Text>
              </TouchableOpacity>
            )}
            {announcements.length === 0 ? (
              <Text style={styles.empty}>Belum ada pengumuman</Text>
            ) : (
              announcements.map((a) => (
                <View key={a.id} style={styles.card}>
                  <Text style={styles.annTitle}>{a.title}</Text>
                  <Text style={styles.annBody}>{a.content}</Text>
                  <Text style={styles.annMeta}>{new Date(a.created_at).toLocaleDateString('id-ID')} • {a.created_by_name}</Text>
                </View>
              ))
            )}
          </>
        )}

        {tab === 'matches' && (
          <>
            {canEdit && (
              <TouchableOpacity testID="add-match-btn" onPress={() => router.push('/(app)/add-match')} style={styles.addRow}>
                <Ionicons name="add-circle" size={20} color={theme.primary} />
                <Text style={styles.addText}>JADWALKAN PERTANDINGAN</Text>
              </TouchableOpacity>
            )}
            {matches.length === 0 ? (
              <Text style={styles.empty}>Belum ada pertandingan</Text>
            ) : (
              matches.map((m) => (
                <View key={m.id} style={styles.card}>
                  <View style={styles.matchRow}>
                    <Text style={styles.matchTeam}>SSB ACADEMY</Text>
                    {m.status === 'finished' ? (
                      <Text style={styles.matchScore}>{m.our_score} - {m.opponent_score}</Text>
                    ) : (
                      <Text style={styles.matchVs}>VS</Text>
                    )}
                    <Text style={styles.matchTeam} numberOfLines={1}>{m.opponent.toUpperCase()}</Text>
                  </View>
                  <View style={styles.matchMeta}>
                    <Text style={styles.metaText}><Ionicons name="calendar-outline" size={12} /> {m.date}</Text>
                    <Text style={styles.metaText}><Ionicons name="location-outline" size={12} /> {m.location}</Text>
                  </View>
                  <View style={[styles.matchBadge, { backgroundColor: m.status === 'upcoming' ? theme.warning : theme.success }]}>
                    <Text style={styles.matchBadgeText}>{m.status === 'upcoming' ? 'MENDATANG' : 'SELESAI'}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: theme.text, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: theme.border, alignItems: 'center' },
  tabActive: { borderBottomColor: theme.primary },
  tabText: { color: theme.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  tabTextActive: { color: theme.primary },
  addRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.primary, borderRadius: radius.lg, marginBottom: spacing.md },
  addText: { color: theme.primary, marginLeft: spacing.sm, fontWeight: '800', letterSpacing: 1 },
  card: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm },
  annTitle: { color: theme.text, fontSize: 16, fontWeight: '800' },
  annBody: { color: theme.textMuted, fontSize: 13, marginTop: spacing.xs, lineHeight: 19 },
  annMeta: { color: theme.textDim, fontSize: 11, marginTop: spacing.sm },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeam: { color: theme.text, fontSize: 13, fontWeight: '800', flex: 1, textAlign: 'center' },
  matchScore: { color: theme.primary, fontSize: 24, fontWeight: '900', paddingHorizontal: spacing.md },
  matchVs: { color: theme.textMuted, fontSize: 14, fontWeight: '700', paddingHorizontal: spacing.md },
  matchMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  metaText: { color: theme.textMuted, fontSize: 11 },
  matchBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, marginTop: spacing.sm },
  matchBadgeText: { color: theme.bg, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  empty: { color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xl },
});

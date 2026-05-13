import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { api } from '../../../src/api/client';
import { theme, spacing, radius } from '../../../src/theme';

export default function Schedule() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/sessions');
      setSessions(data);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const canEdit = user?.role === 'admin' || user?.role === 'coach';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>JADWAL LATIHAN</Text>
        {canEdit && (
          <TouchableOpacity testID="add-session-btn" onPress={() => router.push('/(app)/add-session')} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={theme.bg} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada jadwal latihan</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`session-${item.id}`}
            onPress={() => canEdit ? router.push(`/(app)/attendance/${item.id}`) : null}
            style={styles.card}
            activeOpacity={canEdit ? 0.7 : 1}
          >
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
              <Text style={styles.dateMonth}>{new Date(item.date).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}><Ionicons name="time-outline" size={12} /> {item.time} • <Ionicons name="location-outline" size={12} /> {item.location}</Text>
              {item.notes ? <Text style={styles.cardNote}>{item.notes}</Text> : null}
            </View>
            {canEdit && <Ionicons name="checkbox-outline" size={20} color={theme.primary} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: theme.text, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg },
  dateBox: { width: 56, alignItems: 'center', marginRight: spacing.md, borderRightWidth: 1, borderRightColor: theme.surface, paddingRight: spacing.md },
  dateDay: { color: theme.primary, fontSize: 24, fontWeight: '900' },
  dateMonth: { color: theme.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: '800' },
  cardMeta: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  cardNote: { color: theme.textDim, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  empty: { color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xl },
});

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../src/api/client';
import { theme, spacing, radius } from '../../../src/theme';
import { exportAttendanceReport } from '../../../src/utils/pdf';

type Status = 'present' | 'absent' | 'sick';

export default function Attendance() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, all, existing] = await Promise.all([
          api.get<any[]>('/sessions'),
          api.get<any[]>('/students'),
          api.get<any[]>(`/attendance/session/${sessionId}`),
        ]);
        setSession(s.find((x) => x.id === sessionId));
        setStudents(all);
        const map: Record<string, Status> = {};
        existing.forEach((e: any) => { map[e.student_id] = e.status; });
        setStatuses(map);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const mark = async (sid: string, st: Status) => {
    setSaving(sid);
    setStatuses((prev) => ({ ...prev, [sid]: st }));
    try {
      await api.post('/attendance', { session_id: sessionId, student_id: sid, status: st });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const total = students.length;
  const present = Object.values(statuses).filter((s) => s === 'present').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="att-back"><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
        <Text style={styles.title}>ABSENSI</Text>
        <TouchableOpacity testID="export-att" onPress={() => session && exportAttendanceReport(session, students, Object.keys(statuses).map((sid) => ({ student_id: sid, status: statuses[sid] })))}>
          <Ionicons name="document-text-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {session && (
        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionMeta}>{session.date} • {session.time} • {session.location}</Text>
          <Text style={styles.stat}>{present}/{total} HADIR</Text>
        </View>
      )}

      <FlatList
        data={students}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const s = statuses[item.id];
          return (
            <View style={styles.row}>
              <View style={styles.avatar}><Text style={styles.avatarText}>#{item.jersey_number ?? '-'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.pos}>{item.position.toUpperCase()}</Text>
              </View>
              <View style={styles.actions}>
                <StatusBtn
                  active={s === 'present'}
                  color={theme.success}
                  label="H"
                  onPress={() => mark(item.id, 'present')}
                  testID={`att-present-${item.id}`}
                  disabled={saving === item.id}
                />
                <StatusBtn
                  active={s === 'sick'}
                  color={theme.warning}
                  label="S"
                  onPress={() => mark(item.id, 'sick')}
                  testID={`att-sick-${item.id}`}
                  disabled={saving === item.id}
                />
                <StatusBtn
                  active={s === 'absent'}
                  color={theme.danger}
                  label="A"
                  onPress={() => mark(item.id, 'absent')}
                  testID={`att-absent-${item.id}`}
                  disabled={saving === item.id}
                />
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function StatusBtn({ active, color, label, onPress, testID, disabled }: any) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={[styles.statBtn, { borderColor: active ? color : theme.border, backgroundColor: active ? color : 'transparent' }]}
    >
      <Text style={[styles.statBtnText, { color: active ? theme.bg : color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { color: theme.text, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  sessionCard: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, marginHorizontal: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.sm },
  sessionTitle: { color: theme.text, fontSize: 16, fontWeight: '800' },
  sessionMeta: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  stat: { color: theme.primary, fontSize: 13, fontWeight: '900', marginTop: spacing.sm, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: theme.primary },
  avatarText: { color: theme.primary, fontWeight: '900', fontSize: 12 },
  name: { color: theme.text, fontSize: 14, fontWeight: '700' },
  pos: { color: theme.textMuted, fontSize: 11, letterSpacing: 1, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  statBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statBtnText: { fontWeight: '900', fontSize: 14 },
});

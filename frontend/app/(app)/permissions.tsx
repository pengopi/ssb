import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/api/client';
import { theme, spacing, radius } from '../../src/theme';

const TYPE_COLOR: Record<string, string> = { sick: theme.warning, excused: theme.secondary };
const STATUS_COLOR: Record<string, string> = { pending: theme.warning, approved: theme.success, rejected: theme.danger };

export default function Permissions() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/permissions');
      setItems(data);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const approve = async (pid: string) => {
    try {
      await api.post(`/permissions/${pid}/approve`);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const isParent = user?.role === 'parent';
  const canApprove = user?.role === 'admin' || user?.role === 'coach';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="perm-back">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>IZIN ABSEN</Text>
        {isParent ? (
          <TouchableOpacity testID="perm-add" onPress={() => router.push('/(app)/add-permission')}>
            <Ionicons name="add-circle" size={26} color={theme.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 26 }} />}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
            <Ionicons name="document-text-outline" size={48} color={theme.textDim} />
            <Text style={styles.empty}>Belum ada pengajuan izin</Text>
            {isParent && (
              <TouchableOpacity onPress={() => router.push('/(app)/add-permission')} style={styles.firstBtn}>
                <Text style={styles.firstBtnText}>AJUKAN IZIN</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={[styles.typePill, { backgroundColor: TYPE_COLOR[item.type] }]}>
                <Text style={styles.typePillText}>{item.type === 'sick' ? 'SAKIT' : 'IZIN'}</Text>
              </View>
              <View style={[styles.statusPill, { borderColor: STATUS_COLOR[item.status] }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
                <Text style={[styles.statusPillText, { color: STATUS_COLOR[item.status] }]}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.studentName}>{item.student_name}</Text>
            <Text style={styles.reason}>{'"'}{item.reason}{'"'}</Text>
            <Text style={styles.submittedBy}>Diajukan oleh {item.submitted_by_name} • {new Date(item.created_at).toLocaleDateString('id-ID')}</Text>
            {canApprove && item.status === 'pending' && (
              <TouchableOpacity testID={`approve-${item.id}`} onPress={() => approve(item.id)} style={styles.approveBtn}>
                <Ionicons name="checkmark" size={16} color={theme.bg} />
                <Text style={styles.approveText}>SETUJUI</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { color: theme.text, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  card: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  typePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  typePillText: { color: theme.bg, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  studentName: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  reason: { color: theme.textMuted, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  submittedBy: { color: theme.textDim, fontSize: 11, marginTop: spacing.sm },
  approveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, paddingVertical: spacing.sm, borderRadius: radius.md, marginTop: spacing.sm, gap: 4 },
  approveText: { color: theme.bg, fontWeight: '900', letterSpacing: 1.5, fontSize: 12 },
  empty: { color: theme.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.md },
  firstBtn: { marginTop: spacing.lg, backgroundColor: theme.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md },
  firstBtnText: { color: theme.bg, fontWeight: '900', letterSpacing: 2 },
});

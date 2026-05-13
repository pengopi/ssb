import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { api } from '../../../src/api/client';
import { theme, spacing, radius } from '../../../src/theme';

const MONTHS = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];

export default function Payments() {
  const { user } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        api.get<any[]>('/payments'),
        api.get<any[]>('/students'),
      ]);
      setPayments(p);
      setStudents(s);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const canEdit = user?.role === 'admin' || user?.role === 'coach';
  const studentName = (id: string) => students.find((s) => s.id === id)?.name || '-';

  const paid = payments.filter((p) => p.status === 'paid').length;
  const unpaid = payments.filter((p) => p.status === 'unpaid').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>PEMBAYARAN SPP</Text>
        {canEdit && (
          <TouchableOpacity testID="add-payment-btn" onPress={() => router.push('/(app)/add-payment')} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={theme.bg} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.summary}>
        <View style={[styles.sumCard, { borderColor: theme.success + '40' }]}>
          <Text style={styles.sumValue}>{paid}</Text>
          <Text style={styles.sumLabel}>LUNAS</Text>
        </View>
        <View style={[styles.sumCard, { borderColor: theme.danger + '40' }]}>
          <Text style={[styles.sumValue, { color: theme.danger }]}>{unpaid}</Text>
          <Text style={styles.sumLabel}>BELUM LUNAS</Text>
        </View>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.primary} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada catatan pembayaran</Text>}
        renderItem={({ item }) => {
          const isPaid = item.status === 'paid';
          return (
            <View style={[styles.card, { borderLeftColor: isPaid ? theme.success : theme.danger, borderLeftWidth: 4 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{studentName(item.student_id)}</Text>
                <Text style={styles.cardMeta}>{MONTHS[item.month - 1]} {item.year} • Rp {item.amount.toLocaleString('id-ID')}</Text>
                {item.paid_date && <Text style={styles.paidDate}>Dibayar: {new Date(item.paid_date).toLocaleDateString('id-ID')}</Text>}
              </View>
              <View style={[styles.statusPill, { backgroundColor: isPaid ? theme.success : theme.danger }]}>
                <Text style={styles.statusText}>{isPaid ? 'LUNAS' : 'BELUM'}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: theme.text, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  sumCard: { flex: 1, backgroundColor: theme.card, borderWidth: 1, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center' },
  sumValue: { color: theme.success, fontSize: 28, fontWeight: '900' },
  sumLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 2, marginTop: 4, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg },
  cardName: { color: theme.text, fontSize: 14, fontWeight: '700' },
  cardMeta: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  paidDate: { color: theme.success, fontSize: 11, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { color: theme.bg, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  empty: { color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xl },
});

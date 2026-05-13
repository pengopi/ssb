import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../src/api/client';
import { theme, spacing, radius } from '../../src/theme';

const ICONS: Record<string, any> = {
  attendance: 'checkmark-circle',
  payment: 'card',
  permission: 'document-text',
  announcement: 'megaphone',
  general: 'notifications',
};
const COLORS: Record<string, string> = {
  attendance: theme.secondary,
  payment: theme.warning,
  permission: theme.primary,
  announcement: theme.success,
  general: theme.textMuted,
};

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/notifications');
      setItems(data);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markAll = async () => {
    await api.post('/notifications/read-all');
    load();
  };

  const tapItem = async (n: any) => {
    if (!n.read) {
      await api.post(`/notifications/${n.id}/read`);
    }
    if (n.link) {
      router.push(n.link);
    } else {
      load();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="notif-back">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>NOTIFIKASI</Text>
        <TouchableOpacity onPress={markAll} testID="notif-readall">
          <Text style={styles.readAll}>BACA SEMUA</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada notifikasi</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => tapItem(item)} style={[styles.row, !item.read && styles.unread]} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: COLORS[item.kind] + '20' }]}>
              <Ionicons name={ICONS[item.kind] || 'notifications'} size={20} color={COLORS[item.kind] || theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString('id-ID')}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { color: theme.text, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  readAll: { color: theme.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg },
  unread: { borderColor: theme.primary + '60', backgroundColor: theme.surfaceAlt },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  notifTitle: { color: theme.text, fontSize: 14, fontWeight: '800' },
  notifBody: { color: theme.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  notifTime: { color: theme.textDim, fontSize: 10, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, marginLeft: spacing.sm },
  empty: { color: theme.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.xl },
});

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { api } from '../../../src/api/client';
import { theme, spacing, radius } from '../../../src/theme';

interface Student {
  id: string;
  name: string;
  dob: string;
  position: string;
  jersey_number?: number;
  parent_id?: string;
  photo?: string;
}

export default function Students() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Student[]>('/students');
      setStudents(data);
    } catch (e) {
      console.log(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.position.toLowerCase().includes(search.toLowerCase()));
  const canEdit = user?.role === 'admin' || user?.role === 'coach';

  const calcAge = (dob: string) => {
    try {
      const d = new Date(dob);
      const ms = Date.now() - d.getTime();
      return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
    } catch { return '-'; }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>SISWA</Text>
        {canEdit && (
          <TouchableOpacity testID="add-student-btn" onPress={() => router.push('/(app)/add-student')} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={theme.bg} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          testID="student-search"
          value={search}
          onChangeText={setSearch}
          placeholder="Cari nama atau posisi..."
          placeholderTextColor={theme.textDim}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada siswa terdaftar</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`student-${item.id}`}
            onPress={() => router.push(`/(app)/student/${item.id}`)}
            style={styles.card}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>#{item.jersey_number ?? '-'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardSub}>{item.position.toUpperCase()} • USIA {calcAge(item.dob)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: 0 },
  title: { color: theme.text, fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, paddingHorizontal: spacing.md, borderRadius: radius.md, height: 48 },
  searchInput: { flex: 1, color: theme.text, marginLeft: spacing.sm, fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, padding: spacing.md, borderRadius: radius.lg },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: theme.primary, overflow: 'hidden' },
  avatarImg: { width: 48, height: 48, resizeMode: 'cover' },
  avatarText: { color: theme.primary, fontWeight: '900', fontSize: 14 },
  cardName: { color: theme.text, fontSize: 15, fontWeight: '700' },
  cardSub: { color: theme.textMuted, fontSize: 12, marginTop: 2, letterSpacing: 0.5 },
  empty: { color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xl },
});

import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/customers`, { params: { limit: 50, search: search || undefined } });
      setCustomers(res.data.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [search]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <Text style={styles.subtitle}>{customers.length} total</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor={Colors.text3}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {customers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
            <Text style={styles.emptyTitle}>No customers</Text>
            <Text style={styles.emptySub}>Add customers from the web app</Text>
          </View>
        ) : (
          customers.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(c.name)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.email}>{c.email || 'No email'}</Text>
                {c.phone && <Text style={styles.phone}>{c.phone}</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text2, marginTop: 2 },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { backgroundColor: Colors.surface2, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 42, fontSize: 14, color: Colors.text, borderWidth: 1.5, borderColor: Colors.border },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: Colors.primary, fontSize: 15 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  email: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  phone: { fontSize: 12, color: Colors.text3, marginTop: 1 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
});

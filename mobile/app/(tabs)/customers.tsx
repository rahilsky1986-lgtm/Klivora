import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { getErrorMessage, getWithRetry } from '../../lib/api';

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

type Filter = 'all' | 'with_email' | 'with_phone';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = async () => {
    const requestId = ++requestRef.current;
    try {
      setError(null);
      setLoading(true);
      const res = await getWithRetry<{ data: any[] }>('/customers', { params: { limit: 50, search: query || undefined } });
      const rows = (res.data.data || []) as any[];
      const filtered = rows.filter((row) => {
        if (filter === 'with_email') return Boolean(row.email);
        if (filter === 'with_phone') return Boolean(row.phone);
        return true;
      });
      if (requestId === requestRef.current) {
        setCustomers(filtered);
      }
    } catch (err) {
      if (requestId === requestRef.current) {
        setError(getErrorMessage(err, 'Could not load customers.'));
      }
    }
    finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { load(); }, [query, filter]);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

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
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterChipActive]} onPress={() => setFilter('all')}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filter === 'with_email' && styles.filterChipActive]} onPress={() => setFilter('with_email')}>
            <Text style={[styles.filterText, filter === 'with_email' && styles.filterTextActive]}>With email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filter === 'with_phone' && styles.filterChipActive]} onPress={() => setFilter('with_phone')}>
            <Text style={[styles.filterText, filter === 'with_phone' && styles.filterTextActive]}>With phone</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.errorRetry}>
              <Text style={styles.errorRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptySub}>Loading customers...</Text>
          </View>
        ) : customers.length === 0 ? (
          <View style={styles.empty}>
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
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  filterText: { fontSize: 12, color: Colors.text2, fontWeight: '600' },
  filterTextActive: { color: Colors.primary },
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
  errorBox: { backgroundColor: '#FFECEE', borderColor: '#FFD3D8', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  errorRetry: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  errorRetryText: { color: 'white', fontSize: 12, fontWeight: '700' },
});

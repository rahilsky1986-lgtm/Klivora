import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { getErrorMessage, getWithRetry, createCustomer, updateCustomer, deleteCustomer, getCustomer } from '../../lib/api';
import { getInitials } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import CustomerForm from '../../components/forms/CustomerForm';

type Filter = 'all' | 'with_email' | 'with_phone';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete customer?', 'Their invoices will remain.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteCustomer(id);
          load();
        } catch { Alert.alert('Error', 'Failed to delete customer'); }
      }},
    ]);
  };

  const handleSave = () => {
    setFormOpen(false);
    setEditingId(null);
    load();
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
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.emptySub}>Loading customers...</Text>
          </View>
        ) : customers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No customers</Text>
            <Text style={styles.emptySub}>Tap + to add your first customer</Text>
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
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEdit(c.id)} style={styles.actionBtnOutline}>
                  <Text style={styles.actionTextOutline}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(c.id)} style={[styles.actionBtnOutline, styles.actionBtnDanger]}>
                  <Text style={[styles.actionTextOutline, { color: Colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity onPress={openCreate} style={styles.fab} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Customer Form Modal */}
      <CustomerForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingId(null); }}
        onSave={handleSave}
        customerId={editingId}
      />
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
  content: { padding: Spacing.lg, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: Colors.primary, fontSize: 15 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  email: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  phone: { fontSize: 12, color: Colors.text3, marginTop: 1 },
  cardActions: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  actionBtnOutline: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.border },
  actionBtnDanger: { borderColor: Colors.danger },
  actionTextOutline: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
  errorBox: { backgroundColor: '#FFECEE', borderColor: '#FFD3D8', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  errorRetry: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  errorRetryText: { color: 'white', fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },
  fabText: { fontSize: 28, color: 'white', fontWeight: '700', lineHeight: 28 },
});

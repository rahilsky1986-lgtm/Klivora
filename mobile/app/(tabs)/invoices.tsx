import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const fmt = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

const statusColor: Record<string, string> = {
  paid: Colors.accent, overdue: Colors.danger, sent: Colors.primary, draft: Colors.text3, viewed: Colors.primary, cancelled: Colors.text3,
};

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await axios.get(`${API}/invoices`, { params });
      setInvoices(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [filter]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const FILTERS = ['all', 'draft', 'sent', 'paid', 'overdue'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {invoices.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📄</Text>
            <Text style={styles.emptyTitle}>No invoices</Text>
            <Text style={styles.emptySub}>Create invoices from the web app</Text>
          </View>
        ) : (
          invoices.map((inv) => (
            <View key={inv.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.invNumber}>{inv.invoice_number}</Text>
                <View style={[styles.badge, { backgroundColor: (statusColor[inv.status] || Colors.text3) + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColor[inv.status] || Colors.text3 }]}>{inv.status}</Text>
                </View>
              </View>
              <Text style={styles.customer}>{inv.customers?.name || '—'}</Text>
              <View style={[styles.cardRow, { marginTop: Spacing.sm }]}>
                <Text style={styles.date}>{inv.due_date ? `Due ${new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}` : 'No due date'}</Text>
                <Text style={styles.amount}>{fmt(inv.total, inv.currency)}</Text>
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
  filters: { paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.surface, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  filterChipText: { fontSize: 13, fontWeight: '500', color: Colors.text2 },
  filterChipTextActive: { color: Colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invNumber: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  customer: { fontSize: 13, color: Colors.text2, marginTop: 4 },
  date: { fontSize: 12, color: Colors.text3 },
  amount: { fontSize: 15, fontWeight: '800', color: Colors.text },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
});

import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { getErrorMessage, getWithRetry, patchWithRetry } from '../../lib/api';

const fmt = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

const statusColor: Record<string, string> = {
  paid: Colors.accent,
  overdue: Colors.danger,
  sent: Colors.primary,
  draft: Colors.text3,
  viewed: Colors.primary,
  cancelled: Colors.text3,
};

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = async () => {
    const requestId = ++requestRef.current;
    try {
      setError(null);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await getWithRetry<{ data: any[] }>('/invoices', { params });
      if (requestId === requestRef.current) {
        setInvoices(res.data.data || []);
      }
    } catch (err) {
      if (requestId === requestRef.current) {
        setError(getErrorMessage(err, 'Could not load invoices.'));
      }
    }
    if (requestId === requestRef.current) {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const FILTERS = ['all', 'draft', 'sent', 'paid', 'overdue'];

  const patchStatus = async (invoiceId: string, nextStatus: string) => {
    const previous = invoices;
    try {
      setError(null);
      setPendingId(invoiceId);
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: nextStatus } : inv)));
      await patchWithRetry(`/invoices/${invoiceId}`, { status: nextStatus });
    } catch (err) {
      setInvoices(previous);
      const msg = getErrorMessage(err, 'Could not update invoice status.');
      setError(msg);
      Alert.alert('Update failed', msg);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterChipActive]}>
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
        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading invoices...</Text>
          </View>
        ) : null}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.errorRetry}>
              <Text style={styles.errorRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && invoices.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>[ ]</Text>
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
              <Text style={styles.customer}>{inv.customers?.name || '-'}</Text>
              <View style={[styles.cardRow, { marginTop: Spacing.sm }]}>
                <Text style={styles.date}>
                  {inv.due_date
                    ? `Due ${new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`
                    : 'No due date'}
                </Text>
                <Text style={styles.amount}>{fmt(inv.total, inv.currency)}</Text>
              </View>
              <View style={styles.actions}>
                {inv.status !== 'paid' && (
                  <TouchableOpacity
                    disabled={pendingId === inv.id}
                    onPress={() => patchStatus(inv.id, 'paid')}
                    style={[styles.actionBtn, styles.actionSuccess, pendingId === inv.id && styles.actionDisabled]}
                  >
                    <Text style={styles.actionText}>Mark paid</Text>
                  </TouchableOpacity>
                )}
                {(inv.status === 'draft' || inv.status === 'overdue') && (
                  <TouchableOpacity
                    disabled={pendingId === inv.id}
                    onPress={() => patchStatus(inv.id, 'sent')}
                    style={[styles.actionBtn, styles.actionPrimary, pendingId === inv.id && styles.actionDisabled]}
                  >
                    <Text style={styles.actionText}>Send reminder</Text>
                  </TouchableOpacity>
                )}
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  filters: { paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.surface, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  filterChipText: { fontSize: 13, fontWeight: '500', color: Colors.text2 },
  filterChipTextActive: { color: Colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  loadingWrap: { alignItems: 'center', paddingVertical: Spacing.lg },
  loadingText: { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invNumber: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  customer: { fontSize: 13, color: Colors.text2, marginTop: 4 },
  date: { fontSize: 12, color: Colors.text3 },
  amount: { fontSize: 15, fontWeight: '800', color: Colors.text },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm },
  actionPrimary: { backgroundColor: Colors.primary },
  actionSuccess: { backgroundColor: Colors.accent },
  actionDisabled: { opacity: 0.6 },
  actionText: { fontSize: 12, fontWeight: '700', color: 'white' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 30, marginBottom: 12, color: Colors.text3 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
  errorBox: {
    backgroundColor: '#FFECEE',
    borderColor: '#FFD3D8',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  errorRetry: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.danger,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorRetryText: { color: 'white', fontSize: 12, fontWeight: '700' },
});

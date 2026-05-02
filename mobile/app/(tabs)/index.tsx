import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const fmt = (cents: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);
};

interface Summary {
  total_revenue: number;
  outstanding: number;
  overdue: number;
  total_expenses: number;
  recent_invoices: any[];
  recent_expenses: any[];
}

export default function DashboardScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/reports/dashboard-summary`);
      setSummary(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const StatCard = ({ label, value, color = Colors.primary }: { label: string; value: string; color?: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.headerTitle}>Klivora</Text>
        </View>

        <Text style={styles.greeting}>Good {getGreeting()}! 👋</Text>
        <Text style={styles.greetingSub}>Here's your overview</Text>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Revenue" value={fmt(summary?.total_revenue)} color={Colors.accent} />
          <StatCard label="Outstanding" value={fmt(summary?.outstanding)} color={Colors.primary} />
          <StatCard label="Overdue" value={fmt(summary?.overdue)} color={Colors.danger} />
          <StatCard label="Expenses" value={fmt(summary?.total_expenses)} color={Colors.warning} />
        </View>

        {/* Recent Invoices */}
        {(summary?.recent_invoices?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            {summary!.recent_invoices.map((inv) => (
              <View key={inv.id} style={styles.listItem}>
                <View>
                  <Text style={styles.listItemTitle}>{inv.invoice_number}</Text>
                  <Text style={styles.listItemSub}>{inv.customers?.name || '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listItemAmount}>{fmt(inv.total, inv.currency)}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor(inv.status) + '22' }]}>
                    <Text style={[styles.badgeText, { color: statusColor(inv.status) }]}>{inv.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {!summary && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Connect your account to see data</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const statusColor = (status: string) => {
  const map: Record<string, string> = { paid: Colors.accent, overdue: Colors.danger, sent: Colors.primary, draft: Colors.text3 };
  return map[status] || Colors.text3;
};

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.sm },
  logo: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: 'white', fontWeight: '800', fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  greetingSub: { fontSize: 14, color: Colors.text2, marginBottom: Spacing.xl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.xl },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3, ...Shadow.sm },
  statLabel: { fontSize: 11, color: Colors.text3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  listItemSub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  listItemAmount: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
});

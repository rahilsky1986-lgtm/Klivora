import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { getErrorMessage, getWithRetry, getDashboardSummary, getProfitLoss, getBalanceSheet, getTaxSummary } from '../../lib/api';
import { fmt, today, yearStart } from '../../lib/formatters';

export default function ReportsScreen() {
  const [tab, setTab] = useState<'pl' | 'bs' | 'tax'>('pl');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pl, setPl] = useState<any>(null);
  const [bs, setBs] = useState<any>(null);
  const [tax, setTax] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: yearStart(), end: today() });
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear()));
  const [currency, setCurrency] = useState('USD');

  const load = async () => {
    setLoading(true);
    try {
      setError(null);
      const [plRes, bsRes, taxRes] = await Promise.all([
        getProfitLoss({ start_date: dateRange.start, end_date: dateRange.end }),
        getBalanceSheet(),
        getTaxSummary({ year: taxYear }),
      ]);
      setPl(plRes.data);
      setBs(bsRes.data);
      setTax(taxRes.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load reports'));
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [dateRange, taxYear]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const Section = ({ title, value, sub, color = Colors.text, icon }) => (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLeft}>
        {icon && <Text style={{ fontSize: 18, marginRight: Spacing.sm }}>{icon}</Text>}
        <View>
          <Text style={{ fontWeight: '600', fontSize: 15, color: Colors.text }}>{title}</Text>
          {sub && <Text style={{ fontSize: 12, color: Colors.text3, marginTop: 2 }}>{sub}</Text>}
        </View>
      </View>
      <Text style={{ fontWeight: '800', fontSize: 18, color }}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Financial insights</Text>
      </View>

      <View style={styles.tabs}>
        {[{ id: 'pl', label: 'Profit & Loss' }, { id: 'bs', label: 'Balance Sheet' }, { id: 'tax', label: 'Tax Summary' }].map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
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

        {tab === 'pl' && pl && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.dateInputs}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={styles.dateValue}>{new Date(dateRange.start).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</Text>
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={styles.dateValue}>{new Date(dateRange.end).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</Text>
                </View>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.reportTitle}>Profit & Loss Statement</Text>
              <Section title="Total Revenue" value={fmt(pl.total_revenue, currency)} color={Colors.accent} icon="📈" />
              <Section title="Total Expenses" value={fmt(-pl.total_expenses, currency)} color={Colors.danger} icon="📉" />
              {pl.expenses_by_category && Object.entries(pl.expenses_by_category).map(([cat, amt]: [string, any]) => (
                <View key={cat} style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>{cat}</Text>
                  <Text style={styles.categoryValue}>-{fmt(amt, currency)}</Text>
                </View>
              ))}
              <Section
                title="Net Profit / Loss"
                value={fmt(pl.net_profit, currency)}
                color={pl.net_profit >= 0 ? Colors.accent : Colors.danger}
                icon="⚖️"
                sub="Revenue - Expenses"
              />
            </View>
          </View>
        )}

        {tab === 'bs' && bs && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.dateInputs}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>As of</Text>
                  <Text style={styles.dateValue}>{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</Text>
                </View>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.reportTitle}>Balance Sheet</Text>
              <Section title="Total Assets" value={fmt(bs.assets, currency)} color={Colors.accent} icon="📈" />
              <Section title="Total Liabilities" value={fmt(-bs.liabilities, currency)} color={Colors.danger} icon="📉" />
              <Section
                title="Net Worth (Equity)"
                value={fmt(bs.net_worth, currency)}
                color={bs.net_worth >= 0 ? Colors.accent : Colors.danger}
                icon="⚖️"
                sub="Assets - Liabilities"
              />
            </View>
          </View>
        )}

        {tab === 'tax' && tax && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.dateInputs}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Tax Year</Text>
                  <Text style={styles.dateValue}>{taxYear}</Text>
                </View>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.reportTitle}>Tax Summary {tax.year}</Text>
              <Text style={styles.disclaimer}>Estimated figures based on recorded data. Consult a tax professional.</Text>
              <Section title="Gross Revenue" value={fmt(tax.total_revenue, currency)} color={Colors.accent} icon="📈" />
              <Section title="Total Expenses (Deductible)" value={fmt(-tax.total_expenses, currency)} color={Colors.danger} icon="📉" />
              <Section title="Net Taxable Income" value={fmt(tax.net_profit, currency)} color={tax.net_profit >= 0 ? Colors.text : Colors.danger} />
              <Section title="Tax Collected on Invoices" value={fmt(tax.tax_collected, currency)} color={Colors.warning} icon="🧾" />
              <Section
                title="Estimated Tax Due (~25%)"
                value={fmt(tax.estimated_tax, currency)}
                color={Colors.warning}
                icon="⚠️"
                sub="Rough estimate only — consult your accountant"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text2, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.text2 },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  reportCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.sm },
  reportHeader: { marginBottom: Spacing.lg },
  dateInputs: { flexDirection: 'row', gap: Spacing.md },
  dateInput: { flex: 1 },
  dateLabel: { fontSize: 11, color: Colors.text3, textTransform: 'uppercase', marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  section: { display: 'flex', flexDirection: 'column', gap: Spacing.xs },
  reportTitle: { fontWeight: '800', fontSize: 16, marginBottom: Spacing.md, color: Colors.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, paddingLeft: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  categoryLabel: { fontSize: 13, color: Colors.text2 },
  categoryValue: { fontSize: 13, fontWeight: '600', color: Colors.danger },
  disclaimer: { fontSize: 12, color: Colors.text3, marginBottom: Spacing.md, fontStyle: 'italic' },
  errorBox: { backgroundColor: '#FFECEE', borderColor: '#FFD3D8', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  errorRetry: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  errorRetryText: { color: 'white', fontSize: 12, fontWeight: '700' },
});
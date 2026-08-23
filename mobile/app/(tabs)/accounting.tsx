import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { getErrorMessage, getWithRetry, getAccounts, createAccount, deleteAccount, getTransactions, createTransaction } from '../../lib/api';
import { fmt, today, ACCOUNT_TYPES, TRANSACTION_TYPES } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import AccountForm from '../../components/forms/AccountForm';
import TransactionForm from '../../components/forms/TransactionForm';

export default function AccountingScreen() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'accounts' | 'transactions'>('accounts');
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [txnFormOpen, setTxnFormOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');

  const load = async () => {
    try {
      setError(null);
      const [accRes, txnRes] = await Promise.all([
        getAccounts(),
        getTransactions({ limit: 50 }),
      ]);
      setAccounts(accRes.data || []);
      setTransactions(txnRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load accounting data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); };

  const handleDeleteAccount = async (id: string) => {
    Alert.alert('Delete this account?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteAccount(id); load(); }
        catch { Alert.alert('Cannot delete — account has transactions'); }
      }},
    ]);
  };

  const handleSaveAccount = () => { setAccountFormOpen(false); load(); };
  const handleSaveTxn = () => { setTxnFormOpen(false); load(); };

  const grouped = ACCOUNT_TYPES.reduce((acc, t) => ({ ...acc, [t.value]: accounts.filter((a: any) => a.type === t.value) }), {});

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
        <Text style={styles.title}>Accounting</Text>
        <Text style={styles.subtitle}>Chart of accounts & transactions</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'accounts' && styles.tabActive]} onPress={() => setTab('accounts')}>
          <Text style={[styles.tabText, tab === 'accounts' && styles.tabTextActive]}>Accounts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'transactions' && styles.tabActive]} onPress={() => setTab('transactions')}>
          <Text style={[styles.tabText, tab === 'transactions' && styles.tabTextActive]}>Transactions</Text>
        </TouchableOpacity>
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

        {tab === 'accounts' && (
          <>
            {accounts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📒</Text>
                <Text style={styles.emptyTitle}>No accounts</Text>
                <Text style={styles.emptySub}>Add accounts to build your chart of accounts</Text>
              </View>
            ) : (
              ACCOUNT_TYPES.map((type) => grouped[type.value]?.length > 0 && (
                <View key={type.value} style={styles.accountGroup}>
                  <Text style={styles.groupTitle}>{type.label}s</Text>
                  {grouped[type.value].map((acc: any) => (
                    <View key={acc.id} style={styles.accountCard}>
                      <View style={styles.accountInfo}>
                        <View style={styles.accountCode}>{acc.code || '—'}</View>
                        <View>
                          <Text style={styles.accountName}>{acc.name}</Text>
                          <Text style={styles.accountType}>{type.label}</Text>
                        </View>
                      </View>
                      {!acc.is_system && (
                        <TouchableOpacity onPress={() => handleDeleteAccount(acc.id)} style={styles.deleteBtn}>
                          <Text style={styles.deleteText}>🗑</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            )}
          </>
        )}

        {tab === 'transactions' && (
          <>
            {transactions.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💳</Text>
                <Text style={styles.emptyTitle}>No transactions</Text>
                <Text style={styles.emptySub}>Record journal entries and bank transactions</Text>
              </View>
            ) : (
              transactions.map((txn: any) => (
                <View key={txn.id} style={styles.txnCard}>
                  <View style={styles.txnRow}>
                    <View>
                      <Text style={styles.txnDate}>{new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</Text>
                      <Text style={styles.txnDesc}>{txn.description || '—'}</Text>
                    </View>
                    <View style={styles.txnAmounts}>
                      <Text style={[styles.txnType, { color: txn.type === 'debit' ? Colors.primary : Colors.accent }]}>
                        {txn.type === 'debit' ? '↓' : '↑'} {txn.type}
                      </Text>
                      <Text style={styles.txnAmount}>{fmt(txn.amount, currency)}</Text>
                    </View>
                  </View>
                  {txn.accounts && (
                    <Text style={styles.txnAccount}>{txn.accounts.name}</Text>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* FABs */}
      <TouchableOpacity onPress={() => setAccountFormOpen(true)} style={[styles.fab, styles.fabLeft]} activeOpacity={0.85}>
        <Text style={styles.fabText}>📒</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setTxnFormOpen(true)} style={styles.fab} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Account Form Modal */}
      <AccountForm
        open={accountFormOpen}
        onClose={() => setAccountFormOpen(false)}
        onSave={handleSaveAccount}
      />

      {/* Transaction Form Modal */}
      <TransactionForm
        open={txnFormOpen}
        onClose={() => setTxnFormOpen(false)}
        onSave={handleSaveTxn}
        accounts={accounts}
      />
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
  content: { padding: Spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
  errorBox: { backgroundColor: '#FFECEE', borderColor: '#FFD3D8', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  errorRetry: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  errorRetryText: { color: 'white', fontSize: 12, fontWeight: '700' },
  accountGroup: { marginBottom: Spacing.xl },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },
  accountCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  accountInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accountCode: { fontSize: 13, color: Colors.text3, width: 50, textAlign: 'center' },
  accountName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  accountType: { fontSize: 12, color: Colors.text3 },
  deleteBtn: { padding: Spacing.xs },
  deleteText: { fontSize: 18 },
  txnCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txnDate: { fontSize: 12, color: Colors.text3 },
  txnDesc: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 2 },
  txnAmounts: { alignItems: 'flex-end' },
  txnType: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800', color: Colors.text },
  txnAccount: { fontSize: 12, color: Colors.text3, marginTop: Spacing.xs },
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
  fabLeft: {
    right: 'auto',
    left: Spacing.lg,
    backgroundColor: Colors.primaryBg,
  },
  fabText: { fontSize: 24, fontWeight: '700', lineHeight: 24 },
});
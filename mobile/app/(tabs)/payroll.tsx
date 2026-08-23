import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { getErrorMessage, getWithRetry, getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployee, getPayrollRuns, runPayroll, updatePayrollStatus } from '../../lib/api';
import { fmt, toCents, toDollars, today, PAY_FREQUENCIES, statusColor as payrollStatusColor } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import EmployeeForm from '../../components/forms/EmployeeForm';
import PayrollRunForm from '../../components/forms/PayrollRunForm';

export default function PayrollScreen() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'employees' | 'runs'>('employees');
  const [empFormOpen, setEmpFormOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [runFormOpen, setRunFormOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [empRes, runRes] = await Promise.all([
        getEmployees(),
        getPayrollRuns(),
      ]);
      setEmployees(empRes.data || []);
      setRuns(runRes.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load payroll data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const openEmpCreate = () => { setEditingEmpId(null); setEmpFormOpen(true); };
  const openEmpEdit = (id: string) => { setEditingEmpId(id); setEmpFormOpen(true); };
  const handleEmpSave = () => { setEmpFormOpen(false); setEditingEmpId(null); load(); };

  const handleDeleteEmp = (id: string) => {
    Alert.alert('Remove employee?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteEmployee(id); load(); }
        catch { Alert.alert('Error', 'Failed to remove employee'); }
      }},
    ]);
  };

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id);
    try { await updatePayrollStatus(id, 'paid'); load(); }
    catch { Alert.alert('Error', 'Failed to mark as paid'); }
    setActionLoading(null);
  };

  const handleDownloadPayslip = async (id: string, empName: string) => {
    Alert.alert('Payslip', 'Payslip download available in web app');
  };

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
        <Text style={styles.title}>Payroll</Text>
        <Text style={styles.subtitle}>{employees.length} employee{employees.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'employees' && styles.tabActive]} onPress={() => setTab('employees')}>
          <Text style={[styles.tabText, tab === 'employees' && styles.tabTextActive]}>Employees</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'runs' && styles.tabActive]} onPress={() => setTab('runs')}>
          <Text style={[styles.tabText, tab === 'runs' && styles.tabTextActive]}>Payroll Runs</Text>
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

        {tab === 'employees' && (
          <>
            {employees.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>👷</Text>
                <Text style={styles.emptyTitle}>No employees</Text>
                <Text style={styles.emptySub}>Add your first employee to start running payroll</Text>
              </View>
            ) : (
              employees.map((emp) => (
                <View key={emp.id} style={styles.card}>
                  <View style={styles.empRow}>
                    <View>
                      <Text style={styles.empName}>{emp.name}</Text>
                      <Text style={styles.empEmail}>{emp.email || 'No email'}</Text>
                    </View>
                    <Text style={styles.empSalary}>{fmt(emp.salary, currency)}</Text>
                  </View>
                  <View style={styles.empMeta}>
                    <View style={styles.empMetaItem}>
                      <Text style={styles.empMetaLabel}>Frequency</Text>
                      <Text style={styles.empMetaValue}>{PAY_FREQUENCIES.find(f => f.value === emp.frequency)?.label || emp.frequency}</Text>
                    </View>
                    <View style={styles.empMetaItem}>
                      <Text style={styles.empMetaLabel}>Tax Rate</Text>
                      <Text style={styles.empMetaValue}>{emp.tax_info?.tax_rate || 0}%</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openEmpEdit(emp.id)} style={styles.actionBtnOutline}>
                      <Text style={styles.actionTextOutline}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteEmp(emp.id)} style={[styles.actionBtnOutline, styles.actionBtnDanger]}>
                      <Text style={[styles.actionTextOutline, { color: Colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === 'runs' && (
          <>
            {runs.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💼</Text>
                <Text style={styles.emptyTitle}>No payroll runs</Text>
                <Text style={styles.emptySub}>Run payroll to generate payslips</Text>
              </View>
            ) : (
              runs.map((run) => (
                <View key={run.id} style={styles.card}>
                  <View style={styles.runRow}>
                    <View>
                      <Text style={styles.empName}>{run.employees?.name || '—'}</Text>
                      <Text style={styles.empEmail}>
                        {new Date(run.period_start).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                        {' → '}
                        {new Date(run.period_end).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.runAmounts}>
                      <Text style={styles.runAmount}>Gross: {fmt(run.gross, currency)}</Text>
                      <Text style={styles.runAmount}>Net: {fmt(run.net, currency)}</Text>
                    </View>
                  </View>
                  <View style={styles.runMeta}>
                    <View style={[styles.badge, { backgroundColor: (payrollStatusColor[run.status] || Colors.text3) + '22' }]}>
                      <Text style={[styles.badgeText, { color: payrollStatusColor[run.status] || Colors.text3 }]}>{run.status}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleDownloadPayslip(run.id, run.employees?.name)} style={styles.actionBtnOutline}>
                      <Text style={styles.actionTextOutline}>Payslip</Text>
                    </TouchableOpacity>
                    {run.status !== 'paid' && (
                      <TouchableOpacity
                        disabled={actionLoading === run.id}
                        onPress={() => handleMarkPaid(run.id)}
                        style={[styles.actionBtn, styles.actionSuccess, actionLoading === run.id && styles.actionDisabled]}
                      >
                        <Text style={styles.actionText}>Mark Paid</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={tab === 'employees' ? openEmpCreate : () => setRunFormOpen(true)}
        style={styles.fab}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Employee Form Modal */}
      <EmployeeForm
        open={empFormOpen}
        onClose={() => { setEmpFormOpen(false); setEditingEmpId(null); }}
        onSave={handleEmpSave}
        employeeId={editingEmpId}
        currency={currency}
      />

      {/* Payroll Run Form Modal */}
      <PayrollRunForm
        open={runFormOpen}
        onClose={() => setRunFormOpen(false)}
        onSave={handleEmpSave}
        employees={employees}
        currency={currency}
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
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  empRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  empName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  empEmail: { fontSize: 12, color: Colors.text3, marginTop: 1 },
  empSalary: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  empMeta: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.md },
  empMetaItem: { flex: 1 },
  empMetaLabel: { fontSize: 11, color: Colors.text3, textTransform: 'uppercase', marginBottom: 2 },
  empMetaValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  runRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  runAmounts: { alignItems: 'flex-end' },
  runAmount: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 1 },
  runMeta: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.md },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  actionBtnOutline: { flex: 1, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  actionBtnDanger: { borderColor: Colors.danger },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.sm },
  actionSuccess: { backgroundColor: Colors.accent },
  actionDisabled: { opacity: 0.6 },
  actionText: { fontSize: 12, fontWeight: '700', color: 'white', textAlign: 'center' },
  actionTextOutline: { fontSize: 12, fontWeight: '600', color: Colors.primary, textAlign: 'center' },
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
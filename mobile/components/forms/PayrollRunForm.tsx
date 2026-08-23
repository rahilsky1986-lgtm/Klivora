import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { runPayroll, getEmployees } from '../../lib/api';
import { toCents, formatCurrency, today, fmt } from '../../lib/formatters';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface PayrollRunFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  employees: { id: string; name: string; salary: number }[];
  currency: string;
}

export default function PayrollRunForm({ open, onClose, onSave, employees, currency }: PayrollRunFormProps) {
  const [form, setForm] = useState({
    employee_id: '',
    period_start: today(),
    period_end: addDays(today(), 14),
    gross: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        employee_id: '',
        period_start: today(),
        period_end: addDays(today(), 14),
        gross: '',
        notes: '',
      });
    }
  }, [open]);

  const setField = (k: string) => (text: string) => setForm((f) => ({ ...f, [k]: text }));

  const handleSubmit = async () => {
    if (!form.employee_id || !form.gross) { Alert.alert('Error', 'Employee and gross pay are required'); return; }
    setLoading(true);
    try {
      await runPayroll({ ...form, gross: toCents(form.gross) });
      onSave();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to create payroll run');
    }
    setLoading(false);
  };

  const selectedEmployee = employees.find((e) => e.id === form.employee_id);
  const calcDeductions = () => {
    if (!form.gross || !selectedEmployee) return 0;
    const gross = toCents(form.gross);
    const taxRate = 20; // default, could be from employee.tax_info
    return Math.round(gross * (taxRate / 100));
  };
  const calcNet = () => toCents(form.gross) - calcDeductions();

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Run Payroll" footer={
      <>
        <Button variant="ghost" onPress={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onPress={handleSubmit} fullWidth>Create Payroll Run</Button>
      </>
    }>
      <View style={styles.form}>
        <Select label="Employee *" value={form.employee_id} onValueChange={setField('employee_id')}>
          <option value="">Select employee...</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {fmt(e.salary, currency)}</option>)}
        </Select>
        <View style={styles.row}>
          <Input label="Period Start *" type="date" value={form.period_start} onChangeText={setField('period_start')} />
          <Input label="Period End *" type="date" value={form.period_end} onChangeText={setField('period_end')} />
        </View>
        <Input
          label="Gross Pay *"
          type="decimal"
          value={form.gross}
          onChangeText={setField('gross')}
          placeholder="0.00"
          hint={`Deductions: ~${fmt(calcDeductions(), currency)} | Net: ~${fmt(calcNet(), currency)}`}
        />
        <Input label="Notes" value={form.notes} onChangeText={setField('notes')} placeholder="Optional notes" />
      </View>
    </Modal>
  );
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  form: { display: 'flex', flexDirection: 'column', gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
});
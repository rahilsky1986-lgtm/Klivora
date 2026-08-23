import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getCustomers, createInvoice, updateInvoice, getInvoice } from '../../lib/api';
import { fmt, toCents, toDollars, today, CURRENCIES, EXPENSE_CATEGORIES, INVOICE_STATUSES } from '../../lib/formatters';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  invoiceId?: string;
  customers: { id: string; name: string }[];
  currency: string;
}

const emptyItem = () => ({ description: '', quantity: '1', unit_price: '', tax_rate: '0' });

export default function InvoiceForm({ open, onClose, onSave, invoiceId, customers, currency }: InvoiceFormProps) {
  const isEdit = !!invoiceId;
  const [form, setForm] = useState({
    customer_id: '',
    issue_date: today(),
    due_date: addDays(today(), 30),
    currency,
    notes: '',
    payment_terms: 'Due within 30 days',
    discount_amount: '0',
  });
  const [items, setItems] = useState<typeof emptyItem>([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (open && isEdit && invoiceId) {
      setPageLoading(true);
      getInvoice(invoiceId).then((res) => {
        const inv = res.data;
        setForm({
          customer_id: inv.customer_id || '',
          issue_date: inv.issue_date || today(),
          due_date: inv.due_date || addDays(today(), 30),
          currency: inv.currency || currency,
          notes: inv.notes || '',
          payment_terms: inv.payment_terms || '',
          discount_amount: toDollars(inv.discount_amount || 0),
        });
        setItems(
          inv.invoice_items?.map((i: any) => ({
            description: i.description,
            quantity: String(i.quantity),
            unit_price: toDollars(i.unit_price),
            tax_rate: String(i.tax_rate || 0),
          })) || [emptyItem()]
        );
        setPageLoading(false);
      }).catch(() => {
        setPageLoading(false);
      });
    } else if (open && !isEdit) {
      setForm({
        customer_id: '',
        issue_date: today(),
        due_date: addDays(today(), 30),
        currency,
        notes: '',
        payment_terms: 'Due within 30 days',
        discount_amount: '0',
      });
      setItems([emptyItem()]);
    }
  }, [open, invoiceId, isEdit, currency]);

  const setField = (k: string) => (text: string) => setForm((f) => ({ ...f, [k]: text }));
  const setItem = (idx: number, k: string) => (text: string) =>
    setItems((items) => items.map((item, i) => (i === idx ? { ...item, [k]: text } : item)));
  const addItem = () => setItems((i) => [...i, emptyItem()]);
  const removeItem = (idx: number) => setItems((i) => i.filter((_, j) => j !== idx));

  const calcTotals = () => {
    let subtotal = 0, taxAmt = 0;
    for (const item of items) {
      const qty = parseFloat(item.quantity) || 0;
      const price = toCents(item.unit_price || 0);
      const taxRate = parseFloat(item.tax_rate) || 0;
      const lineAmt = Math.round(qty * price);
      subtotal += lineAmt;
      taxAmt += Math.round(lineAmt * (taxRate / 100));
    }
    const discount = toCents(form.discount_amount || 0);
    return { subtotal, taxAmt, discount, total: Math.max(0, subtotal + taxAmt - discount) };
  };

  const { subtotal, taxAmt, discount, total } = calcTotals();

  const handleSubmit = async () => {
    if (!form.customer_id) { Alert.alert('Error', 'Customer is required'); return; }
    if (!items.some((i) => i.description && i.unit_price)) { Alert.alert('Error', 'Add at least one line item'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        discount_amount: toCents(form.discount_amount || 0),
        items: items.map((i) => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          unit_price: toCents(i.unit_price || 0),
          tax_rate: parseFloat(i.tax_rate) || 0,
        })),
      };
      if (isEdit) await updateInvoice(invoiceId!, payload);
      else await createInvoice(payload);
      onSave();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save invoice');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Invoice' : 'New Invoice'} footer={
      <>
        <Button variant="ghost" onPress={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onPress={handleSubmit} fullWidth>
          {isEdit ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </>
    }>
      {pageLoading ? (
        <View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Customer & Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <Select
              label="Customer *"
              value={form.customer_id}
              onValueChange={setField('customer_id')}
              error={!form.customer_id ? 'Required' : undefined}
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <View style={styles.row}>
              <Input label="Issue Date" type="date" value={form.issue_date} onChangeText={setField('issue_date')} />
              <Input label="Due Date" type="date" value={form.due_date} onChangeText={setField('due_date')} />
            </View>
            <Select label="Currency" value={form.currency} onValueChange={setField('currency')}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
          </View>

          {/* Line Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            <View style={styles.itemHeader}>
              <Text style={styles.itemHeaderCell}>Description</Text>
              <Text style={[styles.itemHeaderCell, styles.itemHeaderCellSmall]}>Qty</Text>
              <Text style={[styles.itemHeaderCell, styles.itemHeaderCellMoney]}>Unit Price</Text>
              <Text style={[styles.itemHeaderCell, styles.itemHeaderCellSmall]}>Tax %</Text>
              <Text style={{ width: 44 }} />
            </View>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChangeText={setItem(idx, 'description')}
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <Input
                  type="decimal"
                  placeholder="1"
                  value={item.quantity}
                  onChangeText={setItem(idx, 'quantity')}
                  style={{ width: 70, marginBottom: 0, textAlign: 'center' }}
                />
                <Input
                  type="decimal"
                  placeholder="0.00"
                  value={item.unit_price}
                  onChangeText={setItem(idx, 'unit_price')}
                  style={{ width: 110, marginBottom: 0, textAlign: 'right' }}
                />
                <Input
                  type="decimal"
                  placeholder="0"
                  value={item.tax_rate}
                  onChangeText={setItem(idx, 'tax_rate')}
                  style={{ width: 70, marginBottom: 0, textAlign: 'center' }}
                />
                <TouchableOpacity onPress={() => removeItem(idx)} disabled={items.length === 1} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Button variant="secondary" size="sm" onPress={addItem} style={{ marginTop: Spacing.md, alignSelf: 'flex-start' }}>
              + Add Line Item
            </Button>

            {/* Totals */}
            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{fmt(subtotal, currency)}</Text>
              </View>
              {taxAmt > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax</Text>
                  <Text style={styles.totalValue}>{fmt(taxAmt, currency)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Input
                  type="decimal"
                  value={form.discount_amount}
                  onChangeText={setField('discount_amount')}
                  style={{ width: 100, marginBottom: 0, textAlign: 'right' }}
                />
              </View>
              <View style={[styles.totalRow, styles.totalRowGrand]}>
                <Text style={[styles.totalLabel, styles.totalLabelGrand]}>Total</Text>
                <Text style={[styles.totalValue, styles.totalValueGrand]}>{fmt(total, currency)}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes & Terms</Text>
            <Textarea
              label="Invoice Notes"
              value={form.notes}
              onChangeText={setField('notes')}
              rows={3}
              placeholder="e.g. Thank you for your business!"
            />
            <Textarea
              label="Payment Terms"
              value={form.payment_terms}
              onChangeText={setField('payment_terms')}
              rows={3}
              placeholder="e.g. Due within 30 days"
            />
          </View>
        </ScrollView>
      )}
    </Modal>
  );
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: Spacing.xl },
  loadingText: { fontSize: 15, color: Colors.text2 },
  scrollContent: { paddingBottom: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  itemHeader: { flexDirection: 'row', marginBottom: Spacing.xs, paddingHorizontal: Spacing.xs },
  itemHeaderCell: { fontSize: 11, fontWeight: '600', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemHeaderCellSmall: { width: 70, textAlign: 'center' },
  itemHeaderCellMoney: { width: 110, textAlign: 'right' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs, marginBottom: Spacing.xs },
  deleteBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  deleteText: { fontSize: 18, color: Colors.danger, fontWeight: '600' },
  totals: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    alignSelf: 'flex-end',
    width: '100%',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs, alignItems: 'center' },
  totalRowGrand: { borderTopWidth: 2, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.xs },
  totalLabel: { fontSize: 14, color: Colors.text2 },
  totalLabelGrand: { fontSize: 18, fontWeight: '800', color: Colors.text },
  totalValue: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  totalValueGrand: { fontSize: 18, fontWeight: '800', color: Colors.primary },
});
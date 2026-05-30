import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { getErrorMessage, getWithRetry } from '../../lib/api';

const fmt = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = async () => {
    const requestId = ++requestRef.current;
    try {
      setError(null);
      const res = await getWithRetry<{ data: any[] }>('/expenses', { params: { limit: 30 } });
      if (requestId === requestRef.current) {
        setExpenses(res.data.data || []);
      }
    } catch (err) {
      if (requestId === requestRef.current) {
        setError(getErrorMessage(err, 'Could not load expenses.'));
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => { setLoading(true); load(); }, []);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleScanReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to scan receipts.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        Alert.alert('Receipt captured', 'Go to the web app to attach this receipt to an expense.');
      }
    } catch {
      Alert.alert('Camera unavailable', 'Could not open camera. Please try again.');
    }
  };

  const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Expenses</Text>
          <Text style={styles.subtitle}>Total: {fmt(totalExpenses)}</Text>
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={handleScanReceipt}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>SCAN</Text>
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
        {loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptySub}>Loading expenses...</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No expenses</Text>
            <Text style={styles.emptySub}>Add expenses from the web app</Text>
          </View>
        ) : (
          expenses.map((exp) => (
            <View key={exp.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{exp.category}</Text>
                </View>
                <Text style={styles.amount}>-{fmt(exp.amount)}</Text>
              </View>
              <Text style={styles.vendor}>{exp.vendor || exp.description || '-'}</Text>
              <Text style={styles.date}>{new Date(exp.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              {exp.receipt_url && (
                <Text style={styles.receiptTag}>Receipt attached</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text2, marginTop: 2 },
  scanBtn: { minWidth: 52, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  categoryBadge: { backgroundColor: Colors.surface2, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  categoryText: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  amount: { fontSize: 16, fontWeight: '800', color: Colors.danger },
  vendor: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  date: { fontSize: 12, color: Colors.text3 },
  receiptTag: { fontSize: 11, color: Colors.primary, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
  errorBox: { backgroundColor: '#FFECEE', borderColor: '#FFD3D8', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  errorRetry: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  errorRetryText: { color: 'white', fontSize: 12, fontWeight: '700' },
});

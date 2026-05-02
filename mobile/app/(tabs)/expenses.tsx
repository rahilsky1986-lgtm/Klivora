import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const fmt = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/expenses`, { params: { limit: 30 } });
      setExpenses(res.data.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleScanReceipt = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to scan receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      Alert.alert('Receipt captured!', 'Go to the web app to attach this receipt to an expense.');
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
          <Text style={{ fontSize: 20 }}>📷</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {expenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>💸</Text>
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
              <Text style={styles.vendor}>{exp.vendor || exp.description || '—'}</Text>
              <Text style={styles.date}>{new Date(exp.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              {exp.receipt_url && (
                <Text style={styles.receiptTag}>📎 Receipt attached</Text>
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
  scanBtn: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
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
});

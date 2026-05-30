import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Shadow } from '../../constants/Colors';
import { api, getErrorMessage, setAccessToken } from '../../lib/api';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const token = res.data?.session?.access_token;
      if (!token) throw new Error('Missing access token from login response.');
      await setAccessToken(token);
      router.replace('/(tabs)');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.brand}>
          <View style={styles.logo}><Text style={styles.logoText}>K</Text></View>
          <Text style={styles.title}>Klivora</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.card}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors.text3}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            placeholderTextColor={Colors.text3}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity onPress={submit} disabled={!canSubmit} style={[styles.button, !canSubmit && styles.buttonDisabled]}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  wrap: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: 'white', fontSize: 24, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { marginTop: 6, color: Colors.text2, fontSize: 14 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.md },
  input: { height: 46, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, fontSize: 14, color: Colors.text, marginBottom: 10, backgroundColor: Colors.surface2 },
  button: { marginTop: 8, height: 46, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '700' },
  error: { color: Colors.danger, marginTop: 2, marginBottom: 6, fontSize: 12, fontWeight: '600' },
});

import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

type MenuItemProps = {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  color?: string;
};

const MenuItem = ({ icon, label, sub, onPress, color = Colors.text }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <View style={styles.menuInfo}>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {sub && <Text style={styles.menuSub}>{sub}</Text>}
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

export default function MoreScreen() {
  const openWeb = () => {
    Linking.openURL(process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:5173');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.profileCard}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <View>
            <Text style={styles.appName}>Klivora</Text>
            <Text style={styles.tagline}>Free invoicing & accounting</Text>
          </View>
        </View>

        {/* Features */}
        <Text style={styles.sectionLabel}>FEATURES</Text>
        <View style={styles.section}>
          <MenuItem icon="📊" label="Reports" sub="P&L, Balance Sheet, Tax" onPress={openWeb} />
          <MenuItem icon="💼" label="Payroll" sub="Run payroll, manage employees" onPress={openWeb} />
          <MenuItem icon="📒" label="Accounting" sub="Chart of accounts, journal entries" onPress={openWeb} />
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.section}>
          <MenuItem icon="⚙️" label="Settings" sub="Business profile, invoice settings" onPress={openWeb} />
          <MenuItem icon="🌐" label="Open Web App" sub="Full Klivora experience" onPress={openWeb} />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.section}>
          <MenuItem icon="📖" label="Help & Documentation" onPress={() => Linking.openURL('https://Klivora.app/help')} />
          <MenuItem icon="🔒" label="Privacy Policy" onPress={() => Linking.openURL('https://Klivora.app/privacy')} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Klivora v1.0.0 · Free forever</Text>
          <Text style={styles.footerSub}>Built for small businesses & freelancers 💙</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.md },
  logo: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: 'white', fontWeight: '800', fontSize: 22 },
  appName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  tagline: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.text3, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  section: { backgroundColor: Colors.surface, borderRadius: Radius.md, marginBottom: Spacing.xl, overflow: 'hidden', ...Shadow.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { fontSize: 20, marginRight: Spacing.md, width: 30 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  menuSub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.text3, marginLeft: 8 },
  footer: { alignItems: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: 13, color: Colors.text3, fontWeight: '500' },
  footerSub: { fontSize: 12, color: Colors.text3, marginTop: 4 },
});

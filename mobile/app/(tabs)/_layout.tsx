import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

type TabIcon = { name: keyof typeof Ionicons.glyphMap; focused: boolean };

function TabBarIcon({ name, focused }: TabIcon) {
  return (
    <Ionicons
      name={focused ? name : `${name}-outline` as any}
      size={24}
      color={focused ? Colors.primary : Colors.text3}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text3,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontWeight: '700', color: Colors.text },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabBarIcon name="grid" focused={focused} /> }}
      />
      <Tabs.Screen
        name="invoices"
        options={{ title: 'Invoices', tabBarIcon: ({ focused }) => <TabBarIcon name="document-text" focused={focused} /> }}
      />
      <Tabs.Screen
        name="expenses"
        options={{ title: 'Expenses', tabBarIcon: ({ focused }) => <TabBarIcon name="receipt" focused={focused} /> }}
      />
      <Tabs.Screen
        name="customers"
        options={{ title: 'Customers', tabBarIcon: ({ focused }) => <TabBarIcon name="people" focused={focused} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ focused }) => <TabBarIcon name="menu" focused={focused} /> }}
      />
    </Tabs>
  );
}

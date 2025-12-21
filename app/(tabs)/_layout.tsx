import React from 'react';
import { Tabs } from 'expo-router';
import { ShoppingCart, Bell, Calendar, Home, ChefHat, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/components/useColorScheme';
import { Radius, Shadows } from '@/constants/Colors';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.tabIconDefault,
      headerShown: false,
      tabBarStyle: {
        position: 'absolute',
        bottom: 25,
        marginHorizontal: 16,
        backgroundColor: theme.tabBarBackground,
        borderRadius: Radius.xl,
        height: 70,
        paddingBottom: 0,
        paddingTop: 0,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.lg,
        borderTopWidth: 0,
      },
      tabBarItemStyle: {
        paddingVertical: 10,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
        paddingBottom: 6,
      }
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color, focused }) => (
            <ChefHat size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color, focused }) => (
            <Sparkles size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingCart size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <Bell size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* Hidden tabs */}
      <Tabs.Screen
        name="dishes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

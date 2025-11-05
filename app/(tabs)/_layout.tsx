import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "../../components/haptic-tab";
import { useColorScheme } from "../../hooks/use-color-scheme";

const PRIMARY = "#0F6E56";

// Floating pill tab bar — lifts off the screen edge,
// full rounded corners, drop shadow, no top border.
const PILL_HEIGHT = 64;
const PILL_BOTTOM = Platform.OS === "ios" ? 34 : 20;
const PILL_INSET = 20; // distance from screen edges

type TabIconProps = {
  iconName: string;
  color: string;
  focused: boolean;
  isDark: boolean;
};

function TabIcon({ iconName, color, focused, isDark }: TabIconProps) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        // Active pill highlight behind icon
        width: 58,
        height: 42,
        borderRadius: 21,
        backgroundColor: focused
          ? isDark
            ? "rgba(15,110,86,0.22)"
            : "rgba(15,110,86,0.12)"
          : "transparent",
      }}
    >
      <Ionicons name={iconName as any} size={24} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        // Inactive icons clearly visible, but muted
        tabBarInactiveTintColor: isDark ? "#5E5E5E" : "#C2C2C2",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          // ─── Floating pill ───────────────────────────────
          position: "absolute",
          bottom: PILL_BOTTOM,
          left: PILL_INSET,
          right: PILL_INSET,
          height: PILL_HEIGHT,
          borderRadius: PILL_HEIGHT / 2, // perfect pill = radius = height/2
          // ─── Surface ─────────────────────────────────────
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderTopWidth: 0, // no hairline — clean edge
          // ─── Depth ───────────────────────────────────────
          elevation: 28,
          shadowColor: isDark ? "#000000" : "#3A3A3A",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.55 : 0.14,
          shadowRadius: 24,
          // ─── Padding reset ───────────────────────────────
          paddingBottom: 0,
          paddingTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              iconName={focused ? "map" : "map-outline"}
              color={color}
              focused={focused}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vendor"
        options={{
          title: "My Store",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              iconName={focused ? "storefront" : "storefront-outline"}
              color={color}
              focused={focused}
              isDark={isDark}
            />
          ),
        }}
      />
    </Tabs>
  );
}

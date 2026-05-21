import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";

import { useAppTheme } from "@/providers/AppThemeProvider";

const generalIconUri = Asset.fromModule(
  require("../../assets/icon/general.svg")
).uri;
const bookkeepingIconUri = Asset.fromModule(
  require("../../assets/icon/Bookkeeping.svg")
).uri;
const statisticsIconUri = Asset.fromModule(
  require("../../assets/icon/Statistics.svg")
).uri;
const exchangeIconUri = Asset.fromModule(
  require("../../assets/icon/货币单位.svg"),
).uri;
const settingsIconUri = Asset.fromModule(
  require("../../assets/icon/Settings.svg"),
).uri;

function ThemeToggleButton() {
  const { isDark, theme, toggleThemeMode } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Toggle dark mode"
      onPress={() => {
        toggleThemeMode().catch((error) => {
          console.error("Failed to toggle theme mode:", error);
        });
      }}
      style={({ pressed }) => [
        styles.themeToggleButton,
        {
          backgroundColor: isDark
            ? theme.accentSoft
            : theme.selectedBg,
        },
        pressed ? styles.themeToggleButtonPressed : null,
      ]}
    >
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={18}
        color={theme.headerText}
      />
    </Pressable>
  );
}

export default function TabLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.headerBg,
        },
        headerTintColor: theme.headerText,
        tabBarActiveTintColor: theme.tabIconActive,
        tabBarInactiveTintColor: theme.tabIconInactive,
        sceneStyle: {
          backgroundColor: theme.background,
        },
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.divider,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ size, color }) => (
            <SvgUri
              uri={generalIconUri}
              width={size}
              height={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: "Bookkeeping",
          tabBarIcon: ({ size, color }) => (
            <SvgUri
              uri={bookkeepingIconUri}
              width={size}
              height={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Statistics",
          tabBarIcon: ({ size, color }) => (
            <SvgUri
              uri={statisticsIconUri}
              width={size}
              height={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: "Exchange",
          tabBarIcon: ({ size, color }) => (
            <SvgUri
              uri={exchangeIconUri}
              width={size}
              height={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerRight: () => <ThemeToggleButton />,
          tabBarIcon: ({ size, color }) => (
            <SvgUri
              uri={settingsIconUri}
              width={size}
              height={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  themeToggleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  themeToggleButtonPressed: {
    opacity: 0.78,
  },
});

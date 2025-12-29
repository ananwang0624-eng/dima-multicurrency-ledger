import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "rgb(128, 75, 56)",
        },
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "rgb(246, 233, 228)",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Overview" }} />
      <Tabs.Screen name="ledger" options={{ title: "Bookkeeping" }} />
      <Tabs.Screen name="stats" options={{ title: "Statistics" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

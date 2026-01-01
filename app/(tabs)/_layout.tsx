import { Tabs } from "expo-router";

import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";

const generalIconUri = Asset.fromModule(
  require("../../assets/icon/general.svg")
).uri;
const bookkeepingIconUri = Asset.fromModule(
  require("../../assets/icon/Bookkeeping.svg")
).uri;
const statisticsIconUri = Asset.fromModule(
  require("../../assets/icon/Statistics.svg")
).uri;
const settingsIconUri = Asset.fromModule(
  require("../../assets/icon/Settings.svg")
).uri;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "rgb(128, 75, 56)",
        },
        headerTintColor: "#fff",
        tabBarActiveTintColor: "rgb(128, 75, 56)",
        tabBarInactiveTintColor: "rgb(133, 115, 110)",
        sceneStyle: {
          backgroundColor: "rgb(253, 247, 245)",
        },
        tabBarStyle: {
          backgroundColor: "rgb(246, 233, 228)",
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
        name="settings"
        options={{
          title: "Settings",
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

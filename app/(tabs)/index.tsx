import { View } from "react-native";

import BalanceSummaryCard from "@/components/BalanceSummaryCard";

export default function HomeTab() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgb(253, 247, 245)",
        padding: 20,
      }}
    >
      <BalanceSummaryCard />
    </View>
  );
}

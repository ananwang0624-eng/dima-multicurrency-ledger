import DateAmountLineChart from "@/components/DateAmountLineChart";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function StatsTab() {

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(253, 247, 245)",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "rgb(128, 75, 56)",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "rgb(133, 115, 110)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgb(128, 75, 56)",
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "rgb(133, 115, 110)",
  },
  infoText: {
    fontSize: 14,
    color: "rgb(87, 83, 78)",
    lineHeight: 20,
  },
});

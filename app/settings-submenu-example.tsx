import { StyleSheet, Text, View } from "react-native";

export default function SettingsSubmenuExampleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submenu Example</Text>
      <Text style={styles.subtitle}>This is a demo page for navigation.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(253, 247, 245)",
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
});

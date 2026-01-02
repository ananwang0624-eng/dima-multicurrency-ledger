import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  href: Href;
  iconName?: keyof typeof Ionicons.glyphMap;
  testID?: string;
};

export default function SubmenuNavButton({
  title,
  subtitle,
  href,
  iconName,
  testID,
}: Props) {
  const router = useRouter();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.container,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.leftIconCircle}>
        {iconName ? (
          <Ionicons name={iconName} size={26} color={HEADER_COLOR} />
        ) : null}
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={HEADER_COLOR} />
    </Pressable>
  );
}

const HEADER_COLOR = "rgb(128, 75, 56)";
const DIVIDER_COLOR = "rgb(239, 222, 216)";
const LEFT_CIRCLE_COLOR = "rgb(245, 218, 208)";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.75,
  },
  leftIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: LEFT_CIRCLE_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgb(32, 24, 23)",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: HEADER_COLOR,
  },
});

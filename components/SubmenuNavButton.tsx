import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/providers/AppThemeProvider";

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
  const { theme } = useAppTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      // 跳转到子菜单页面
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <View
        style={[styles.leftIconCircle, { backgroundColor: theme.iconCircleBg }]}
      >
        {iconName ? (
          <Ionicons name={iconName} size={26} color={theme.accent} />
        ) : null}
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.accent }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 14,
    borderWidth: 2,
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
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
  },
});

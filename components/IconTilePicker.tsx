/**
 * 图标磁贴选择器组件
 * 显示 8 个分类图标，以两行四列的格式布局
 */
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { SvgUri } from "react-native-svg";

import {
  ICON_TILE_ITEMS,
  type IconTileItem,
  type IconTilePickerValue,
} from "@/data/iconTileItems";

// 主题色彩常量
const COLORS = {
  tileBg: "rgb(246, 233, 228)",
  active: "rgb(128, 75, 56)",
  inactive: "rgb(133, 115, 110)",
} as const;

export type { IconTilePickerValue };

export function IconTilePicker({
  value,
  onChange,
  style,
}: {
  value: IconTilePickerValue;
  onChange: (next: IconTilePickerValue) => void;
  style?: ViewStyle;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const items = ICON_TILE_ITEMS;

  // 根据屏幕宽度计算单个图块大小
  const tileSize = useMemo(() => {
    const horizontalPadding = 16;
    const columnGap = 12;
    const available = Math.max(0, windowWidth - horizontalPadding * 2);
    return Math.floor((available - columnGap * 3) / 4);
  }, [windowWidth]);

  // 两行四列
  const rows = useMemo<IconTileItem[][]>(
    () => [items.slice(0, 4), items.slice(4, 8)],
    [items],
  );

  return (
    <View style={[styles.container, style]}>
      {/* 分类图标网格 */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item) => {
            const selected = item.value === value;
            const tint = selected ? COLORS.active : COLORS.inactive;

            return (
              <Pressable
                key={item.value}
                style={({ pressed }) => [
                  styles.tile,
                  selected ? styles.tileSelected : styles.tileUnselected,
                  {
                    width: tileSize,
                    height: tileSize,
                    backgroundColor: item.bgColor ?? COLORS.tileBg,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => onChange(item.value)}
              >
                <SvgUri uri={item.uri} width={28} height={28} color={tint} />
                <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 20,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tile: {
    borderRadius: 14,
    backgroundColor: COLORS.tileBg,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tileSelected: {
    borderColor: COLORS.active,
  },
  tileUnselected: {
    borderColor: "transparent",
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
});

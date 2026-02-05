import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface BarChartProps {
  data: number[];
  height?: number;
  barColor?: string;
  gradientToColor?: string;
  backgroundColor?: string;
  showValues?: boolean;
  labels?: string[];
}

export default function BarChart({
  data,
  height = 200,
  barColor = "#4A90E2",
  gradientToColor,
  backgroundColor = "#f5f5f5",
}: BarChartProps) {
  // 确保数组长度为7
  if (data.length !== 7) {
    console.warn("BarChart expects an array of length 7");
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;

  // 计算每个柱形的高度百分比（10%-100%）
  const getBarHeightPercentage = (value: number) => {
    if (range === 0) return 100; // 所有值相同时，显示100%
    const normalized = (value - minValue) / range;
    return 30 + normalized * 70; // 30% + (0-1) * 70%
  };

  // 生成较浅的颜色用于渐变顶部
  const getLighterColor = (color: string) => {
    let r = 0,
      g = 0,
      b = 0;

    // 解析 HEX 颜色
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      } else {
        return color;
      }
    }
    // 解析 RGB/RGBA 颜色
    else if (color.startsWith("rgb")) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        r = parseInt(matches[0], 10);
        g = parseInt(matches[1], 10);
        b = parseInt(matches[2], 10);
      } else {
        return color;
      }
    } else {
      return color;
    }

    // 简单的颜色变亮算法，将 RGB 值向 255 推进 (60% 混合白色)
    const lighterR = Math.min(255, Math.floor(r + (255 - r) * 0.6));
    const lighterG = Math.min(255, Math.floor(g + (255 - g) * 0.6));
    const lighterB = Math.min(255, Math.floor(b + (255 - b) * 0.6));

    return `rgb(${lighterR}, ${lighterG}, ${lighterB})`;
  };

  const endColor = gradientToColor || getLighterColor(barColor);

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.chartArea, { height, backgroundColor }]}>
        {data.map((value, index) => {
          const heightPercentage = getBarHeightPercentage(value);
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <LinearGradient
                  colors={[barColor, endColor]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[styles.bar, { height: `${heightPercentage}%` }]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingVertical: 10,
    borderRadius: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    marginHorizontal: 0.6,
  },
  barWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "80%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
});

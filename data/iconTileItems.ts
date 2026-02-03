/**
 * 图标磁贴项目数据定义
 * 包含 8 个分类图标及其配置（餐饮、交通、购物、娱乐、医疗、教育、日常、其他）
 */
import { Asset } from "expo-asset";

/**
 * 图标选择器的值类型（0-8）
 */
export type IconTilePickerValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * 图标磁贴项目类型
 */
export type IconTileItem = {
  value: IconTilePickerValue; // 值（索引）
  label: string; // 显示标签
  uri: string; // SVG 图标 URI
  bgColor: string; // 背景色
};

// 加载 SVG 图标资源
const diningIconUri = Asset.fromModule(
  require("../assets/icon/Dining.svg"),
).uri;
const transportIconUri = Asset.fromModule(
  require("../assets/icon/Transport.svg"),
).uri;
const shoppingIconUri = Asset.fromModule(
  require("../assets/icon/Shopping.svg"),
).uri;
const gamingIconUri = Asset.fromModule(
  require("../assets/icon/Gaming.svg"),
).uri;
const healthIconUri = Asset.fromModule(
  require("../assets/icon/Health.svg"),
).uri;
const educationIconUri = Asset.fromModule(
  require("../assets/icon/Education.svg"),
).uri;
const dailyIconUri = Asset.fromModule(require("../assets/icon/Daily.svg")).uri;
const othersIconUri = Asset.fromModule(
  require("../assets/icon/Others.svg"),
).uri;

/**
 * 图标磁贴项目列表
 * 包含 8 个分类，每个分类有对应的图标和背景色
 */
export const ICON_TILE_ITEMS: IconTileItem[] = [
  {
    value: 0,
    label: "Dining",
    uri: diningIconUri,
    bgColor: "rgb(245, 218, 208)",
  },
  {
    value: 1,
    label: "Transport",
    uri: transportIconUri,
    bgColor: "rgb(240, 225, 169)",
  },
  {
    value: 2,
    label: "Shopping",
    uri: shoppingIconUri,
    bgColor: "rgb(239, 222, 216)",
  },
  {
    value: 3,
    label: "Gaming",
    uri: gamingIconUri,
    bgColor: "rgb(245, 218, 208)",
  },
  {
    value: 4,
    label: "Health",
    uri: healthIconUri,
    bgColor: "rgb(240, 225, 169)",
  },
  {
    value: 5,
    label: "Education",
    uri: educationIconUri,
    bgColor: "rgb(239, 222, 216)",
  },
  {
    value: 6,
    label: "Daily",
    uri: dailyIconUri,
    bgColor: "rgb(245, 218, 208)",
  },
  {
    value: 7,
    label: "Others",
    uri: othersIconUri,
    bgColor: "rgb(240, 225, 169)",
  },
  {
    value: 8,
    label: "Exchange",
    uri: othersIconUri,
    bgColor: "rgb(239, 222, 216)",
  },
];

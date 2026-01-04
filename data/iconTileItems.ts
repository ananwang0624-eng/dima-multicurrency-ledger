import { Asset } from "expo-asset";

export type IconTilePickerValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type IconTileItem = {
  value: IconTilePickerValue;
  label: string;
  uri: string;
  bgColor: string;
};

const diningIconUri = Asset.fromModule(
  require("../assets/icon/Dining.svg")
).uri;
const transportIconUri = Asset.fromModule(
  require("../assets/icon/Transport.svg")
).uri;
const shoppingIconUri = Asset.fromModule(
  require("../assets/icon/Shopping.svg")
).uri;
const gamingIconUri = Asset.fromModule(
  require("../assets/icon/Gaming.svg")
).uri;
const healthIconUri = Asset.fromModule(
  require("../assets/icon/Health.svg")
).uri;
const educationIconUri = Asset.fromModule(
  require("../assets/icon/Education.svg")
).uri;
const dailyIconUri = Asset.fromModule(require("../assets/icon/Daily.svg")).uri;
const othersIconUri = Asset.fromModule(
  require("../assets/icon/Others.svg")
).uri;

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
];

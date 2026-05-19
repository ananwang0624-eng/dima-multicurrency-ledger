export type ThemeMode = "light" | "dark";

export type AppTheme = {
  background: string;
  backgroundSubtle: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnAccent: string;
  accent: string;
  accentSoft: string;
  border: string;
  divider: string;
  overlay: string;
  shadow: string;
  tabBar: string;
  tabIconActive: string;
  tabIconInactive: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  cardBorder: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  buttonSecondaryBorder: string;
  iconCircleBg: string;
  selectedBg: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  success: string;
  danger: string;
  chartBar: string;
  chartBarGradientEnd: string;
  categoryColors: string[];
  categoryTileBgColors: string[];
};

export const lightTheme: AppTheme = {
  background: "#FDF7F5",
  backgroundSubtle: "#FAF4F2",
  surface: "#FFFFFF",
  surfaceAlt: "#F6E9E4",
  surfaceMuted: "#FAF4F2",
  textPrimary: "#201817",
  textSecondary: "#85736E",
  textTertiary: "#57534E",
  textOnAccent: "#FFFFFF",
  accent: "#804B38",
  accentSoft: "#F5DAD0",
  border: "#D8C1B8",
  divider: "#EFDED8",
  overlay: "rgba(0, 0, 0, 0.35)",
  shadow: "rgba(0, 0, 0, 0.1)",
  tabBar: "#F6E9E4",
  tabIconActive: "#804B38",
  tabIconInactive: "#85736E",
  headerBg: "#804B38",
  headerText: "#FFFFFF",
  cardBg: "#FFFFFF",
  cardBorder: "#EFDED8",
  buttonPrimaryBg: "#804B38",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondaryBg: "transparent",
  buttonSecondaryText: "#804B38",
  buttonSecondaryBorder: "#804B38",
  iconCircleBg: "#F5DAD0",
  selectedBg: "rgba(128, 75, 56, 0.08)",
  inputBg: "#FFFFFF",
  inputBorder: "#EFDED8",
  inputText: "#201817",
  inputPlaceholder: "#85736E",
  success: "#16A34A",
  danger: "#DC2626",
  chartBar: "#96543F",
  chartBarGradientEnd: "#F8AF9A",
  categoryColors: [
    "#F5DAD0",
    "#F0E1A9",
    "#EFDEE8",
    "#E8B4A0",
    "#D4C5A9",
    "#C9B8D0",
    "#F5C4B0",
    "#E8D4A9",
    "#D9C8D8",
  ],
  categoryTileBgColors: [
    "#F5DAD0",
    "#F0E1A9",
    "#EFDED8",
    "#F5DAD0",
    "#F0E1A9",
    "#EFDED8",
    "#F5DAD0",
    "#F0E1A9",
    "#EFDED8",
  ],
};

export const darkTheme: AppTheme = {
  background: "#161312",
  backgroundSubtle: "#1D1918",
  surface: "#221D1B",
  surfaceAlt: "#2B2422",
  surfaceMuted: "#2A211F",
  textPrimary: "#F4EEEB",
  textSecondary: "#C3B4AE",
  textTertiary: "#D7CEC9",
  textOnAccent: "#FFF8F5",
  accent: "#D39A82",
  accentSoft: "#4B352D",
  border: "#5A4A46",
  divider: "#433633",
  overlay: "rgba(0, 0, 0, 0.45)",
  shadow: "rgba(0, 0, 0, 0.35)",
  tabBar: "#221D1B",
  tabIconActive: "#E8B4A0",
  tabIconInactive: "#A9958E",
  headerBg: "#2B2422",
  headerText: "#FDF7F5",
  cardBg: "#221D1B",
  cardBorder: "#433633",
  buttonPrimaryBg: "#D39A82",
  buttonPrimaryText: "#161312",
  buttonSecondaryBg: "transparent",
  buttonSecondaryText: "#D39A82",
  buttonSecondaryBorder: "#D39A82",
  iconCircleBg: "#4B352D",
  selectedBg: "rgba(211, 154, 130, 0.14)",
  inputBg: "#2B2422",
  inputBorder: "#433633",
  inputText: "#F4EEEB",
  inputPlaceholder: "#9E8E88",
  success: "#4ADE80",
  danger: "#F87171",
  chartBar: "#D39A82",
  chartBarGradientEnd: "#8A5B4A",
  categoryColors: [
    "#8F6254",
    "#9A8351",
    "#7C617C",
    "#A56C58",
    "#7D7258",
    "#6B5E7D",
    "#A8715C",
    "#8E7753",
    "#7D687B",
  ],
  categoryTileBgColors: [
    "#4B352D",
    "#51452A",
    "#423532",
    "#4B352D",
    "#51452A",
    "#423532",
    "#4B352D",
    "#51452A",
    "#423532",
  ],
};

export function getTheme(mode: ThemeMode): AppTheme {
  return mode === "dark" ? darkTheme : lightTheme;
}

/**
 * 应用根布局组件
 * 配置全局主题、导航栈和应用启动时的初始化逻辑
 */
import { useAppTheme, AppThemeProvider } from "@/providers/AppThemeProvider";
import { initializeDataFile } from "@/utils/dataManager";
import { Stack } from "expo-router";
import { useEffect } from "react";

function RootStack() {
  const { theme } = useAppTheme();

  // 应用启动时初始化本地数据文件
  useEffect(() => {
    initializeDataFile().catch((error) => {
      console.error("Failed to initialize data file:", error);
    });
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      {/* 主标签页导航 */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* 记账币种设置页面 */}
      <Stack.Screen
        name="set-cur-type"
        options={{
          headerShown: true,
          title: "Bookkeeping Currencies",
          headerStyle: {
            backgroundColor: theme.headerBg,
          },
          headerTintColor: theme.headerText,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      {/* 默认币种设置页面 */}
      <Stack.Screen
        name="set-default-currency"
        options={{
          headerShown: true,
          title: "Default Currency",
          headerStyle: {
            backgroundColor: theme.headerBg,
          },
          headerTintColor: theme.headerText,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootStack />
    </AppThemeProvider>
  );
}

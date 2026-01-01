import { initializeDataFile } from "@/utils/dataManager";
import * as eva from "@eva-design/eva";
import { ApplicationProvider } from "@ui-kitten/components";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // Initialize data file on app startup
    initializeDataFile().catch((error) => {
      console.error("Failed to initialize data file:", error);
    });
  }, []);

  return (
    <ApplicationProvider {...eva} theme={eva.light}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "rgb(253, 247, 245)",
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="test"
          options={{
            headerShown: true,
            title: "Add Transaction",
            headerStyle: {
              backgroundColor: "rgb(128, 75, 56)",
            },
            headerTintColor: "#fff",
          }}
        />
      </Stack>
    </ApplicationProvider>
  );
}

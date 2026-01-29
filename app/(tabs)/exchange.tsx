import { getSettings } from "@/utils/settingsManager";
import {
  ensureExchangeRates,
  getExchangeRateSummary,
  getStoredExchangeRates,
} from "@/utils/exchangeRateManager";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ExchangeTab() {
  const [exchangeRateInfos, setExchangeRateInfos] = useState<
    {
      baseCurrency: string;
      targetCurrency: string;
      startDate: string | null;
      endDate: string | null;
      count: number;
    }[]
  >([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadExchangeRates() {
      try {
        setIsLoadingRates(true);
        setRatesError(null);

        const settings = await getSettings();
        const targetCurrency = settings.defaultCurrencyCode;
        const bookkeepingCurrencies = settings.bookkeepingCurrencyCodes;

        const summaries: {
          baseCurrency: string;
          targetCurrency: string;
          startDate: string | null;
          endDate: string | null;
          count: number;
        }[] = [];

        for (const baseCurrency of bookkeepingCurrencies) {
          await ensureExchangeRates(baseCurrency, targetCurrency);
          const data = await getStoredExchangeRates(
            baseCurrency,
            targetCurrency,
          );
          const summary = getExchangeRateSummary(data);
          if (summary) summaries.push(summary);
        }

        if (mounted) {
          setExchangeRateInfos(summaries);
        }
      } catch (error) {
        console.error("Failed to load exchange rates:", error);
        if (mounted) {
          setRatesError(error instanceof Error ? error.message : "未知错误");
        }
      } finally {
        if (mounted) {
          setIsLoadingRates(false);
        }
      }
    }

    loadExchangeRates();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Exchange Rates</Text>
      <Text style={styles.subtitle}>Exchange rate data summary</Text>

      <View style={{ height: 16 }} />

      <View style={styles.exchangeRateCard}>
        <Text style={styles.cardTitle}>Exchange rates</Text>
        {isLoadingRates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="rgb(128, 75, 56)" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : ratesError ? (
          <Text style={styles.errorText}>Failed: {ratesError}</Text>
        ) : exchangeRateInfos.length > 0 ? (
          <View style={styles.infoContainer}>
            {exchangeRateInfos.map((info, index) => (
              <View
                key={`${info.baseCurrency}-${info.targetCurrency}`}
                style={[
                  styles.currencySection,
                  index > 0 && styles.currencySectionBorder,
                ]}
              >
                <Text style={styles.currencyPairText}>
                  {info.baseCurrency} → {info.targetCurrency}
                </Text>
                {info.baseCurrency === info.targetCurrency ? (
                  <Text style={styles.infoText}>
                    Base currency equals target currency; no conversion needed.
                  </Text>
                ) : info.startDate && info.endDate ? (
                  <>
                    <Text style={styles.infoText}>Start: {info.startDate}</Text>
                    <Text style={styles.infoText}>End: {info.endDate}</Text>
                    <Text style={styles.infoText}>Days: {info.count}</Text>
                  </>
                ) : (
                  <Text style={styles.infoText}>No exchange rate data</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.infoText}>No exchange rate data</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(253, 247, 245)",
  },
  content: {
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
  exchangeRateCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "rgb(133, 115, 110)",
  },
  errorText: {
    fontSize: 14,
    color: "rgb(220, 38, 38)",
  },
  infoContainer: {
    gap: 12,
  },
  currencySection: {
    gap: 6,
  },
  currencySectionBorder: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgb(231, 229, 228)",
  },
  currencyPairText: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "rgb(87, 83, 78)",
    lineHeight: 20,
  },
});

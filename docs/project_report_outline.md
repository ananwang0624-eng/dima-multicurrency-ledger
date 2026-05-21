# DIMA Project 2025 Report

## Contents

## 1. Introduction

### 1.1 Purpose

我一直有着使用记账软件记账的习惯。然而，作为一名来自欧盟外的学生，来到欧盟学习给我的记账习惯带来了一些新的挑战。首先，我现在不仅持有我本国货币的账户，还持有欧元账户，这就需要我同时管理两种货币的收支记录。其次，汇率的波动使得我很难理解我的资金在不同时间点的实际价值变化。最后，我希望能够追踪汇率趋势，以便在需要换汇时做出更明智的决策。

本 App 的目标是为像我一样需要管理多币种收支的用户提供一个简单易用的工具，帮助他们记录交易、查看余额、分析汇率趋势，并更好地理解资金的变化。在普通记账软件的基础上，本软件额外有以下特点。首先，用户可以使用任意币种记账，且该App会统计每种币种的余额。并且，可以在App中设置默认货币，App会告诉用户以默认货币衡量的总余额以及消费分类分析，帮助用户清楚地了解自己的资金状况。此外，App还会分析汇率趋势，提供买入或卖出建议，帮助用户在换汇时做出更明智的决策。

### 1.2 Requirements

The following table contains all the requirements that the application must satisfy.

| Code | Description |
| --- | --- |
| R1 | The user must be able to record an expense transaction. |
| R2 | The user must be able to record an income transaction. |
| R3 | The user must be able to record an exchange transaction involving two currencies. |
| R4 | The user must be able to select the transaction date and time before saving a record. |
| R5 | The user must be able to assign a category to bookkeeping records when recording income or expense transactions. |
| R6 | The user must be able to view transaction records ordered by month on the overview page. |
| R7 | The user must be able to view the current balance of each enabled bookkeeping currency. |
| R8 | The user must be able to configure multiple bookkeeping currencies in the application. |
| R9 | The user must be able to set a default currency used for conversion and statistics. |
| R10 | The user must be able to view category-based statistics for income and expense records converted into the default currency. |
| R11 | The user must be able to retrieve and cache exchange-rate data for enabled bookkeeping currencies. |
| R12 | The user must be able to view exchange-rate trends and historical fluctuations over different time ranges. |
| R13 | The user must be able to receive a buy/sell-oriented exchange suggestion based on recent and historical exchange-rate behaviour. |
| R17 | The application should support both light mode and dark mode for the user interface. |


### 1.3 Features Implemented

#### 1.3.1 Income and Expense Recording

The application allows users to record both expense and income transactions through a dedicated bookkeeping page. For each record, the user can enter an amount, choose a bookkeeping currency, select a category, and optionally provide a short description. The date and time of the transaction can also be adjusted before submission, making the records more suitable for real personal-finance use rather than only immediate-entry scenarios.

The recording flow is designed to remain simple while still capturing the information needed for later balance calculation and statistical analysis. Each saved transaction is stored with a clear type, amount, currency, category, and timestamp, which then becomes available to the overview and statistics pages automatically.

#### 1.3.2 Overview and Balance Summary

The overview page provides a monthly summary of the user’s bookkeeping activity. At the top of the page, the application displays the balance of each enabled bookkeeping currency, allowing the user to quickly understand how much money is currently held in different currencies without manually checking each transaction.

Below the balance summary, the page shows the list of transaction records for the selected month. This combination of aggregated balances and detailed records makes the overview page the main entry point for understanding the current financial situation at a glance.

#### 1.3.3 Exchange Recording

In addition to ordinary income and expense records, the application supports exchange recording between two currencies. This feature is intended for situations in which the user converts money from one currency account to another. The exchange flow allows the user to specify two currency amounts, representing the outgoing and incoming sides of the conversion.

#### 1.3.4 Monthly Transaction History

The application supports month-based browsing of historical records. Through the month and year selector, the user can switch between different periods and inspect the corresponding transactions. This makes it easier to review spending and income activity over time instead of working only with a single continuous timeline.

#### 1.3.5 Statistics and Category Distribution

The statistics page provides category-based analysis for both expenses and income. Users can switch the transaction type and the month being analysed, and the application then aggregates records by category. The result is presented visually through a pie chart and accompanying legends, helping the user identify the main sources of spending or income.

#### 1.3.6 Exchange Rate Analysis and Suggestions

The exchange page extends the application beyond traditional bookkeeping by integrating exchange-rate analysis. For each enabled bookkeeping currency, the app retrieves and caches exchange-rate data relative to the default currency, then displays current rates together with recent historical trends.

The page supports different trend ranges and rating ranges so that users can inspect short-term and longer-term movements. Based on the relative position of the current rate within recent history and on recent momentum, the app also provides a simple buy/sell-oriented suggestion. This feature is particularly useful for users who regularly move funds between currencies and want lightweight decision support inside the same application.

#### 1.3.7 Currency Settings

The settings section allows users to configure the currencies used throughout the application. Users can enable multiple bookkeeping currencies, choose the default currency used for conversion and statistics, and manage how the app interprets and displays financial information across different pages.

## 2. Application Architecture

The application adopts a local-first architecture centred on lightweight mobile interaction, local persistence, settings management, and exchange-rate support. Rather than relying on a traditional backend-driven structure, the project stores bookkeeping data and user preferences on the device while using an external exchange-rate service only where online data is necessary.

Its architecture combines a structured data model, local storage mechanisms, reusable UI components, tab-based navigation, and screen-level business logic for bookkeeping, statistics, exchange analysis, and settings management. These elements work together to provide a consistent user experience while keeping the implementation modular and maintainable.


### 2.1 Data Management

This section describes how data is structured and managed within the application.

#### 2.1.1 Data Model Design

The data model of the application is organised around a small number of focused entities: transaction records, the local bookkeeping file, application settings, and exchange-rate cache entries. This structure reflects the local-first nature of the project, where most business data is stored and processed directly on the device rather than being delegated to a remote backend.

The design emphasises three qualities. First, the model is sufficiently expressive to support multi-currency bookkeeping, exchange recording, statistical aggregation, and exchange-rate analysis. Second, the model remains lightweight enough for direct storage in local JSON files and key-value storage. Third, each data structure is versioned or normalised so that future extensions can be introduced without breaking previously stored data.

#### 2.1.2 Transaction Record Model

The fundamental business entity is the transaction record. Each record stores a unique identifier, a positive numeric amount, a currency code, a category identifier, a timestamp, an optional description, and a type indicating whether the record is an income or an expense. This model is used consistently across overview rendering, balance calculation, statistical aggregation, and exchange recording.

Validation rules are applied before a record is accepted into storage. The implementation verifies that the identifier is present, the amount is finite and greater than zero, the currency code is supported, the category index falls within the permitted range, the date matches a valid ISO 8601 / RFC 3339 format, and the type is one of the supported bookkeeping directions. These constraints ensure that downstream features can rely on a stable and consistent transaction format.

#### 2.1.3 Bookkeeping File Model

All bookkeeping records are stored inside a local JSON file represented by a versioned bookkeeping-file model. In its current form, the file contains three main fields: a schema version, a `transactionsByMonth` object, and a `balances` object. The `transactionsByMonth` structure groups records by `YYYY-MM`, which makes month-based retrieval straightforward and aligns naturally with the overview and statistics pages. The `balances` structure stores the current balance of each supported currency as a direct mapping from currency code to numeric value.

This file model supports both operational efficiency and recoverability. When transactions are added, the corresponding monthly group is updated and kept in descending chronological order. At the same time, balances can either be updated incrementally or recomputed from the stored transaction history. The model also includes normalisation logic that upgrades legacy version-1 data into the current version-2 structure, ensuring backward compatibility for previously stored files.

#### 2.1.4 Settings Model

Application preferences are represented through a compact settings model stored separately from bookkeeping records. The settings object includes a schema version, the default currency code used for conversion and statistics, the currently selected bookkeeping currency, the list of enabled bookkeeping currencies, and the selected theme mode. These fields allow the rest of the application to adapt its behaviour and presentation without modifying transactional data.

The settings model is normalised before use so that invalid or duplicated currency codes are removed and at least one valid bookkeeping currency always remains available. This prevents inconsistent application states and ensures that features such as transaction entry, statistics conversion, and dark-mode toggling always operate on valid configuration data.

#### 2.1.5 Exchange Rate Cache Model

Exchange-rate information is stored through a dedicated cache model designed for lightweight historical analysis. Each cache entry records the base currency, the target currency, a mapping from date strings to exchange rates, the last update timestamp, and the date of the most recent refresh attempt. The date-to-rate mapping uses the `YYYY-MM-DD` format, which makes it suitable for both direct lookup and historical trend calculations.

This cache model supports the analytical features of the exchange and statistics pages without requiring constant network access. Historical rates can be reused for monthly and yearly comparisons, category conversion into the default currency, and the calculation of short-term and long-term fluctuation indicators. Because the cache is stored locally and updated incrementally, the application can provide responsive behaviour even when network availability is limited.

### 2.2 Local Storage Implementation

#### 2.2.1 Expo File System Storage

The main bookkeeping dataset is stored through `expo-file-system` in a local JSON file located in the application documents directory. This approach is well suited to the project because the bookkeeping file contains structured transactional data that benefits from being stored as a single versioned document rather than as multiple unrelated key-value entries. The file stores month-grouped transactions together with per-currency balances, making it possible to reconstruct the state of the bookkeeping system directly from the local file.

Using file-based storage also keeps the data model explicit and inspectable during development. Reads and writes are performed through the data manager, which acts as the single persistence boundary for transaction insertion, monthly retrieval, balance queries, seeding, and reset operations. This keeps the rest of the application independent from direct file access and concentrates persistence logic in one place.

#### 2.2.2 AsyncStorage

`AsyncStorage` is used for lightweight configuration and cache-oriented data that does not need to be part of the main bookkeeping file. In the current implementation, it stores application settings such as the default currency, enabled bookkeeping currencies, and theme mode. It is also used to persist exchange-rate cache entries for currency pairs, since these entries are naturally independent and can be updated separately from transactional bookkeeping data.

This separation between file storage and key-value storage matches the different lifecycles of the stored information. Transaction and balance data form the durable financial core of the application, while settings and exchange-rate cache entries are smaller pieces of state that are read and updated independently. The result is a persistence strategy that is both simple and aligned with the responsibilities of each data category.

#### 2.2.3 Data Initialization and Migration

At application startup, the local bookkeeping file is initialised automatically if it does not yet exist. A default version-2 file is created with an empty `transactionsByMonth` structure and zeroed balances for all supported currencies. This ensures that all screens can assume the existence of a valid local data file from the beginning of the application lifecycle.

Migration and normalisation logic are also applied when existing data is loaded. Legacy version-1 bookkeeping data is upgraded into the current version-2 format, and stored settings are normalised so that invalid currencies, duplicated entries, or incomplete values are corrected before being used. Similar normalisation is applied to exchange-rate data at retrieval time. This migration strategy reduces the risk of runtime inconsistencies and allows the storage schema to evolve without invalidating previously saved user data.

### 2.3 External Services

#### 2.3.1 Frankfurter Exchange Rate API

The only external online service used by the application is the Frankfurter exchange-rate API. It is responsible for providing historical and up-to-date currency conversion data used by the exchange page and the statistics module. The API is particularly suitable for the project because it is free to use, does not require an API key, and supports historical time-series queries, which are essential for trend calculation and rate-position analysis.

The application queries Frankfurter with a bookkeeping currency as the base currency and the selected default currency as the target currency. The returned results are converted into a local date-to-rate mapping that can later be reused for both visualisation and numerical analysis inside the app.

#### 2.3.2 API Caching Strategy

Exchange-rate retrieval follows a cache-first strategy. When the application needs exchange-rate data, it first checks locally stored entries in `AsyncStorage`. Cached results are used immediately when available so that the user interface can render without unnecessary waiting or visual flicker. After that, the application performs a background refresh to fetch any missing or newer data from the API.

The cache keeps approximately one year of rate history for each currency pair. This range is sufficient for the implemented monthly and yearly rating logic, daily/weekly/monthly fluctuation analysis, and default-currency conversion for historical bookkeeping records. Because only missing dates are requested when possible, the implementation avoids repeated full downloads and keeps network usage limited.

#### 2.3.3 Network Failure Handling

Network-dependent operations are isolated to the exchange-rate subsystem, and failures are handled defensively. If the API request fails, previously cached data can still be displayed when available, allowing the exchange page and statistics page to remain partially functional instead of failing completely. Error states are surfaced to the user through screen-level messages when fresh data cannot be loaded.

This behaviour is important for a local-first application, since bookkeeping itself should not depend on continuous connectivity. Users can continue recording transactions, viewing balances, and browsing stored history even when exchange-rate refreshes fail temporarily. In this way, online exchange support enhances the application without becoming a hard dependency for the core bookkeeping workflow.

### 2.4 Dependencies

The project is built on the Expo and React Native ecosystem. Core application structure and navigation rely on `expo`, `react`, `react-native`, and `expo-router`, while tab navigation behaviour is supported by the React Navigation packages. Local persistence depends primarily on `expo-file-system` for bookkeeping data and `@react-native-async-storage/async-storage` for settings and cached exchange-rate entries.

Several additional libraries support user-facing features and implementation quality. `expo-crypto` is used for UUID generation, `react-native-svg` and the SVG transformer support icon assets, and `react-native-gifted-charts` is used for statistical and exchange-rate chart rendering. On the development side, TypeScript provides static typing, while Jest and React Native Testing Library support the automated unit, component, and integration tests described later in the report.

### 2.5 Component Architecture

#### 2.5.1 Layout and Navigation Components

The overall screen structure is organised through Expo Router layouts. The root layout is responsible for global application initialisation and shared navigation behaviour, while the tab layout defines the main bottom-tab navigation used for the Overview, Bookkeeping, Statistics, Exchange, and Settings pages. This arrangement separates app-wide concerns from tab-specific structure and keeps the navigation hierarchy easy to understand.

Within the screen content itself, lightweight layout-oriented components are used to organise visual sections and repeated navigation affordances. For example, settings-related navigation entries are encapsulated in reusable submenu buttons rather than being rebuilt manually on each screen.

#### 2.5.2 Input Components

Input-oriented components are responsible for collecting the main data required during bookkeeping. `CurrencyAmountInput` combines currency selection with numeric amount entry, while text input areas on the bookkeeping page capture optional transaction descriptions. These components are designed to keep data entry compact and mobile-friendly, especially on the screen where users most frequently interact with the app.

The input layer focuses on combining usability with controlled state updates. Rather than allowing each screen to reimplement formatting and interaction logic independently, input components encapsulate details such as placeholder handling, numeric entry behaviour, and currency selection integration.

#### 2.5.3 Picker Components

Picker components are used extensively throughout the application to represent small but important domain choices. `MonthYearPicker` supports month-based history browsing, `DateTimePicker` allows explicit transaction time selection, `OptionPicker` is used for exchange-page range selection, and `TransactionTypeSelector` supports switching between income and expense statistics. Together, these components form a reusable picker layer shared across multiple screens.

Their common design language helps maintain consistency in both interaction and appearance. Each picker exposes a focused selection task while encapsulating modal display, wheel-style selection behaviour, and controlled callbacks to the parent screen.

#### 2.5.4 Chart Components

Chart-related components provide the visual analytics layer of the project. `ExpenseCategoryPieChart` aggregates transaction values into category-based proportions after conversion into the default currency, while `ExchangeRateCard` and its internal bar chart visualisation summarise rate movement and current recommendation state. These components turn stored bookkeeping and exchange-rate data into information that can be interpreted quickly by the user.

The chart layer is intentionally separated from page logic so that data preparation and data presentation remain distinct. Screens are responsible for supplying already selected or aggregated data, while the chart components focus on rendering, legends, totals, and contextual visual cues.

#### 2.5.5 List Item Components

List-item components encapsulate the rendering of repeated records and summaries. The most representative example is `TransactionRecordItem`, which displays the category icon, description, timestamp, and signed amount for each transaction shown on the overview page. By isolating this repeated visual unit, the application keeps monthly transaction rendering clear and easier to maintain.

This category of components is important because lists appear frequently in bookkeeping interfaces. A dedicated list-item layer reduces duplication and ensures that spacing, colour usage, icon handling, and signed amount formatting remain consistent across repeated records.

#### 2.5.6 Settings Components

Settings-related components support configuration flows that are separate from transaction entry and analytics. `SubmenuNavButton` provides reusable navigation entries into configuration screens, while the settings pages themselves use shared design patterns to manage currency configuration, default-currency selection, and theme control. These components make the settings area feel structurally coherent even though it manages several different kinds of application preferences.

Together, the component architecture reflects a clear separation between pages and reusable building blocks. Screen files orchestrate data loading, state coordination, and business rules, while components encapsulate the visual and interactive structures that are reused across the application. This organisation improves readability, simplifies testing, and supports incremental extension of the codebase.


### 2.6 Main User Flows

#### 2.6.1 Add Expense Flow

#### 2.6.2 Add Income Flow

#### 2.6.3 Add Exchange Flow

#### 2.6.4 View Monthly Records Flow

#### 2.6.5 Configure Currencies Flow

#### 2.6.6 Load Exchange Rates Flow

## 3. User Interface

### 3.1 Navigation

### 3.2 UI Design Choices

### 3.3 Smartphone UI

#### 3.3.1 Overview Page

#### 3.3.2 Bookkeeping Page

#### 3.3.3 Statistics Page

#### 3.3.4 Exchange Page

#### 3.3.5 Settings Page

#### 3.3.6 Bookkeeping Currency Settings Page

#### 3.3.7 Default Currency Settings Page


## 4. Testing

### 4.1 Testing Campaign

### 4.2 Unit Tests

Unit testing was implemented to verify the correctness of the project’s core logic in isolation from the user interface and external services. For this application, the most important unit-test targets are the data management utilities, settings normalization logic, exchange-rate analysis functions, and smaller helper functions that support date formatting, monthly grouping, and numeric processing. The goal of these tests is to ensure that critical bookkeeping and exchange-rate calculations behave correctly for both normal inputs and edge cases such as empty data, invalid records, unsupported currencies, and insufficient historical rate samples.

The implemented unit-test set is summarised below.

| Module / Helper | Description | Implemented Unit Tests |
| --- | --- | --- |
| `dataManager` | Manages transaction records, balances, file normalization, and month-based grouping. | UT1: test `validateTransactionRecord()` accepts a valid record and rejects a record with invalid amount or currency. UT2: test `computeBalances()` calculates correct signed balances for mixed income and expense records. UT3: test `normalizeBookkeepingFile()` migrates legacy v1 data into the v2 structure with balances restored from transaction history. |
| `settingsManager` | Stores and normalizes default currency and enabled bookkeeping currencies. | UT1: test `normalizeSettings()` returns defaults for empty or invalid input. UT2: test `normalizeSettings()` removes duplicate or unsupported currency codes and keeps at least one valid bookkeeping currency. UT3: test `removeBookkeepingCurrencyCode()` does not remove the final remaining currency. |
| `exchangeRateManager` | Fetches, caches, and analyses exchange-rate history for trend and level suggestions. | UT1: test `getDailyFluctuationPercentage()` returns the correct one-day percentage change and `null` when insufficient data exists. UT2: test `getMonthlyRateLevel()` maps low and high current rates to appropriate rating bands. UT3: test `getMonthlyRateLevel()` and `getYearlyRateLevel()` apply momentum correction when a strong trend should soften a buy or sell recommendation. |
| Helper functions | Small pure helpers used to support formatting and deterministic data processing. | UT1: test `getYearMonthKey()` extracts the correct `YYYY-MM` key from a valid date string. UT2: test amount-formatting helpers preserve two decimal places. |

In total, 11 unit tests were implemented across these four areas. The completed test suite verifies transaction validation, month-based transaction grouping, balance computation, settings normalization, exchange-rate fluctuation formulas, and the five-level buy/sell rating logic used by the exchange screen. All implemented unit tests passed successfully, providing a reliable foundation for the rest of the application and supporting the later addition of component-level and integration-level testing.

The unit tests were organised into three test files. Helper-function tests were grouped inside `dataManager.test.ts` rather than being placed in a separate file:

- `dataManager.test.ts`: 5 tests covering record validation, signed balance calculation, legacy file migration, year-month key extraction, and two-decimal numeric rounding.
- `settingsManager.test.ts`: 3 tests covering default settings recovery, duplicate and invalid currency filtering, and the protection against removing the final bookkeeping currency.
- `exchangeRateManager.test.ts`: 3 tests covering daily fluctuation calculation, monthly rating-band mapping, and momentum-based correction for monthly and yearly exchange suggestions.


### 4.3 Component Tests

Component testing was implemented to assess the behaviour of the reusable UI building blocks that support the bookkeeping, statistics, and exchange flows of the application. The focus was placed on two complementary aspects: correct rendering of the component state and correct interaction handling when the user presses, scrolls, types, or changes selections. Since this project relies heavily on custom pickers, input controls, list items, and chart wrappers, component tests are particularly important for ensuring consistency and usability across different screens.

The implemented component-test coverage is summarised below.

| Folder / Group | Component | Implemented Test Cases |
| --- | --- | --- |
| input | `CurrencyAmountInput` | CT1: Correct rendering of currency symbol and amount placeholder. CT2: Correct rendering of an initial amount value and update of the amount callback. CT3: Correct interaction with the currency picker and currency change callback. |
| picker | `MonthYearPicker` | CT1: Correct rendering of the selected year and month. CT2: Correct opening of the month wheel picker and callback invocation after a new month is selected. |
| list item | `TransactionRecordItem` | CT1: Correct rendering of description, time, and signed amount. CT2: Correct fallback rendering when description is empty. CT3: Correct interaction behaviour when the component is pressable. |
| chart | `ExpenseCategoryPieChart` | CT1: Correct empty-state rendering when no matching transaction data exists. CT2: Correct rendering of total amount and legend rows after multi-currency conversion. |
| chart | `ExchangeRateCard` | CT1: Correct rendering of currency pair, current rate, fluctuation text, and chart. CT2: Correct rendering of the insufficient-data state without fluctuation text. |

In total, 12 component tests were implemented across these five reusable components. The completed test suite verifies UI rendering, placeholder and fallback behaviour, modal-based selection interaction, signed amount display, multi-currency chart rendering, and exchange-card state presentation. All implemented component tests passed successfully, providing confidence that the application’s most frequently reused UI building blocks behave correctly in isolation.

The component tests were organised into five dedicated test files:

- `CurrencyAmountInput.test.tsx`: 3 tests covering placeholder rendering, initial value rendering, amount-change callback behaviour, and currency-selection interaction.
- `MonthYearPicker.test.tsx`: 2 tests covering initial rendering and month-selection callback behaviour through the wheel-style picker.
- `TransactionRecordItem.test.tsx`: 3 tests covering record rendering, category-label fallback, and optional press interaction.
- `ExpenseCategoryPieChart.test.tsx`: 2 tests covering the empty state and the rendering of converted totals and category legends.
- `ExchangeRateCard.test.tsx`: 2 tests covering full rate-card rendering and the insufficient-data display state.

### 4.4 Integration Tests

Integration testing was implemented to verify that complete user flows behave correctly when data management, settings updates, local persistence, navigation, and screen-level rendering are combined. For this bookkeeping application, the integration tests focus on three dimensions: correct rendering of data and components, correct user interaction behaviour, and correct navigation between related screens.

The implemented integration-test coverage is summarised below.

| Section | Page / Flow | Test Suite | Implemented Test Cases |
| --- | --- | --- | --- |
| overview | `index` | Render | IT1: Correct loading of the balance-summary section and transaction list on mount. IT2: Correct rendering of the empty state when the selected month has no records. |
| overview | `index` | Interaction | IT1: Correct refresh of the overview screen after the selected month changes. IT2: Correct refresh of the overview screen after a data-change subscription event is triggered. |
| exchange | `exchange` | Render | IT1: Correct rendering of cached exchange-rate output after settings and local cache are loaded. IT2: Correct error-state rendering when exchange-rate loading fails. |
| exchange | `exchange` | Interaction | IT1: Correct refresh of trend and rating output after the user changes the trend range and rating range. |
| settings | `settings` | Navigation | IT1: Correct navigation from the settings tab to the bookkeeping currency configuration page. IT2: Correct navigation from the settings tab to the default currency configuration page. |
| settings | `settings` | Interaction | IT1: Correct triggering of “Clear All Records”. IT2: Correct triggering of “Generate Fixed Test Data”. |
| settings | default currency flow | Integration | IT1: Correct update flow when the user selects a new default currency from the default-currency configuration screen. |

In total, 9 integration tests were implemented across three screen-level test files. The completed integration-test suite verifies overview rendering and refresh behaviour, exchange-rate screen loading and range switching, settings-page navigation, data-management actions, and the default-currency update flow. All implemented integration tests passed successfully, providing evidence that the application’s core screen-level workflows behave correctly when multiple modules and components work together.

The integration tests were organised into three dedicated test files:

- `HomeTab.integration.test.tsx`: 3 tests covering initial overview rendering, empty-state rendering, and refresh behaviour after month changes and data-change events.
- `ExchangeTab.integration.test.tsx`: 3 tests covering cached exchange-rate rendering, error-state rendering, and output refresh after trend-range and rating-range changes.
- `SettingsFlow.integration.test.tsx`: 3 tests covering settings-page navigation, settings-page data-management actions, and the default-currency update flow.

## 5. Limitations and Future Work

### 5.1 Current Limitations

### 5.2 Planned Improvements

### 5.3 Possible Device-Specific Features

### 5.4 Possible Backend or Cloud Synchronization

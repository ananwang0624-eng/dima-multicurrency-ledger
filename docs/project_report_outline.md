# DIMA Project 2025 Report

## Contents

## 1. Introduction

### 1.1 Purpose

I have long had the habit of using bookkeeping software to track my finances. However, as a student from outside the European Union who came to study in the EU, I encountered several new challenges in the way I manage money. First, I now hold both an account in my home currency and a euro account, which means I need to manage income and expenses across multiple currencies at the same time. Second, exchange-rate fluctuations make it difficult to understand the real value of my funds at different points in time. Finally, I also want to track exchange-rate trends so that I can make more informed decisions when I need to convert money.

The goal of this app is to provide a simple and practical tool for users like me who need to manage multi-currency income and expenses. It helps users record transactions, view balances, analyse exchange-rate trends, and better understand how their funds change over time. Compared with an ordinary bookkeeping app, this project includes several additional features. Users can record transactions in different currencies, and the app keeps track of the balance of each enabled bookkeeping currency. Users can also set a default currency, allowing the app to display the overall total balance and category-based statistics in that currency, which makes the financial situation easier to understand. In addition, the app analyses exchange-rate trends and provides simple buy or sell suggestions to support more informed currency-exchange decisions.

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
| R14 | The user must be able to delete an individual bookkeeping record from the overview page. |
| R17 | The application should support both light mode and dark mode for the user interface. |


### 1.3 Features Implemented

#### 1.3.1 Income and Expense Recording

The application allows users to record both expense and income transactions through a dedicated bookkeeping page. For each record, the user can enter an amount, choose a bookkeeping currency, select a category, and optionally provide a short description. The date and time of the transaction can also be adjusted before submission, making the records more suitable for real personal-finance use rather than only immediate-entry scenarios.

The recording flow is designed to remain simple while still capturing the information needed for later balance calculation and statistical analysis. Each saved transaction is stored with a clear type, amount, currency, category, and timestamp, which then becomes available to the overview and statistics pages automatically.

#### 1.3.2 Exchange Recording

In addition to ordinary income and expense records, the application supports exchange recording between two currencies. This feature is intended for situations in which the user converts money from one currency account to another. The exchange flow allows the user to specify two currency amounts, representing the outgoing and incoming sides of the conversion.

#### 1.3.3 Overview and Balance Summary

The overview page provides a monthly summary of the user’s bookkeeping activity. At the top of the page, the application displays the balance of each enabled bookkeeping currency, allowing the user to quickly understand how much money is currently held in different currencies without manually checking each transaction. In addition, the balance card includes a final `TOTAL` row that converts all enabled bookkeeping balances into the selected default currency and presents an overall combined balance.

Below the balance summary, the page shows the list of transaction records for the selected month. Each record can be pressed to open a delete confirmation, allowing the user to remove an individual bookkeeping entry directly from the overview screen. After deletion, both the record list and the balance summary refresh immediately. This combination of aggregated balances and detailed records makes the overview page the main entry point for understanding the current financial situation at a glance.



#### 1.3.4 Monthly Transaction History

The application supports month-based browsing of historical records. Through the month and year selector, the user can switch between different periods and inspect the corresponding transactions. This makes it easier to review spending and income activity over time instead of working only with a single continuous timeline.

#### 1.3.5 Statistics and Category Distribution

The statistics page provides category-based analysis for both expenses and income. Users can switch the transaction type and the month being analysed, and the application then aggregates records by category. The result is presented visually through a pie chart and accompanying legends, helping the user identify the main sources of spending or income.

#### 1.3.6 Exchange Rate Analysis and Suggestions

The exchange page extends the application beyond traditional bookkeeping by integrating exchange-rate analysis. For each enabled bookkeeping currency, the app retrieves and caches exchange-rate data relative to the default currency, then displays current rates together with recent historical trends.

The page supports different trend ranges and rating ranges so that users can inspect short-term and longer-term movements. Based on the relative position of the current rate within recent history and on recent momentum, the app also provides a simple buy/sell-oriented suggestion. This feature is particularly useful for users who regularly move funds between currencies and want lightweight decision support inside the same application.

The suggestion logic is implemented as a five-level rating. First, the current exchange rate is located within a historical window and converted into a level from 1 to 5:

\[
\text{level} = \left\lceil \frac{\text{pos}}{n} \times 5 \right\rceil
\]

where \(n\) is the number of historical rate samples in the selected window and \(\text{pos}\) is the position of the latest rate in the ascendingly sorted rate list. A lower level means the current rate is relatively low in the recent range, which is interpreted as a better buy opportunity, while a higher level means the current rate is relatively high, which is interpreted as a better sell opportunity. In the implementation, the monthly rating uses roughly the past 30 days of data, while the yearly rating uses roughly the past 365 days.

To avoid overly aggressive suggestions, the rating is then adjusted by momentum. For the monthly rating, the weekly fluctuation percentage is computed as:

\[
\text{weekly fluctuation} =
\frac{\text{currentWeekAvg} - \text{prevWeekAvg}}{\text{prevWeekAvg}} \times 100
\]

using the latest 5 trading days versus the previous 5 trading days. For the yearly rating, the monthly fluctuation percentage is computed similarly:

\[
\text{monthly fluctuation} =
\frac{\text{currentMonthAvg} - \text{prevMonthAvg}}{\text{prevMonthAvg}} \times 100
\]

using the latest 22 trading days versus the previous 22 trading days. If the current rate appears low but the momentum is still significantly negative, the app weakens the buy suggestion by moving the level closer to the neutral middle band. Conversely, if the current rate appears high but momentum is still significantly positive, the app weakens the sell suggestion in the same way. 
#### 1.3.7 Currency Settings

The settings section allows users to configure the currencies used throughout the application. Users can enable multiple bookkeeping currencies, choose the default currency used for conversion and statistics, and manage how the app interprets and displays financial information across different pages.

## 2. Application Architecture

The application has been designed as a local-first mobile app. Most of the business logic,
state handling, and persistence are managed directly on the client side, while online access is
used only for exchange-rate retrieval. This design fits the nature of the project well: bookkeeping
records, balances, and user preferences should remain available even without continuous network
connectivity.

The architecture combines local JSON storage, key-value persistence, reusable React Native
components, tab-based navigation, and a lightweight exchange-rate integration. This approach
keeps the system relatively simple while still supporting multi-currency bookkeeping, category
statistics, exchange analysis, and settings management.


### 2.1 Data Management

This section describes how data is structured and managed within the application.

#### 2.1.1 Data Model Design

The data model is organised around a small set of entities: transaction records, the local
bookkeeping file, application settings, and exchange-rate cache entries. Since the app does not
rely on a traditional backend, these structures are designed to work efficiently with local storage
while still supporting the main use cases of the project.

The chosen model follows a usage-driven approach. Transactions must be easy to insert and read
by month, balances must be easy to compute and display, settings must be easy to update
independently from bookkeeping data, and exchange-rate history must be reusable for both
statistics and suggestion logic. For this reason, the data is split into separate structures instead
of being stored as one large undifferentiated state object.

#### 2.1.2 Transaction Record Model

The transaction record is the core entity of the application. Each record contains a unique
identifier, a positive amount, a currency code, a category identifier, a date-time string, an
optional description, and a type indicating whether the record is an income or an expense.
This same structure is used across record creation, overview rendering, balance calculation,
statistical aggregation, deletion handling, and exchange handling.

Before a transaction is accepted into storage, it is validated. The implementation checks that
the identifier is present, the amount is finite and strictly positive, the currency code is supported,
the category index is valid, the timestamp follows the ISO 8601 / RFC 3339 format, and the
type is either `income` or `expense`. This keeps the record format stable and reduces the risk of
inconsistent bookkeeping data entering the system.

#### 2.1.3 Bookkeeping File Model

All bookkeeping data is stored inside a versioned JSON file. In the current implementation, the
file contains a version number, a `transactionsByMonth` object, and a `balances` object. The
`transactionsByMonth` field groups transactions under `YYYY-MM` keys, while the `balances`
field stores the current numeric balance of each supported currency.

This structure was chosen because the app works primarily with monthly record browsing and
currency-level balance summaries. Grouping data by month makes it efficient to retrieve the
records needed by the overview and statistics pages, while storing balances separately avoids
having to recompute them every time the user opens the app. At the same time, the file can still
be normalised and rebuilt from transaction history when needed.

#### 2.1.4 Settings Model

The settings model is stored separately from transaction data. It contains the schema version,
the default currency code, the currently selected bookkeeping currency, the list of enabled
bookkeeping currencies, and the theme mode. These values influence how transactions are
entered, converted, displayed, and analysed, but they do not change the bookkeeping records
themselves.

Before the settings are used, they are normalised. Unsupported currencies are removed,
duplicates are filtered out, and at least one valid bookkeeping currency is always preserved.
This prevents invalid configuration states and allows the rest of the application to assume that
the active settings are always usable.

#### 2.1.5 Exchange Rate Cache Model

Exchange-rate data is stored in a dedicated cache model. Each cache entry contains the base
currency, the target currency, a mapping from `YYYY-MM-DD` dates to numeric rates, the last
update timestamp, and the date of the latest refresh attempt. This structure is simple enough to
store locally, but also expressive enough for historical conversion and trend analysis.

The cache model is used by the overview page, the statistics page, and the exchange page. It
allows the application to reuse previously fetched rate data for default-currency conversion,
monthly and yearly comparisons, buy/sell-oriented suggestion logic, and the total-balance
summary shown on the overview screen. Because the data is cached locally, the app remains
responsive even when fresh network data is temporarily unavailable.

### 2.2 Local Storage Implementation

#### 2.2.1 Expo File System Storage

The main bookkeeping dataset is stored using `expo-file-system`. The application creates a
JSON file inside the documents directory and uses it as the primary persistence layer for
transactions and balances. This solution works well because the bookkeeping state is naturally
structured as a versioned document rather than as a set of unrelated key-value entries.

All file operations are concentrated in the data manager. Transaction insertion, deletion, monthly
reads, balance reads, file initialisation, and reset operations all go through this layer. This keeps file
handling isolated from the screen components and gives the application a single persistence
boundary for the core bookkeeping data.

#### 2.2.2 AsyncStorage

`AsyncStorage` is used for lightweight configuration and cache data. In this project, it stores
application settings such as the default currency, enabled bookkeeping currencies, and theme
mode. It is also used to persist exchange-rate cache entries, since those entries are naturally
independent and do not need to be embedded into the main bookkeeping file.

This separation was chosen deliberately. Transaction and balance data represent the financial
core of the app and are therefore stored as a versioned file, while settings and exchange-rate
cache entries are smaller units of state that are read and updated independently. This gives the
project a simple but well-structured persistence strategy.

#### 2.2.3 Data Initialization and Migration

When the application starts, it checks whether the bookkeeping file already exists. If not, a
default bookkeeping file is created with empty monthly records and zero balances for all supported
currencies. This guarantees that the rest of the application can safely assume the presence of a
valid local bookkeeping file.

Normalisation is also part of the persistence layer. Before the stored data is used, the
application checks that the bookkeeping data and settings remain in a valid and usable form.
This helps the rest of the application work with consistent local data and reduces the risk of
invalid configuration affecting normal usage.

### 2.3 External Services

#### 2.3.1 Frankfurter Exchange Rate API

The application uses the Frankfurter exchange-rate API to retrieve currency conversion data.
This service is used only for the parts of the app that require online financial information, namely
historical conversion, rate comparison, and exchange analysis. Frankfurter was chosen because it
is free, does not require an API key, and supports historical time-series requests.

The app requests rates by specifying one bookkeeping currency as the base currency and the
selected default currency as the target currency. The returned data is then transformed into a
local date-to-rate mapping that can be reused across the exchange and statistics modules.

#### 2.3.2 API Caching Strategy

Exchange-rate retrieval follows a cache-first strategy. When the app needs rate data, it first
checks `AsyncStorage` for a previously saved entry. If cached data is available, it is used
immediately so that the interface can render without unnecessary waiting. After that, the app
attempts to refresh the data in the background.

The cache keeps about one year of history for each currency pair. This is enough to support the
implemented monthly and yearly rating logic, daily/weekly/monthly fluctuation analysis,
historical conversion in the statistics page, and default-currency total conversion on the
overview page. Because only missing or outdated data needs to be fetched, the number of API
requests remains limited.

#### 2.3.3 Network Failure Handling

Network failure handling is isolated to the exchange-rate subsystem. If an API request fails, the
application can still fall back to previously cached data when such data exists. This allows the
exchange page and statistics page to remain usable instead of failing completely.

This behaviour is especially important in a local-first application. Core bookkeeping operations,
such as entering transactions, reading balances, and browsing history, should continue to work
even without network connectivity. Exchange-rate access is therefore treated as an enhancement
to the local experience rather than as a strict requirement for the whole app.

### 2.4 Dependencies

The application is developed with React Native and Expo, which provide the core runtime,
cross-platform support, and development workflow. A small number of additional dependencies
are used to support navigation, persistence, visualisation, theming, and testing. The main
dependencies are listed below:

- `expo` — Provides the managed development workflow and access to a large set of mobile APIs.
- `react-native` — Supplies the core mobile framework used to build the application interface and logic.
- `react` — Powers the component-based rendering model and state-driven UI updates.
- `expo-router` — Implements file-based routing and the main navigation structure of the application.
- `@react-navigation/native` and `@react-navigation/bottom-tabs` — Support navigation state and tab-based interaction.
- `expo-file-system` — Stores the main bookkeeping JSON file on the device.
- `@react-native-async-storage/async-storage` — Stores settings and exchange-rate cache entries.
- `expo-crypto` — Generates UUID values for transaction records.
- `react-native-svg` and `react-native-svg-transformer` — Support SVG-based icon assets.
- `react-native-gifted-charts` — Provides chart components for statistical and exchange-rate visualisation.
- `typescript` — Adds static typing to improve correctness and maintainability.
- `jest`, `jest-expo`, and `@testing-library/react-native` — Support the automated testing strategy used in the project.

### 2.5 Component Architecture

#### 2.5.1 Layout and Navigation Components

The main screen structure is organised through Expo Router layouts. The root layout handles
application initialisation and shared navigation behaviour, while the tab layout defines the five
main pages of the app: Overview, Bookkeeping, Statistics, Exchange, and Settings.

This structure separates global navigation concerns from screen-specific content. In addition,
small reusable layout-oriented elements, such as settings navigation buttons, are encapsulated as
components so that repeated structures do not need to be rebuilt manually on each page.

#### 2.5.2 Input Components

Input components are used mainly on the bookkeeping page, where the user enters the details of
new records. The most important input element is `CurrencyAmountInput`, which combines
currency selection and amount entry in a single compact control. Additional text input is used for
optional record descriptions.

The goal of this layer is to keep data entry concise and consistent. Instead of implementing the
same formatting and interaction logic directly inside screens, these behaviours are encapsulated
inside reusable input components.

#### 2.5.3 Picker Components

Picker components are used throughout the app to represent small but important domain
selections. `MonthYearPicker` is used for monthly browsing, `DateTimePicker` is used during
transaction entry, `OptionPicker` is used on the exchange page, and `TransactionTypeSelector`
is used on the statistics page.

These components follow a common interaction pattern based on modal selection and controlled
callbacks. This gives the application a more coherent interaction style and avoids duplicating
selection logic across different screens.

#### 2.5.4 Chart Components

Chart components provide the visual analysis layer of the application. `ExpenseCategoryPieChart`
shows category-level distributions after conversion into the default currency, while
`ExchangeRateCard` and the related bar-chart visualisation summarise exchange-rate history,
trend direction, and suggestion level.

This part of the architecture separates data preparation from data presentation. Screens prepare
the relevant records or rate history, and the chart components focus on visual rendering, totals,
legends, and compact analytical feedback.

#### 2.5.5 Balance Summary Components

Balance-summary components provide a compact overview of the user’s current multi-currency
position. `BalanceSummaryCard` renders one row per enabled bookkeeping currency and also
renders a final `TOTAL` row in the default currency by combining cached exchange-rate data
with the locally stored per-currency balances.

This component is intentionally separate from the transaction list because it combines two
different kinds of state: persisted balance totals from the bookkeeping file and conversion
metadata from settings and exchange-rate cache entries. Encapsulating that logic keeps the
overview screen itself simpler and makes the summary behaviour easier to test in isolation.

#### 2.5.6 List Item Components

List-item components encapsulate repeated visual units that appear in transaction browsing and
settings navigation. The clearest example is `TransactionRecordItem`, which renders the icon,
description, timestamp, and signed amount for each bookkeeping record shown on the overview
page. On the overview screen, these items are also used as the interaction entry point for
record-level deletion.

This separation is useful because bookkeeping interfaces often display many repeated entries.
A dedicated list-item layer reduces duplication and keeps spacing, formatting, and visual
structure consistent across the application.

#### 2.5.7 Settings Components

Settings-related components support configuration flows that are separate from transaction entry
and data analysis. `SubmenuNavButton` is used to provide reusable entries into the currency
configuration screens, while the settings pages themselves reuse the same visual and interaction
patterns for preference-oriented tasks.

Overall, the component architecture separates screen-level orchestration from reusable building
blocks. Screens manage state, data loading, and business rules, while components encapsulate
the visual and interactive structures that appear repeatedly throughout the application. This
organisation keeps the codebase easier to read, test, and extend.


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

To improve confidence in the correctness and reliability of the application, a structured automated testing campaign was designed and carried out. Since the project combines local bookkeeping persistence, multi-currency balance handling, exchange-rate analysis, and interactive mobile user-interface behaviour, testing was necessary not only to confirm expected outputs in normal cases but also to reduce the risk of regressions when features were added or modified.

The testing campaign was organised into three complementary levels: unit tests, component tests, and integration tests. Unit tests were used to verify isolated logic such as transaction validation, balance computation, settings normalization, and exchange-rate formulas. Component tests were used to check the rendering and interaction behaviour of reusable interface elements. Integration tests were then used to validate complete screen-level workflows in which persistence, state updates, rendering, and navigation work together.

This layered testing strategy was chosen because no single test type is sufficient on its own for a mobile application of this kind. Unit tests provide fast feedback on the correctness of the core logic, component tests provide evidence that shared UI building blocks behave as expected, and integration tests help demonstrate that the main user flows operate correctly as a whole.

### 4.2 Unit Tests

Unit testing was implemented to verify the correctness of the project’s core logic in isolation from the user interface and external services. For this application, the most important unit-test targets are the data management utilities, settings normalization logic, exchange-rate analysis functions, and smaller helper functions that support date formatting, monthly grouping, and numeric processing. The goal of these tests is to ensure that critical bookkeeping and exchange-rate calculations behave correctly for both normal inputs and edge cases such as empty data, invalid records, unsupported currencies, and insufficient historical rate samples.

The implemented unit-test set is summarised below.

| Module / Helper | Description | Implemented Unit Tests |
| --- | --- | --- |
| `dataManager` | Manages transaction records, balances, file normalization, and month-based grouping. | UT1: test `validateTransactionRecord()` accepts a valid record and rejects a record with invalid amount or currency. UT2: test `computeBalances()` calculates correct signed balances for mixed income and expense records. UT3: test `normalizeBookkeepingFile()` migrates legacy v1 data into the v2 structure with balances restored from transaction history. |
| `settingsManager` | Stores and normalizes default currency and enabled bookkeeping currencies. | UT1: test `normalizeSettings()` returns defaults for empty or invalid input. UT2: test `normalizeSettings()` removes duplicate or unsupported currency codes and keeps at least one valid bookkeeping currency. UT3: test `removeBookkeepingCurrencyCode()` does not remove the final remaining currency. |
| `exchangeRateManager` | Fetches, caches, and analyses exchange-rate history for trend and level suggestions. | UT1: test `getDailyFluctuationPercentage()` returns the correct one-day percentage change and `null` when insufficient data exists. UT2: test `getMonthlyRateLevel()` maps low and high current rates to appropriate rating bands. UT3: test `getMonthlyRateLevel()` and `getYearlyRateLevel()` apply momentum correction when a strong trend should soften a buy or sell recommendation. |
| Helper functions | Small pure helpers used to support formatting and deterministic data processing. | UT1: test `getYearMonthKey()` extracts the correct `YYYY-MM` key from a valid date string. UT2: test amount-formatting helpers preserve two decimal places. |

The unit tests were organised into three test files. Helper-function tests were grouped inside `dataManager.test.ts` rather than being placed in a separate file:

- `dataManager.test.ts`: 5 tests covering record validation, signed balance calculation, legacy file migration, year-month key extraction, and two-decimal numeric rounding.
- `settingsManager.test.ts`: 3 tests covering default settings recovery, duplicate and invalid currency filtering, and the protection against removing the final bookkeeping currency.
- `exchangeRateManager.test.ts`: 3 tests covering daily fluctuation calculation, monthly rating-band mapping, and momentum-based correction for monthly and yearly exchange suggestions.

Unit test overview: The unit tests implemented provide focused coverage of the application’s most important core logic, with particular attention to transaction validation, month-based grouping, balance computation, settings normalization, and exchange-rate analysis. In total, 11 unit tests were implemented across these four areas. All implemented unit tests passed successfully, providing a reliable foundation for the rest of the application and supporting the later addition of component-level and integration-level testing.

| Module | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `dataManager` | 20.60% | 31.97% | 22.22% | 21.96% |
| `settingsManager` | 70.00% | 57.77% | 64.28% | 71.42% |
| `exchangeRateManager` | 43.47% | 42.30% | 66.66% | 45.45% |
| All tested utility files | 36.00% | 39.25% | 45.45% | 37.63% |

Table 4.2: Unit test results


### 4.3 Component Tests

Component testing was implemented to assess the behaviour of the reusable UI building blocks that support the bookkeeping, statistics, and exchange flows of the application. The focus was placed on two complementary aspects: correct rendering of the component state and correct interaction handling when the user presses, scrolls, types, or changes selections. Since this project relies heavily on custom pickers, input controls, list items, and chart wrappers, component tests are particularly important for ensuring consistency and usability across different screens.

The implemented component-test coverage is summarised below.

| Folder / Group | Component | Implemented Test Cases |
| --- | --- | --- |
| input | `CurrencyAmountInput` | CT1: Correct rendering of currency symbol and amount placeholder. CT2: Correct rendering of an initial amount value and update of the amount callback. CT3: Correct interaction with the currency picker and currency change callback. |
| picker | `MonthYearPicker` | CT1: Correct rendering of the selected year and month. CT2: Correct opening of the month wheel picker and callback invocation after a new month is selected. |
| list item | `TransactionRecordItem` | CT1: Correct rendering of description, time, and signed amount. CT2: Correct fallback rendering when description is empty. CT3: Correct interaction behaviour when the component is pressable. |
| summary | `BalanceSummaryCard` | CT1: Correct rendering of the final `TOTAL` row in the selected default currency after multi-currency conversion. CT2: Correct immediate refresh of the displayed balances after a data-change event is triggered. |
| chart | `ExpenseCategoryPieChart` | CT1: Correct empty-state rendering when no matching transaction data exists. CT2: Correct rendering of total amount and legend rows after multi-currency conversion. |
| chart | `ExchangeRateCard` | CT1: Correct rendering of currency pair, current rate, fluctuation text, and chart. CT2: Correct rendering of the insufficient-data state without fluctuation text. |

The component tests were organised into six dedicated test files:

- `CurrencyAmountInput.test.tsx`: 3 tests covering placeholder rendering, initial value rendering, amount-change callback behaviour, and currency-selection interaction.
- `MonthYearPicker.test.tsx`: 2 tests covering initial rendering and month-selection callback behaviour through the wheel-style picker.
- `TransactionRecordItem.test.tsx`: 3 tests covering record rendering, category-label fallback, and optional press interaction.
- `BalanceSummaryCard.test.tsx`: 2 tests covering the rendering of the final `TOTAL` row in the default currency after balance conversion and the immediate refresh of balances after a data-change event.
- `ExpenseCategoryPieChart.test.tsx`: 2 tests covering the empty state and the rendering of converted totals and category legends.
- `ExchangeRateCard.test.tsx`: 2 tests covering full rate-card rendering and the insufficient-data display state.

Component test overview: The component tests implemented provide structured coverage of the reusable UI building blocks that support the application’s bookkeeping, statistics, and exchange flows. The tests focus on both visual correctness and interaction behaviour, ensuring that these shared components behave consistently across screens. In total, 14 component tests were implemented across these six reusable components. All implemented component tests passed successfully, providing confidence that the application’s most frequently reused UI building blocks behave correctly in isolation.

| Component / Group | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `BalanceSummaryCard` | 78.26% | 47.88% | 67.74% | 82.56% |
| `CurrencyAmountInput` | 75.00% | 64.28% | 68.42% | 80.00% |
| `MonthYearPicker` | 92.98% | 71.42% | 86.95% | 94.11% |
| `TransactionRecordItem` | 97.05% | 70.37% | 100.00% | 100.00% |
| `ExpenseCategoryPieChart` | 93.93% | 68.18% | 100.00% | 93.75% |
| `ExchangeRateCard` | 87.50% | 83.33% | 100.00% | 87.50% |
| All component files | 49.02% | 42.17% | 47.15% | 50.62% |

Table 4.4: Component test results

### 4.4 Integration Tests

Integration testing was implemented to verify that complete user flows behave correctly when data management, settings updates, local persistence, navigation, and screen-level rendering are combined. For this bookkeeping application, the integration tests focus on three dimensions: correct rendering of data and components, correct user interaction behaviour, and correct navigation between related screens.

The implemented integration-test coverage is summarised below.

| Section | Page / Flow | Test Suite | Implemented Test Cases |
| --- | --- | --- | --- |
| overview | `index` | Render | IT1: Correct loading of the balance-summary section and transaction list on mount. IT2: Correct rendering of the empty state when the selected month has no records. |
| overview | `index` | Interaction | IT1: Correct refresh of the overview screen after the selected month changes. IT2: Correct refresh of the overview screen after a data-change subscription event is triggered. IT3: Correct opening of the delete confirmation and deletion trigger after the user presses a transaction record. |
| exchange | `exchange` | Render | IT1: Correct rendering of cached exchange-rate output after settings and local cache are loaded. IT2: Correct error-state rendering when exchange-rate loading fails. |
| exchange | `exchange` | Interaction | IT1: Correct refresh of trend and rating output after the user changes the trend range and rating range. |
| settings | `settings` | Navigation | IT1: Correct navigation from the settings tab to the bookkeeping currency configuration page. IT2: Correct navigation from the settings tab to the default currency configuration page. |
| settings | `settings` | Interaction | IT1: Correct triggering of “Clear All Records”. IT2: Correct triggering of “Generate Fixed Test Data”. |
| settings | default currency flow | Integration | IT1: Correct update flow when the user selects a new default currency from the default-currency configuration screen. |

The integration tests were organised into three dedicated test files:

- `HomeTab.integration.test.tsx`: 4 tests covering initial overview rendering, empty-state rendering, refresh behaviour after month changes and data-change events, and delete-confirmation / delete-trigger behaviour for a pressed transaction record.
- `ExchangeTab.integration.test.tsx`: 3 tests covering cached exchange-rate rendering, error-state rendering, and output refresh after trend-range and rating-range changes.
- `SettingsFlow.integration.test.tsx`: 3 tests covering settings-page navigation, settings-page data-management actions, and the default-currency update flow.

Integration test overview: The integration tests implemented provide screen-level coverage of the application’s most important workflows, with emphasis on rendering correctness, interaction behaviour, and navigation between related pages. These tests verify that the main modules work together correctly when persistence, state updates, and UI rendering are combined. In total, 10 integration tests were implemented across three screen-level test files. All implemented integration tests passed successfully, providing evidence that the application’s core workflows behave correctly as a whole.

| Section / Screen | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Overview | 86.66% | 75.00% | 73.33% | 89.28% |
| Exchange | 89.28% | 78.94% | 93.33% | 89.74% |
| Settings | 81.81% | 100.00% | 100.00% | 81.81% |
| Default currency flow | 86.36% | 100.00% | 88.88% | 86.36% |
| All app screen files | 26.48% | 19.47% | 24.32% | 26.62% |

Table 4.6: Integration test results


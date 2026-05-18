import { fireEvent, render, screen } from "@testing-library/react-native";

import { CurrencyAmountInput } from "@/components/CurrencyAmountInput";

describe("CurrencyAmountInput component tests", () => {
  it("renders the currency symbol and amount placeholder correctly", () => {
    render(
      <CurrencyAmountInput
        currencyCode="USD"
        onCurrencyChange={jest.fn()}
        amount=""
        onAmountChange={jest.fn()}
        currencyCodes={["USD", "EUR"]}
      />,
    );

    expect(screen.getByText("$")).toBeTruthy();
    expect(screen.getByText("0.00")).toBeTruthy();
  });

  it("renders the initial amount value and updates the amount callback", () => {
    const onAmountChange = jest.fn();

    render(
      <CurrencyAmountInput
        currencyCode="USD"
        onCurrencyChange={jest.fn()}
        amount="123.45"
        onAmountChange={onAmountChange}
        currencyCodes={["USD", "EUR"]}
      />,
    );

    const input = screen.getByDisplayValue("123.45");
    expect(input).toBeTruthy();

    fireEvent.changeText(input, "987.65");
    expect(onAmountChange).toHaveBeenCalledWith("987.65");
  });

  it("opens the currency picker and calls back with the new selection", () => {
    const onCurrencyChange = jest.fn();

    render(
      <CurrencyAmountInput
        currencyCode="USD"
        onCurrencyChange={onCurrencyChange}
        amount=""
        onAmountChange={jest.fn()}
        currencyCodes={["USD", "EUR"]}
      />,
    );

    fireEvent.press(screen.getByText("▾"));
    fireEvent.press(screen.getByText("EUR"));

    expect(onCurrencyChange).toHaveBeenCalledWith("EUR");
  });
});

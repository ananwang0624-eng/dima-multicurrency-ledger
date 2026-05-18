import { fireEvent, render, screen } from "@testing-library/react-native";
import { FlatList } from "react-native";

import { MonthYearPicker } from "@/components/MonthYearPicker";

describe("MonthYearPicker component tests", () => {
  it("renders the selected year and month correctly", () => {
    render(
      <MonthYearPicker
        year={2025}
        month={5}
        onYearChange={jest.fn()}
        onMonthChange={jest.fn()}
      />,
    );

    expect(screen.getByText("2025")).toBeTruthy();
    expect(screen.getByText("05")).toBeTruthy();
  });

  it("opens the month picker modal and updates the selected month", () => {
    const onMonthChange = jest.fn();

    const view = render(
      <MonthYearPicker
        year={2025}
        month={5}
        onYearChange={jest.fn()}
        onMonthChange={onMonthChange}
      />,
    );

    fireEvent.press(screen.getByText("05"));

    expect(screen.getByText("Select Month")).toBeTruthy();
    fireEvent(view.UNSAFE_getByType(FlatList), "momentumScrollEnd", {
      nativeEvent: {
        contentOffset: { y: 44 * 6 },
      },
    });

    expect(onMonthChange).toHaveBeenCalledWith(7);
  });
});

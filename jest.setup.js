jest.mock("expo-file-system", () => {
  class MockFile {
    constructor(...args) {
      this.args = args;
      this.exists = false;
      this.uri = "mock://bookkeeping-data.json";
    }

    create() {}

    async write() {}

    async text() {
      return "";
    }
  }

  return {
    File: MockFile,
    Paths: {
      document: "/mock-documents",
    },
  };
});

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "mock-uuid"),
}));

jest.mock("expo-asset", () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      uri: "mock-asset-uri",
    })),
  },
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    SvgUri: ({ uri, testID }) =>
      React.createElement(Text, { testID: testID ?? "svg-uri" }, uri ?? "svg"),
  };
});

jest.mock("react-native-gifted-charts", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    PieChart: ({ data }) =>
      React.createElement(
        Text,
        { testID: "pie-chart" },
        `PieChart:${Array.isArray(data) ? data.length : 0}`,
      ),
  };
});

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  function Ionicons({ name }) {
    return React.createElement(Text, null, `icon:${String(name)}`);
  }

  Ionicons.glyphMap = {
    "settings-outline": 1,
    "cash-outline": 1,
    "chevron-forward": 1,
  };

  return Ionicons;
});

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("./components/BarChart", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockBarChart({ data }) {
    return React.createElement(
      Text,
      { testID: "bar-chart" },
      `BarChart:${Array.isArray(data) ? data.length : 0}`,
    );
  };
});

jest.mock("react-native/Libraries/Modal/Modal", () => {
  return {
    __esModule: true,
    default: ({ visible, children }) => (visible ? children : null),
  };
});

global.requestAnimationFrame = (callback) => setTimeout(callback, 0);

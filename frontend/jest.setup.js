import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Comment out the below to see console outputs in tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup error boundary testing
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOMTestUtils.act is deprecated")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Custom jest matchers
expect.extend({
  toHaveLoadingState(received) {
    const hasLoadingSpinner = received.querySelector(
      '[data-testid="loading-spinner"]'
    );
    const hasLoadingText =
      received.textContent?.includes("Loading") ||
      received.textContent?.includes("Analyzing");

    if (hasLoadingSpinner || hasLoadingText) {
      return {
        message: () => `expected element not to have loading state`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have loading state`,
        pass: false,
      };
    }
  },

  toHaveErrorState(received) {
    const hasErrorMessage = received.querySelector(
      '[data-testid="error-message"]'
    );
    const hasErrorText =
      received.textContent?.includes("Error") ||
      received.textContent?.includes("Failed");

    if (hasErrorMessage || hasErrorText) {
      return {
        message: () => `expected element not to have error state`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have error state`,
        pass: false,
      };
    }
  },
});

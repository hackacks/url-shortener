import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("react-oidc-context", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    signinRedirect: jest.fn(),
    removeUser: jest.fn(),
    user: null,
  }),
}));

test("renders the login screen with the theme toggle", () => {
  render(<App />);

  expect(screen.getByText(/HACKACK'S URL Shortener/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /switch to light mode/i })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
});

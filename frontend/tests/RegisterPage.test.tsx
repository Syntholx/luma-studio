import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { RegisterPage } from "../components/RegisterPage";
import { registerAccount } from "../services/auth";
import { EmailTakenError } from "../services/auth";

vi.mock("../services/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/auth")>();

  return {
    ...actual,
    registerAccount: vi.fn(),
  };
});

test("does not submit registration when passwords do not match", async () => {
  const registerAccountMock = vi.mocked(registerAccount);
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email address"), "demo@example.test");
  await user.type(screen.getByLabelText("Password"), "Demo!Amber472");
  await user.type(screen.getByLabelText("Confirm Password"), "Demo!Amber473");
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
  expect(registerAccountMock).toHaveBeenCalledTimes(0);
});

test("clears the form after successful registration", async () => {
  const registerAccountMock = vi.mocked(registerAccount);
  registerAccountMock.mockResolvedValueOnce({
    id: "account-1",
    email: "demo@example.test",
  });
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email address"), "demo@example.test");
  await user.type(screen.getByLabelText("Password"), "Demo!Amber472");
  await user.type(screen.getByLabelText("Confirm Password"), "Demo!Amber472");
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText("Account created")).toBeInTheDocument();
  expect(screen.getByLabelText("Email address")).toHaveValue("");
  expect(screen.getByLabelText("Password")).toHaveValue("");
  expect(screen.getByLabelText("Confirm Password")).toHaveValue("");
  expect(registerAccountMock).toHaveBeenCalledWith(
    "demo@example.test",
    "Demo!Amber472",
  );
});
test("shows an error and keeps the email when it is already registered", async () => {
  vi.mocked(registerAccount).mockRejectedValueOnce(
    new EmailTakenError("This email is already registered."),
  );
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email address"), "demo@example.test");
  await user.type(screen.getByLabelText("Password"), "Demo!Amber472");
  await user.type(screen.getByLabelText("Confirm Password"), "Demo!Amber472");
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(
    await screen.findByText(
      "An account with this email address already exists. Please use a different one.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Email address")).toHaveValue(
    "demo@example.test",
  );
});

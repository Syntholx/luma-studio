import { useState, type FormEvent } from "react";
import { registerAccount } from "../services/auth";
import { EmailTakenError } from "../services/auth";

export function RegisterPage() {
  const [message, setMessage] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [EmailMessage, setEmailMessage] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setRegisterMessage("");
    setEmailMessage("");
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const confirmPassword = formData.get("confirm-password");
    const password = formData.get("password");
    if (
      typeof email !== "string" ||
      typeof confirmPassword !== "string" ||
      typeof password !== "string"
    )
      return;
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    const form = event.currentTarget;
    try {
      setIsSubmitting(true);
      await registerAccount(normalizedEmail, password);
      form.reset();
      setRegisterMessage("Account created");
    } catch (error) {
      if (error instanceof EmailTakenError) {
        setEmailMessage(
          "An account with this email address already exists. Please use a different one.",
        );
        return;
      }
      setRegisterMessage("Could not create your account");
      return;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="max-w-[480px] py-[48px] items-center mx-auto ">
      <h1 className="font-[600] text-[28px] mb-[24px]">Create an account</h1>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-[8px] mt-[8px]">
          <label htmlFor="email">Email address</label>
          <input
            className="bg-[white] border-[#e5ddd3] rounded-[8px] min-h-[44px] px-[12px] py-[10px] border-[1px]"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            onChange={() => setEmailMessage("")}
          ></input>
          {EmailMessage !== "" && (
            <p role="alert" className="text-[#9f2929]">
              {EmailMessage}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-[8px]  mt-[8px]">
          <label htmlFor="password">Password</label>
          <input
            className="bg-[white] border-[#e5ddd3] rounded-[8px] min-h-[44px] px-[12px] py-[10px] border-[1px]"
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          ></input>
        </div>
        <div className="flex flex-col gap-[8px]  mt-[8px]">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            className="bg-[white] border-[#e5ddd3] rounded-[8px] min-h-[44px] px-[12px] py-[10px] border-[1px]"
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            autoComplete="new-password"
          ></input>
          {message !== "" && <p role="alert">{message}</p>}
        </div>
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-[24px] rounded-[8px] mt-[12px] inline-flex self-start items-center justify-center min-h-[44px] text-[white] bg-[#765341] font-[600] disabled:opacity-[50%] disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
          {registerMessage !== "" && <p role="alert">{registerMessage}</p>}
        </div>
      </form>
    </section>
  );
}

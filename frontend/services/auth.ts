function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function registerAccount(email: string, password: string) {
  const authResponse = await fetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  });
  if (authResponse.status === 201) {
    const data: unknown = await authResponse.json();
    if (
      !isRecord(data) ||
      typeof data.id !== "string" ||
      typeof data.email !== "string"
    ) {
      throw new Error("Invalid account response.");
    }

    return { id: data.id, email: data.email };
  }
  if (authResponse.status === 409) {
    let data: unknown;
    try {
      data = await authResponse.json();
    } catch (error) {
      throw new EmailTakenError("Failed to create an account");
    }

    if (isRecord(data) && data.code === "email_taken") {
      throw new Error("This email is already registered.");
    }
  }

  throw new Error("Failed to create an account");
}
export class EmailTakenError extends Error {}

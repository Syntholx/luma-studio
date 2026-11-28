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

  throw new Error("Failed to create an account");
}

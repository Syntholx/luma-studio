import { expect, test, vi } from "vitest";
import { render, act, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "../App";
import { afterEach } from "vitest";
import { StrictMode } from "react";
import { products } from "../products";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("odmotowanie App podczas trwającego pobierania, które anuluje", () => {
  const pendingResponse = new Promise<Response>(() => {});
  const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pendingResponse);
  vi.stubGlobal("fetch", fetchMock);
  const { unmount } = render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  const signal = fetchMock.mock.calls[0]?.[1]?.signal;
  expect(signal).toBeInstanceOf(AbortSignal);
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
});

test("starsza odpowiedź nie nadpisuje nowszego katalogu", async () => {
  let finishFirst!: (response: Response) => void;
  let finishSecond!: (response: Response) => void;
  const firstResponse = new Promise<Response>((resolve) => {
    finishFirst = resolve;
  });
  const secondResponse = new Promise<Response>((resolve) => {
    finishSecond = resolve;
  });
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockReturnValueOnce(secondResponse);

  vi.stubGlobal("fetch", fetchMock);
  render(
    <StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    finishSecond(
      new Response(
        JSON.stringify([{ ...products[0], name: "Nowszy produkt" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowszy produkt" }),
  ).toBeInTheDocument();
  await act(async () => {
    finishFirst(
      new Response(
        JSON.stringify([{ ...products[0], name: "Starszy produkt" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowszy produkt" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Starszy produkt" }),
  ).not.toBeInTheDocument();
});
test("spóźniony błąd, nie zasłania nowszego katalogu", async () => {
  let firstFinish!: (response: Response) => void;
  let secondFinish!: (response: Response) => void;
  const firstResponse = new Promise<Response>((resolve) => {
    firstFinish = resolve;
  });
  const secondResponse = new Promise<Response>((resolve) => {
    secondFinish = resolve;
  });

  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockReturnValueOnce(secondResponse);
  vi.stubGlobal("fetch", fetchMock);
  render(
    <StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    secondFinish(
      new Response(
        JSON.stringify([{ ...products[0], name: "Nowszy produkt" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowszy produkt" }),
  ).toBeInTheDocument();
  await act(async () => {
    firstFinish(new Response(null, { status: 500 }));
  });

  expect(
    screen.getByRole("heading", { name: "Nowszy produkt" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Nie udało się załadować katalogu. Spróbuj ponownie."),
  ).not.toBeInTheDocument();
});

test("stare żądanie nie wyłącza ładowania nowego", async () => {
  let firstFinish!: (response: Response) => void;
  let secondFinish!: (response: Response) => void;
  const firstResponse = new Promise<Response>((resolve) => {
    firstFinish = resolve;
  });
  const secondResponse = new Promise<Response>((resolve) => {
    secondFinish = resolve;
  });

  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockReturnValueOnce(secondResponse);
  vi.stubGlobal("fetch", fetchMock);
  render(
    <StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    firstFinish(
      new Response(
        JSON.stringify([{ ...products[0], name: "Starsza odpowiedź" }]),
      ),
    );
  });
  expect(screen.getByText("Ładowanie katalogu...")).toBeInTheDocument();
  await act(async () => {
    secondFinish(
      new Response(
        JSON.stringify([{ ...products[0], name: "Nowsza odpowiedź" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowsza odpowiedź" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Ładowanie katalogu...")).not.toBeInTheDocument();
});

test("ponownienie przyciskiem po błędzie", async () => {
  let firstFinish!: (response: Response) => void;
  let secondFinish!: (response: Response) => void;
  const firstResponse = new Promise<Response>((resolve) => {
    firstFinish = resolve;
  });
  const secondResponse = new Promise<Response>((resolve) => {
    secondFinish = resolve;
  });

  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockReturnValueOnce(secondResponse);
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  await act(async () => {
    firstFinish(new Response(null, { status: 500 }));
  });
  const retryButton = await screen.findByRole("button", {
    name: "Spróbuj ponownie",
  });
  const user = userEvent.setup();
  await user.click(retryButton);
  expect(screen.getByText("Ładowanie katalogu...")).toBeInTheDocument();
  expect(
    screen.queryByText("Nie udało się załadować katalogu. Spróbuj ponownie."),
  ).not.toBeInTheDocument();
  await act(async () => {
    secondFinish(
      new Response(
        JSON.stringify([{ ...products[0], name: "Nowsza odpowiedź" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowsza odpowiedź" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Nie udało się załadować katalogu. Spróbuj ponownie."),
  ).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

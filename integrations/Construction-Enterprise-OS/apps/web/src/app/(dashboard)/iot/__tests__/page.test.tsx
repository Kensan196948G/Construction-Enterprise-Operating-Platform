import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import IoTPage from "../page";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockResolvedValue({
    ok: false,
    json: () => Promise.resolve(null),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Flush the async useEffect (device fetch) so trailing state updates settle
// inside act() — keeps tests deterministic under the shared singleFork pool.
async function renderSettled() {
  render(<IoTPage />);
  await waitFor(() => expect(screen.getByText("IoT監視")).toBeInTheDocument());
}

describe("IoTPage", () => {
  it("renders page heading", async () => {
    await renderSettled();
    expect(screen.getByText("IoT監視")).toBeInTheDocument();
  });

  it("renders refresh button", async () => {
    await renderSettled();
    expect(screen.getByText("更新")).toBeInTheDocument();
  });

  it("renders stats cards with sensor status counts", async () => {
    await renderSettled();
    expect(screen.getAllByText("正常").length).toBeGreaterThan(0);
    expect(screen.getAllByText("警戒").length).toBeGreaterThan(0);
    expect(screen.getAllByText("アラート").length).toBeGreaterThan(0);
    expect(screen.getAllByText("オフライン").length).toBeGreaterThan(0);
  });

  it("renders project group headers from mock data", async () => {
    await renderSettled();
    expect(screen.getByText("品川タワー新築工事")).toBeInTheDocument();
    expect(screen.getByText("川崎物流センター建設")).toBeInTheDocument();
  });

  it("renders sensor names from mock data", async () => {
    await renderSettled();
    expect(screen.getByText("地盤変位計 #1")).toBeInTheDocument();
    expect(screen.getByText("傾斜計 B棟")).toBeInTheDocument();
  });

  it("shows normal status badges", async () => {
    await renderSettled();
    expect(screen.getAllByText("正常").length).toBeGreaterThan(0);
  });

  it("shows warning status badge", async () => {
    await renderSettled();
    expect(screen.getAllByText("警戒").length).toBeGreaterThan(0);
  });

  it("shows alert status badge", async () => {
    await renderSettled();
    expect(screen.getAllByText("アラート").length).toBeGreaterThan(0);
  });

  it("displays sensor values and thresholds", async () => {
    await renderSettled();
    // value renders standalone ("2.3 mm"); threshold renders as "閾値: 5.0 mm",
    // so a regex matcher is required for the threshold text.
    expect(screen.getByText("2.3 mm")).toBeInTheDocument();
    expect(screen.getByText(/5\.0 mm/)).toBeInTheDocument();
  });
});

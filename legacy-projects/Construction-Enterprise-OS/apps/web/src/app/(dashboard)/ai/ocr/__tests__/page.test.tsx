import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIOcrPage from "../page";

vi.mock("../../../../../lib/api/vision", () => ({
  listOcrResults: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Flush the async useEffect (OCR fetch) so trailing state updates settle inside
// act() — keeps tests deterministic under the shared singleFork pool.
async function renderSettled() {
  render(<AIOcrPage />);
  await waitFor(() =>
    expect(screen.getByText("OCR文書認識")).toBeInTheDocument(),
  );
}

describe("AIOcrPage", () => {
  it("renders page heading", async () => {
    await renderSettled();
    expect(screen.getByText("OCR文書認識")).toBeInTheDocument();
  });

  it("renders upload button", async () => {
    await renderSettled();
    expect(screen.getByText("ファイルアップロード")).toBeInTheDocument();
  });

  it("renders stats cards", async () => {
    await renderSettled();
    expect(screen.getByText("今日処理数")).toBeInTheDocument();
    expect(screen.getByText("成功率")).toBeInTheDocument();
    expect(screen.getByText("抽出文字数")).toBeInTheDocument();
    expect(screen.getByText("平均処理時間")).toBeInTheDocument();
  });

  it("renders processing queue table headers", async () => {
    await renderSettled();
    expect(screen.getByText("ファイル名")).toBeInTheDocument();
    expect(screen.getByText("書類種別")).toBeInTheDocument();
    expect(screen.getByText("処理状況")).toBeInTheDocument();
  });

  it("renders mock data items in table", async () => {
    await renderSettled();
    expect(screen.getByText(/contract_2026_05_24\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/blueprint_shinagawa_A\.pdf/)).toBeInTheDocument();
  });

  it("renders status filter select", async () => {
    await renderSettled();
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("renders doc type breakdown section", async () => {
    await renderSettled();
    expect(screen.getByText("書類種別内訳")).toBeInTheDocument();
  });

  it("shows completed status badge in table", async () => {
    await renderSettled();
    const completedBadges = screen.getAllByText("完了");
    expect(completedBadges.length).toBeGreaterThan(0);
  });

  it("shows total item count in footer", async () => {
    await renderSettled();
    expect(screen.getByText(/8件/)).toBeInTheDocument();
  });

  it("filters items when status filter is changed", async () => {
    await renderSettled();
    const selects = screen.getAllByRole("combobox");
    const statusSelect = selects[0];
    await userEvent.selectOptions(statusSelect, "completed");
    expect(screen.getByText(/4件/)).toBeInTheDocument();
  });
});

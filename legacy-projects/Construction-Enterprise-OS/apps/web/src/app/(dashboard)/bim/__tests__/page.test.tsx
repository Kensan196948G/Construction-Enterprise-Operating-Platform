import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BimPage from "../page";

vi.mock("../../../../lib/api/bim", () => ({
  listBimModels: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Flush the async useEffect (API fetch) so trailing state updates settle inside
// act() — keeps tests deterministic under the shared singleFork pool.
async function renderSettled() {
  render(<BimPage />);
  await waitFor(() =>
    expect(screen.getByText("BIMモデル管理")).toBeInTheDocument(),
  );
}

describe("BimPage", () => {
  it("renders page heading", async () => {
    await renderSettled();
    expect(screen.getByText("BIMモデル管理")).toBeInTheDocument();
  });

  it("renders upload button", async () => {
    await renderSettled();
    const buttons = screen.getAllByText("モデルアップロード");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders stats cards", async () => {
    await renderSettled();
    expect(screen.getByText("総モデル数")).toBeInTheDocument();
    expect(screen.getAllByText("有効").length).toBeGreaterThan(0);
    expect(screen.getByText("総要素数")).toBeInTheDocument();
    expect(screen.getByText("処理中 / エラー")).toBeInTheDocument();
  });

  it("renders model list table headers", async () => {
    await renderSettled();
    expect(screen.getByText("モデル名")).toBeInTheDocument();
    expect(screen.getByText("フォーマット")).toBeInTheDocument();
    expect(screen.getByText("要素数")).toBeInTheDocument();
  });

  it("renders mock model items", async () => {
    await renderSettled();
    expect(screen.getByText("品川タワー構造モデル")).toBeInTheDocument();
    expect(screen.getByText("横浜マンション意匠モデル")).toBeInTheDocument();
  });

  it("renders status filter select", async () => {
    await renderSettled();
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("shows IFC format badges", async () => {
    await renderSettled();
    const ifcBadges = screen.getAllByText("IFC");
    expect(ifcBadges.length).toBeGreaterThan(0);
  });

  it("shows active status badges in table", async () => {
    await renderSettled();
    const activeBadges = screen.getAllByText("有効");
    expect(activeBadges.length).toBeGreaterThan(0);
  });

  it("filters out non-active models when active filter selected", async () => {
    await renderSettled();
    // 川崎工場設備モデル has status "error"; selecting "active" must drop it
    // from the table. (Checking for the literal "エラー" would wrongly match the
    // always-present <option>エラー</option> in the filter dropdown.)
    expect(screen.getByText("川崎工場設備モデル")).toBeInTheDocument();
    const selects = screen.getAllByRole("combobox");
    await userEvent.selectOptions(selects[0], "active");
    expect(screen.queryByText("川崎工場設備モデル")).toBeNull();
  });

  it("shows model list section heading", async () => {
    await renderSettled();
    expect(screen.getByText("モデル一覧")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ImportPage from "./ImportPage";

vi.mock("papaparse", () => ({
  default: {
    parse: vi.fn(),
  },
}));

vi.mock("xlsx", () => ({
  read: vi.fn(() => ({ Sheets: { Sheet1: {} }, SheetNames: ["Sheet1"] })),
  utils: {
    sheet_to_json: vi.fn(() => []),
  },
}));

function renderImport() {
  return render(
    <MemoryRouter>
      <ImportPage />
    </MemoryRouter>,
  );
}

describe("ImportPage", () => {
  it("ページタイトルが表示される", () => {
    renderImport();
    expect(screen.getByText("データインポート")).toBeInTheDocument();
  });

  it("5種類のインポート対象が表示される", () => {
    renderImport();
    expect(screen.getByText("工事案件")).toBeInTheDocument();
    expect(screen.getByText("日報")).toBeInTheDocument();
    expect(screen.getByText("安全確認")).toBeInTheDocument();
    expect(screen.getByText("原価・工数")).toBeInTheDocument();
    expect(screen.getByText("インシデント")).toBeInTheDocument();
  });

  it("ファイルアップロードエリアが表示される", () => {
    renderImport();
    expect(screen.getByText(/ここにファイルをドロップ/)).toBeInTheDocument();
  });

  it("CSVテンプレートダウンロードリンクが表示される", () => {
    renderImport();
    expect(screen.getByText(/CSVテンプレートをダウンロード/)).toBeInTheDocument();
  });

  it("対象切り替えが機能する", () => {
    renderImport();
    const costBtn = screen.getByRole("button", { name: "原価・工数" });
    fireEvent.click(costBtn);
    expect(screen.getByText(/原価・工数 CSVテンプレートをダウンロード/)).toBeInTheDocument();
  });

  it("注意事項が表示される", () => {
    renderImport();
    expect(screen.getByText("インポート注意事項")).toBeInTheDocument();
  });
});

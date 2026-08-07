import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ExportPage from "./ExportPage";

vi.mock("jspdf", () => ({
  jsPDF: vi.fn(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
  })),
}));

vi.mock("jspdf-autotable", () => ({ default: vi.fn() }));

vi.mock("xlsx", () => ({
  utils: {
    aoa_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

function renderExport() {
  return render(
    <MemoryRouter>
      <ExportPage />
    </MemoryRouter>,
  );
}

describe("ExportPage", () => {
  it("ページタイトルが表示される", () => {
    renderExport();
    expect(screen.getByText("データエクスポート")).toBeInTheDocument();
  });

  it("4種類の出力対象が表示される", () => {
    renderExport();
    expect(screen.getByText("工事案件")).toBeInTheDocument();
    expect(screen.getByText("安全品質")).toBeInTheDocument();
    expect(screen.getByText("原価・工数")).toBeInTheDocument();
    expect(screen.getByText("インシデント")).toBeInTheDocument();
  });

  it("4種類の出力形式が表示される", () => {
    renderExport();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByText("Excel")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
  });

  it("エクスポートボタンが表示される", () => {
    renderExport();
    expect(screen.getByRole("button", { name: /PDF でエクスポート/ })).toBeInTheDocument();
  });

  it("形式切り替えがボタン表示を変える", () => {
    renderExport();
    // HTML フォーマット選択ボタン（アクセシブル名に "HTML" を含む）
    const htmlBtn = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("HTML") && btn.textContent?.includes("ブラウザ"),
    );
    expect(htmlBtn).toBeDefined();
    fireEvent.click(htmlBtn!);
    expect(screen.getByRole("button", { name: /HTML でエクスポート/ })).toBeInTheDocument();
  });

  it("プレビューテーブルが表示される", () => {
    renderExport();
    expect(screen.getByText("データプレビュー")).toBeInTheDocument();
  });
});

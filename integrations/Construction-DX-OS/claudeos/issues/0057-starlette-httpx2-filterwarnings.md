# Issue 0057 — starlette 1.x StarletteDeprecationWarning (httpx2) で CI が失敗

- **Priority**: P1 (CI / 全 PR ブロッカー)
- **Phase**: 9 (Stabilize / CI 安定化)
- **Status**: Resolved (PR pending human merge)
- **Related**: Issue 0054 (dependency-drift CI 修復, Loop 91 と同系統), PR #52 / #53
- **Branch**: `fix/0057-starlette-httpx2-filterwarnings`

## 背景

PR #52 (Issue 0055) と PR #53 (Issue 0056) の CI 3 ジョブ
(`cdx-server 3.11`, `cdx-server 3.12`, `security scan`) が失敗。
PR #51 は同一コードベースで green。差は **実行時刻** のみ。

原因はコード変更ではなく **dependency-drift**:

- CI は `pip install -e ".[dev]"` で starlette を未ピン取得 → **starlette 1.3.1** を取得。
- starlette は `TestClient` 生成時に
  `StarletteDeprecationWarning: Using `httpx`with`starlette.testclient`is deprecated; install`httpx2` instead.`
  を発するようになった。
- 本リポジトリは `pyproject.toml` の `filterwarnings = ["error", ...]` で
  警告をエラー化している。既存の緩和 `ignore::DeprecationWarning:starlette` は
  **category 不一致** で効かない。

## 根本原因（検証済み）

使い捨て venv で starlette 1.3.1 を取得し確認:

```
StarletteDeprecationWarning.__mro__
  = [StarletteDeprecationWarning, UserWarning, Warning, Exception, ...]
issubclass(StarletteDeprecationWarning, DeprecationWarning) == False
```

`StarletteDeprecationWarning` は **`UserWarning` 派生**で `DeprecationWarning`
ではない。よって `ignore::DeprecationWarning:starlette` は一致せず、
collection 時に `error` へ昇格 → `Interrupted: 2 errors during collection`。

## 受入基準

- [x] `pyproject.toml` の `filterwarnings` に message 一致の ignore を追加
- [x] 使い捨て venv (starlette 1.3.1) で collection エラーが解消することを検証
      (フィルタなし=`1 error`/フィルタあり=`1 passed`、対照両方で確認)
- [x] 既存テストの結果に副作用がないこと (他警告のエラー化は維持。`error` 行は残置、
      message 一致は当該 1 警告のみに限定)
- [x] PR を作成 (Draft)。CI の 3 失敗ジョブが green になる想定 (人間 merge 待ち)

## 設計判断

- **message 一致を採用** (category 一致でなく): メモリ
  `feedback_filterwarnings_message_vs_category` の通り、`filterwarnings=["error"]`
  下では版間で頑健。`StarletteDeprecationWarning` の所属モジュールは版で移動する
  (exceptions / \_utils / testclient) ため category 参照は脆い。
- 追加フィルタ:
  `ignore:Using .httpx. with .starlette.testclient. is deprecated:Warning`
  (`.` は `` `httpx` `` 等のバッククォート/任意 1 文字に一致、category=Warning で
  UserWarning 派生を捕捉)。
- `httpx2` への移行は破壊的かつ未成熟のため採用しない (将来課題)。

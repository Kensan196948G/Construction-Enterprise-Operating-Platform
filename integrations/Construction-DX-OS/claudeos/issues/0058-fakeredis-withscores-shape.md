# Issue 0058 — fakeredis>=2.36 の WITHSCORES 応答形変化で rate-limit Lua が算術エラー

- **Priority**: P1 (CI / cdx-server 全 PR ブロッカー)
- **Phase**: 9 (Stabilize / CI 安定化)
- **Status**: Resolved (PR pending human merge)
- **Related**: Issue 0057 (同一 PR で同時出荷する dependency-drift CI hotfix), PR #51/#52/#53/#54
- **Branch**: `fix/0057-starlette-httpx2-filterwarnings` (0057 と同梱)

## 背景

Issue 0057 の starlette フィルタ修正で `security scan` ジョブは green 化したが、
`cdx-server (3.11)` / `cdx-server (3.12)` が依然 FAILURE。これは starlette とは
**別系統の dependency-drift**:

- CI は `pip install -e ".[dev]"` で fakeredis を未ピン取得 → **fakeredis 2.36.x** を取得。
- `server/api/cdx_server/rate_limit_redis.py` の sliding-window Lua スクリプトは
  `ZRANGE key 0 0 WITHSCORES` の結果からスコアを `oldest[2]` で読んでいた。
- サーバーサイド Lua から見た WITHSCORES の応答形がバージョンで異なる:
  - real Redis / fakeredis<2.36 : **フラット** `{member, score, ...}` → `oldest[2]` = score
  - fakeredis>=2.36 : **ネスト** `{{member, score}, ...}` → `oldest[2]` = nil
- nested 形では `oldest_ts = tonumber(nil)` → nil → `math.ceil(nil + window - now)` で
  `attempt to perform arithmetic on local 'oldest_ts' (a nil value)` を送出。
- 失敗テスト: `tests/test_rate_limit_redis.py`（容量超過で oldest を読む経路の 5 件）。

## 根本原因（検証済み）

使い捨て venv で `fakeredis[lua]>=2.36`（= 2.36.1 / lupa 2.8）を取得して対照確認:

```
B) 修正なし (oldest[2])      : 5 failed, 5 passed
A) 修正あり (type 判定)      : 10 passed
```

`unknown command 'eval'` を避けるため fakeredis は **`[lua]` extra（lupa 同梱）**が必須。
CI も lua サポート込みのため算術エラーまで到達していた。

## 修正

Lua 内で先頭要素の型を判定し、両応答形に耐えるスコア読み出しに変更
（クライアント側のバージョン分岐ではなくサーバーサイドで吸収 = 単一の真実）:

```lua
local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local oldest_ts
if type(oldest[1]) == 'table' then
    oldest_ts = tonumber(oldest[1][2])   -- nested: {{member, score}, ...}
else
    oldest_ts = tonumber(oldest[2])      -- flat:   {member, score, ...}
end
local retry_after
if oldest_ts == nil then
    retry_after = math.ceil(window)      -- defensive fail-safe (no arithmetic on nil)
else
    retry_after = math.ceil(oldest_ts + window - now)
end
```

## 受入基準

- [x] Lua スクリプトを flat / nested 両応答形に耐えるよう修正
- [x] `oldest_ts == nil` の防御ガードを追加（算術エラーを縮退で回避）
- [x] 使い捨て venv (fakeredis[lua] 2.36.1) で対照検証（修正なし=5 failed / 修正あり=10 passed）
- [x] PR を作成（Draft, 0057 と同梱）。cdx-server 3.11/3.12 が green になる想定（人間 merge 待ち）

## 設計判断

- **サーバーサイド（Lua）で吸収**: クライアント版分岐より頑健。Redis/fakeredis いずれの
  応答形でも単一コードで正しく動く。メモリ `feedback_redis_withscores_shape` の通り。
- **0057 と同梱**: 両者は同じ CI ジョブ群（cdx-server / security scan）をブロックする
  dependency-drift P1。原子性確保のため同一ブランチ/PR (#54) で同時に出荷する。
- `fakeredis` をピン留めしない: ピンは drift を先送りするだけ。応答形非依存にするのが本質。

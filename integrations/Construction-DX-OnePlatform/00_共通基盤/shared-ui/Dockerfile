# --------------------------------------------------------------------------
# @cdx/shared-ui ビルドステージ
#
# このイメージ単体は publish 用途ではなく、各 frontend Dockerfile の
# `FROM cdx-shared-ui AS shared-ui` で利用する **共通ビルド成果物の供給源**
# として設計している。最終ステージは `node:20-alpine` ベースの実行コンテナでは
# なく、`/dist` を提供するだけのスリムイメージとする。
#
# build context はリポジトリルートを想定:
#   docker build -f 00_共通基盤/shared-ui/Dockerfile -t cdx-shared-ui:dev .
# --------------------------------------------------------------------------

# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /workspace

# workspaces 解決のためルート package.json と shared-ui のみコピー
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json

RUN npm install --workspace=@cdx/shared-ui --include-workspace-root \
    --no-fund --no-audit

# ---- build ----
FROM deps AS build
WORKDIR /workspace
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- dist (export only) ----
# 中間 stage として frontend Dockerfile から COPY --from=cdx-shared-ui /dist .
# できるように軽量化したエクスポート用イメージ。
FROM alpine:3.20 AS dist
WORKDIR /dist
COPY --from=build /workspace/00_共通基盤/shared-ui/dist /dist
COPY --from=build /workspace/00_共通基盤/shared-ui/package.json /dist/package.json
CMD ["true"]

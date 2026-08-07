# --------------------------------------------------------------------------
# 06 安全品質 Web (multistage; shared-ui を workspace 経由でビルドする)
# build context は **リポジトリルート** を想定。
# --------------------------------------------------------------------------

FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 06_安全品質環境本部/SafetyQualityGovernancePlatform/frontend/package.json \
     ./06_安全品質環境本部/SafetyQualityGovernancePlatform/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

FROM shared-ui AS build
WORKDIR /workspace
COPY 06_安全品質環境本部/SafetyQualityGovernancePlatform/frontend \
     ./06_安全品質環境本部/SafetyQualityGovernancePlatform/frontend
RUN npm -w @cdx/sq-frontend run build

FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/06_安全品質環境本部/SafetyQualityGovernancePlatform/frontend/dist \
     /usr/share/nginx/html
EXPOSE 80

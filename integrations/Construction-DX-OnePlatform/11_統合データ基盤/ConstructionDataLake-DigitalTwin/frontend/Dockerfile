# --------------------------------------------------------------------------
# 11 Data Lake & Digital Twin Web (multistage; shared-ui を workspace 経由でビルド)
# build context は **リポジトリルート** を想定。
# --------------------------------------------------------------------------

FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 11_統合データ基盤/ConstructionDataLake-DigitalTwin/frontend/package.json \
     ./11_統合データ基盤/ConstructionDataLake-DigitalTwin/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

FROM shared-ui AS build
WORKDIR /workspace
COPY 11_統合データ基盤/ConstructionDataLake-DigitalTwin/frontend \
     ./11_統合データ基盤/ConstructionDataLake-DigitalTwin/frontend
RUN npm -w cdx-data-frontend run build

FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/11_統合データ基盤/ConstructionDataLake-DigitalTwin/frontend/dist \
     /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

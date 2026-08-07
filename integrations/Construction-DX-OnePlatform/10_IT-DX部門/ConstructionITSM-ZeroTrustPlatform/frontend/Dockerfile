# --------------------------------------------------------------------------
# 10 ITSM Web (multistage; shared-ui を workspace 経由でビルドする)
# build context は **リポジトリルート** を想定。
# --------------------------------------------------------------------------

FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/frontend/package.json \
     ./10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

FROM shared-ui AS build
WORKDIR /workspace
COPY 10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/frontend \
     ./10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/frontend
RUN npm -w cdx-itsm-frontend run build

FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/frontend/dist \
     /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

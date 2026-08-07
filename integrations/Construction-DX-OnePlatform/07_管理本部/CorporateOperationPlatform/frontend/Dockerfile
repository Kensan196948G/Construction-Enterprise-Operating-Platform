# --------------------------------------------------------------------------
# 07 企業運営基盤 Web (multistage; shared-ui を workspace 経由でビルドする)
#
# build context は **リポジトリルート** を想定:
#   docker build -f 07_管理本部/CorporateOperationPlatform/frontend/Dockerfile -t cdx-corp-web .
# --------------------------------------------------------------------------

# ---- shared-ui build ----
FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 07_管理本部/CorporateOperationPlatform/frontend/package.json \
     ./07_管理本部/CorporateOperationPlatform/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- frontend build ----
FROM shared-ui AS build
WORKDIR /workspace
COPY 07_管理本部/CorporateOperationPlatform/frontend \
     ./07_管理本部/CorporateOperationPlatform/frontend
RUN npm -w @cdx/corp-frontend run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/07_管理本部/CorporateOperationPlatform/frontend/dist \
     /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

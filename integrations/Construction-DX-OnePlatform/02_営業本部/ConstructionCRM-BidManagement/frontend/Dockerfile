# --------------------------------------------------------------------------
# 02 建設 CRM・入札管理 Web (multistage; shared-ui を workspace 経由でビルドする)
#
# build context は **リポジトリルート** を想定:
#   docker build -f 02_営業本部/ConstructionCRM-BidManagement/frontend/Dockerfile -t cdx-crm-web .
# --------------------------------------------------------------------------

# ---- shared-ui build ----
FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 02_営業本部/ConstructionCRM-BidManagement/frontend/package.json \
     ./02_営業本部/ConstructionCRM-BidManagement/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- frontend build ----
FROM shared-ui AS build
WORKDIR /workspace
COPY 02_営業本部/ConstructionCRM-BidManagement/frontend \
     ./02_営業本部/ConstructionCRM-BidManagement/frontend
RUN npm -w cdx-crm-frontend run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/02_営業本部/ConstructionCRM-BidManagement/frontend/dist \
     /usr/share/nginx/html
COPY 02_営業本部/ConstructionCRM-BidManagement/frontend/nginx.conf \
     /etc/nginx/conf.d/default.conf
EXPOSE 80

# --------------------------------------------------------------------------
# 09 船舶事業部 Marine Fleet Management Web (multistage; shared-ui を workspace 経由でビルド)
#
# build context は **リポジトリルート** を想定:
#   docker build -f 09_船舶事業部/MarineFleetManagement/frontend/Dockerfile -t cdx-marine-web .
# --------------------------------------------------------------------------

# ---- shared-ui build ----
FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 09_船舶事業部/MarineFleetManagement/frontend/package.json \
     ./09_船舶事業部/MarineFleetManagement/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- frontend build ----
FROM shared-ui AS build
WORKDIR /workspace
COPY 09_船舶事業部/MarineFleetManagement/frontend \
     ./09_船舶事業部/MarineFleetManagement/frontend
RUN npm -w cdx-marine-frontend run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/09_船舶事業部/MarineFleetManagement/frontend/dist \
     /usr/share/nginx/html
COPY 09_船舶事業部/MarineFleetManagement/frontend/nginx.conf \
     /etc/nginx/conf.d/default.conf
EXPOSE 80

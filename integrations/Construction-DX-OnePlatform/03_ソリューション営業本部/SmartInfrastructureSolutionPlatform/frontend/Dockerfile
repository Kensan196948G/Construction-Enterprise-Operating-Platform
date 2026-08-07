# --------------------------------------------------------------------------
# 03 スマートインフラソリューション Web (multistage; shared-ui を workspace 経由でビルドする)
#
# build context は **リポジトリルート** を想定:
#   docker build -f 03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/frontend/Dockerfile -t cdx-sol-web .
# --------------------------------------------------------------------------

# ---- shared-ui build ----
FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/frontend/package.json \
     ./03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- frontend build ----
FROM shared-ui AS build
WORKDIR /workspace
COPY 03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/frontend \
     ./03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/frontend
RUN npm -w cdx-sol-frontend run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/frontend/dist \
     /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

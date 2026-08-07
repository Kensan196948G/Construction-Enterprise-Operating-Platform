# --------------------------------------------------------------------------
# 05 技術ナレッジ・BIM 基盤 Web (multistage; shared-ui を workspace 経由でビルド)
#
# build context は **リポジトリルート** を想定:
#   docker build -f 05_技術本部/.../frontend/Dockerfile -t cdx-tech-web .
# --------------------------------------------------------------------------

# ---- shared-ui build ----
FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 05_技術本部/TechnicalKnowledge-BIMPlatform/frontend/package.json \
     ./05_技術本部/TechnicalKnowledge-BIMPlatform/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- frontend build ----
FROM shared-ui AS build
WORKDIR /workspace
COPY 05_技術本部/TechnicalKnowledge-BIMPlatform/frontend \
     ./05_技術本部/TechnicalKnowledge-BIMPlatform/frontend
RUN npm -w cdx-tech-frontend run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/05_技術本部/TechnicalKnowledge-BIMPlatform/frontend/dist \
     /usr/share/nginx/html
EXPOSE 80

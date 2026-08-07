// cesium は optional 依存 (動的 import で graceful fallback)
// パッケージ自体は package.json に含めず、build 時に型解決のため ambient 宣言
declare module "cesium" {
  const value: any;
  export default value;
  export = value;
}

declare module "cesium/Build/Cesium/Widgets/widgets.css";

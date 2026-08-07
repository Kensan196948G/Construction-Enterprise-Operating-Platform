# 03_CI-CD方針（CI-CD-Policy）

## 方針

- ISO ビルドを自動化する
- agent と API はユニットテストを持つ
- VM 起動確認をパイプラインに組み込む
- 失敗時は build / os / agent / server の責務で切り分ける


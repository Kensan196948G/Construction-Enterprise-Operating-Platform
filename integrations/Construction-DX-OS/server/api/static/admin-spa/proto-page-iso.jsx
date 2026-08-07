/* ─── ISO Builder Page with interactive distribution workflows ─── */

const DIST_METHODS = [
  { id: "download", label: "情シス検証用", method: "WebUI / S3 ダウンロード配布", desc: "情シスがISOを取得、SHA256照合、VM検証またはUSB作成へ進める", icon: "🔬", color: "#8b5cf6", phase: 1,
    steps: [
      { label: "管理者ログイン", desc: "ISO Builder UI に管理者でログイン" },
      { label: "プロファイル選択", desc: "standard / field / admin など profile を選択" },
      { label: "Git Ref 指定", desc: "対象の git_ref またはリリース版を指定" },
      { label: "ISO ビルド開始", desc: "ISO ビルドジョブを開始" },
      { label: "ビルド結果確認", desc: "ISO / build.log / SHA256 を確認" },
      { label: "ISO ダウンロード", desc: "S3/MinIO の署名付き URL からダウンロード" },
      { label: "SHA256 照合", desc: "ローカルで SHA256 を照合" },
      { label: "次工程へ", desc: "VM 検証または USB 作成へ進める" },
      { label: "管理台帳記録", desc: "ビルド者・日時・profile・SHA256 を記録" },
    ],
    logs: [
      "[09:30:00] === 情シス検証用: WebUI/S3 ダウンロード配布 ===",
      "[09:30:01] Step 1: ISO Builder UI に管理者でログイン",
      "[09:30:02]   認証方式: HTTP Basic Auth (CDX_ADMIN_TOKEN)",
      "[09:30:03]   ログイン成功 — ユーザー: admin",
      "[09:30:04] Step 2: プロファイル選択",
      "[09:30:04]   選択: standard — 本社・支店向け",
      "[09:30:05] Step 3: Git Ref 指定",
      "[09:30:05]   指定: v1.0.0-rc2 (tag)",
      "[09:30:06] Step 4: ISO ビルド開始",
      "[09:30:06]   POST /api/v1/iso-builds → ジョブ作成: b7a1c2d3",
      "[09:30:07]   Redis Queue にジョブ投入完了",
      "[09:30:08]   build-worker 起動: lb config --distribution bookworm --architectures amd64",
      "[09:30:15]   live-build 実行中...",
      "[09:30:30]   chroot 環境セットアップ完了",
      "[09:30:45]   パッケージインストール (base/desktop/business/security/support)",
      "[09:31:00]   hook 実行: 0100-set-hostname / 0200-install-launcher / 0300-install-agent / 0400-security-hardening",
      "[09:31:30]   squashfs 作成中...",
      "[09:32:00]   ISO イメージ生成完了",
      "[09:32:01] Step 5: ビルド結果確認",
      "[09:32:02]   ISO: cdx-os-standard-v1.0.0-rc2.iso (1.8 GB)",
      "[09:32:03]   build.log: 342 行 — エラーなし",
      "[09:32:04]   SHA256: a1b2c3d4e5f6789012345678abcdef01234567890abcdef1234567890abcdef12",
      "[09:32:05]   MinIO アップロード完了: iso/b7a1c2d3/",
      "[09:32:06] Step 6: ISO ダウンロード",
      "[09:32:07]   presigned URL 生成: https://minio.internal:9000/iso/b7a1c2d3/cdx-os-standard-v1.0.0-rc2.iso?X-Amz-...",
      "[09:32:08]   有効期限: 1 時間",
      "[09:32:09]   ダウンロード開始...",
      "[09:32:40]   ダウンロード完了 (1.8 GB)",
      "[09:32:41] Step 7: SHA256 照合",
      "[09:32:42]   $ sha256sum cdx-os-standard-v1.0.0-rc2.iso",
      "[09:32:43]   ローカル:  a1b2c3d4e5f6789012345678abcdef01234567890abcdef1234567890abcdef12",
      "[09:32:44]   サーバー: a1b2c3d4e5f6789012345678abcdef01234567890abcdef1234567890abcdef12",
      "[09:32:45]   ✅ SHA256 一致 — 整合性確認完了",
      "[09:32:46] Step 8: 次工程へ",
      "[09:32:47]   → VM 検証 または USB メモリ作成 へ進めてください",
      "[09:32:48] Step 9: 管理台帳記録",
      "[09:32:49]   📋 記録内容:",
      "[09:32:49]     ビルド者: admin",
      "[09:32:49]     日時: 2026-05-06 09:30:00 JST",
      "[09:32:49]     Profile: standard",
      "[09:32:49]     Git Ref: v1.0.0-rc2",
      "[09:32:49]     SHA256: a1b2c3d4...abcdef12",
      "[09:32:49]     ジョブID: b7a1c2d3",
      "[09:32:50]   監査ログに記録完了 (iso_build_audit テーブル)",
      "[09:32:51] ✅ 情シス検証用配布プロセス完了",
    ]
  },
  { id: "vm", label: "VM ISOマウント", method: "仮想環境配布", desc: "検証・教育・PoC・回帰確認。USB/PXE配布前の標準検証として扱う", icon: "🖥️", color: "#22c55e", phase: 2,
    steps: [
      { label: "検証用 VM 作成", desc: "VirtualBox / VMware / KVM に VM を作成" },
      { label: "VM スペック設定", desc: "CPU・メモリ・ディスクを標準端末相当に設定" },
      { label: "ISO マウント", desc: "ISO を仮想 CD/DVD としてマウント" },
      { label: "VM 起動", desc: "ISO からブート開始" },
      { label: "インストール実行", desc: "インストールを最後まで実行" },
      { label: "デスクトップ確認", desc: "初回起動後、デスクトップ表示を確認" },
      { label: "Construction Hub 確認", desc: "Construction Hub の起動を確認" },
      { label: "cdx-agent 登録確認", desc: "中央管理への登録を確認" },
      { label: "スナップショット保存", desc: "問題なければ VM スナップショットを保存" },
      { label: "標準検証完了", desc: "USB / PXE 配布前の標準検証として記録" },
    ],
    logs: [
      "[11:00:00] === VM ISOマウント配布 ===",
      "[11:00:01] Step 1: 検証用 VM 作成",
      "[11:00:02]   プラットフォーム: VirtualBox 7.0",
      "[11:00:03]   VM名: cdx-test-standard-rc2",
      "[11:00:04]   OS タイプ: Debian 13 (64-bit)",
      "[11:00:05] Step 2: VM スペック設定",
      "[11:00:06]   CPU: 2 vCPU",
      "[11:00:07]   メモリ: 4096 MB",
      "[11:00:08]   ディスク: 32 GB (VDI, 可変サイズ)",
      "[11:00:09]   ネットワーク: NAT (初期) → Bridged (検証時)",
      "[11:00:10]   ※ 標準端末相当のスペック設定完了",
      "[11:00:11] Step 3: ISO マウント",
      "[11:00:12]   仮想 CD/DVD ドライブに ISO を設定:",
      "[11:00:12]   cdx-os-standard-v1.0.0-rc2.iso (1.8 GB)",
      "[11:00:13]   ブート順序: CD/DVD → HDD",
      "[11:00:14] Step 4: VM 起動",
      "[11:00:15]   VM 起動中...",
      "[11:00:16]   BIOS → ISO ブートローダー検出",
      "[11:00:17]   Debian Installer 起動",
      "[11:00:18] Step 5: インストール実行",
      "[11:00:19]   言語: 日本語",
      "[11:00:20]   キーボード: jp106",
      "[11:00:21]   ディスクパーティション: ガイド — ディスク全体を使用",
      "[11:00:22]   基本システムインストール中...",
      "[11:00:30]   パッケージインストール中 (base/desktop/business/security/support)...",
      "[11:00:45]   GRUB ブートローダーインストール",
      "[11:00:50]   インストール完了 — 再起動",
      "[11:00:55] Step 6: デスクトップ確認",
      "[11:00:56]   再起動中...",
      "[11:01:00]   XFCE デスクトップ表示: ✅ 正常",
      "[11:01:01]   解像度: 1920x1080",
      "[11:01:02]   日本語入力 (fcitx5): ✅ 動作確認",
      "[11:01:03] Step 7: Construction Hub 確認",
      "[11:01:04]   Construction Hub 自動起動: ✅",
      "[11:01:05]   プロファイル: standard",
      "[11:01:06]   カード表示: 8アプリ (日報/写真/図面/案件/申請/ナレッジ/メール/ITサポート)",
      "[11:01:07]   サーバー接続状態: 接続確認中...",
      "[11:01:08] Step 8: cdx-agent 登録確認",
      "[11:01:09]   cdx-agent version: 0.2.0 ✅",
      "[11:01:10]   systemctl status cdx-agent-heartbeat.timer: active ✅",
      "[11:01:11]   systemctl status cdx-agent-inventory.timer: active ✅",
      "[11:01:12]   heartbeat 送信テスト: 200 OK ✅",
      "[11:01:13]   管理 WebUI で端末出現確認: CDX-TEST-001 ✅",
      "[11:01:14]   AppArmor プロファイル: enforced ✅",
      "[11:01:15] Step 9: スナップショット保存",
      "[11:01:16]   スナップショット名: clean-install-standard-rc2",
      "[11:01:17]   スナップショット保存完了 ✅",
      "[11:01:18] Step 10: 標準検証完了",
      "[11:01:19]   📋 検証結果:",
      "[11:01:19]     デスクトップ表示: ✅",
      "[11:01:19]     Construction Hub: ✅",
      "[11:01:19]     cdx-agent 登録: ✅",
      "[11:01:19]     AppArmor: ✅",
      "[11:01:19]     heartbeat/inventory: ✅",
      "[11:01:20]   → USB配布・PXE配布前の標準検証として記録",
      "[11:01:21] ✅ VM ISOマウント配布プロセス完了 — 次工程へ進行可",
    ]
  },
  { id: "usb", label: "USBメモリ配布", method: "物理メディア配布", desc: "1台構築・現場PC・ネット不安定拠点向け", icon: "💾", color: "#2563eb", phase: 3,
    steps: [
      { label: "検証済み ISO 取得", desc: "WebUI/S3 から検証済み ISO を取得" },
      { label: "SHA256 照合", desc: "ISO の整合性を確認" },
      { label: "USB 書込み", desc: "Rufus 等で USB メモリへ ISO を書込み" },
      { label: "USB ラベル付け", desc: "profile / 日付 / バージョンを明記" },
      { label: "BIOS/UEFI 設定", desc: "対象 PC の USB ブートを有効化" },
      { label: "USB 起動・インストール", desc: "USB から起動してインストール" },
      { label: "Construction Hub 確認", desc: "初回起動後の表示を確認" },
      { label: "cdx-agent 確認", desc: "登録・ハートビート送信を確認" },
      { label: "USB 管理", desc: "保管・更新・廃棄ルールに従い管理" },
    ],
    logs: [
      "[10:00:00] === USBメモリ配布 ===",
      "[10:00:01] Step 1: 検証済み ISO 取得",
      "[10:00:02]   ISO Builder WebUI にログイン",
      "[10:00:03]   対象: standard — b7a1c2d3 (v1.0.0-rc2)",
      "[10:00:04]   ステータス: succeeded ✅ (VM検証済み)",
      "[10:00:05]   presigned URL 生成...",
      "[10:00:06]   ダウンロード中... cdx-os-standard-v1.0.0-rc2.iso (1.8 GB)",
      "[10:00:35]   ダウンロード完了",
      "[10:00:36] Step 2: SHA256 照合",
      "[10:00:37]   $ sha256sum cdx-os-standard-v1.0.0-rc2.iso",
      "[10:00:38]   ローカル:  a1b2c3d4e5f6...abcdef12",
      "[10:00:39]   サーバー: a1b2c3d4e5f6...abcdef12",
      "[10:00:40]   ✅ SHA256 一致",
      "[10:00:41] Step 3: USB 書込み",
      "[10:00:42]   ツール: Rufus 4.4 (Windows) / dd (Linux)",
      "[10:00:43]   対象デバイス: /dev/sdb (SanDisk Ultra 32GB)",
      "[10:00:44]   ⚠️ 書込み先デバイスを必ず確認してください",
      "[10:00:45]   Windows: Rufus → ISOイメージ選択 → DDイメージモード → 開始",
      "[10:00:46]   Linux: sudo dd if=cdx-os-standard-v1.0.0-rc2.iso of=/dev/sdb bs=4M status=progress conv=fsync",
      "[10:01:30]   書込み完了 (1.8 GB → USB)",
      "[10:01:31]   sync 実行完了",
      "[10:01:32] Step 4: USB ラベル付け",
      "[10:01:33]   ラベル: CDX-OS / standard / v1.0.0-rc2 / 2026-05-06",
      "[10:01:34]   USB 本体に物理ラベルシールを貼付",
      "[10:01:35] Step 5: BIOS/UEFI 設定",
      "[10:01:36]   対象PC: 川崎現場A 端末",
      "[10:01:37]   BIOS 起動 → Boot Order → USB を最優先に設定",
      "[10:01:38]   Secure Boot: 有効のまま (Debian 署名済みカーネル対応)",
      "[10:01:39] Step 6: USB 起動・インストール",
      "[10:01:40]   USB から起動中...",
      "[10:01:41]   Debian Installer 起動",
      "[10:01:42]   インストール実行中... (約15分)",
      "[10:01:55]   インストール完了 — USB を抜いて再起動",
      "[10:02:00] Step 7: Construction Hub 確認",
      "[10:02:01]   XFCE デスクトップ起動: ✅",
      "[10:02:02]   Construction Hub 表示: ✅",
      "[10:02:03]   プロファイル: standard — 8アプリ表示",
      "[10:02:04] Step 8: cdx-agent 確認",
      "[10:02:05]   cdx-agent heartbeat: 送信成功 ✅",
      "[10:02:06]   cdx-agent inventory: 送信成功 ✅",
      "[10:02:07]   管理 WebUI: CDX-FLD-NEW-001 出現 ✅",
      "[10:02:08]   AppArmor: enforced ✅",
      "[10:02:09] Step 9: USB 管理",
      "[10:02:10]   📋 USB 管理ルール:",
      "[10:02:10]     保管: 施錠キャビネットに保管",
      "[10:02:10]     更新: 新ISO版リリース時に再書込み",
      "[10:02:10]     廃棄: 3世代前の版は物理破壊処分",
      "[10:02:10]     台帳: USB ID / 作成日 / 版 / 使用先を記録",
      "[10:02:11] ✅ USBメモリ配布プロセス完了",
    ]
  },
  { id: "pxe", label: "PXE/iPXE + HTTP", method: "ネットワークブート配布", desc: "本社・支店・同一LAN内の複数台展開", icon: "🌐", color: "#f59e0b", phase: 4,
    steps: [
      { label: "PXE サーバー用意", desc: "Construction-DX-OS を PXE サーバーとして構築" },
      { label: "Firewall 設定", desc: "TFTP(69)/HTTP(80)/DHCP(67-68) ポート開放" },
      { label: "DHCP 設定", desc: "BIOS/UEFI 両対応の PXE ブート設定" },
      { label: "DHCP Relay 設定", desc: "複数サブネット対応 (支店LAN向け)" },
      { label: "ISO からブートファイル抽出", desc: "vmlinuz / initrd.gz を ISO から取得" },
      { label: "TFTP 配置", desc: "BIOS (pxelinux) + UEFI (grub-efi) 両対応" },
      { label: "iPXE チェインロード設定", desc: "DHCP → iPXE への chainload 構成" },
      { label: "HTTP 配置", desc: "ISO・preseed を HTTP で配信 (帯域制御付き)" },
      { label: "iPXE メニュー作成", desc: "profile 別に起動項目を分ける" },
      { label: "サービス管理", desc: "dnsmasq / nginx / tftp の systemd 管理" },
      { label: "ネットワークブート", desc: "クライアント PC をネットワークブート" },
      { label: "ファイル取得確認", desc: "HTTP 経由で必要ファイル取得を確認" },
      { label: "端末登録確認", desc: "中央管理 WebUI で端末登録を確認" },
      { label: "PXE サーバー監視", desc: "サービス稼働状態を cdx-server から監視" },
      { label: "ログ保存", desc: "HTTP/DHCP/TFTP ログを保存" },
      { label: "ロールバック手順確認", desc: "インストール失敗時の対応フロー確認" },
    ],
    logs: [
      "[13:00:00] === PXE/iPXE + HTTP 配布 ===",
      "[13:00:01] Step 1: PXE サーバー用意 (Construction-DX-OS がPXEサーバー)",
      "[13:00:02]   サーバー: 192.168.1.1 (新宿本社 LAN)",
      "[13:00:03]   OS: Debian 13 (Construction-DX-OS サーバー)",
      "[13:00:04]   必要パッケージインストール:",
      "[13:00:04]     apt install -y dnsmasq nginx tftpd-hpa syslinux-common pxelinux grub-efi-amd64-signed shim-signed",
      "[13:00:05]   対象ネットワーク: 192.168.1.0/24 (本社LAN)",
      "",
      "[13:00:06] Step 2: Firewall 設定 (nftables/ufw)",
      "[13:00:07]   PXEサーバーに必要なポートを開放:",
      "[13:00:07]     ufw allow 67/udp   # DHCP server",
      "[13:00:07]     ufw allow 68/udp   # DHCP client",
      "[13:00:07]     ufw allow 69/udp   # TFTP",
      "[13:00:07]     ufw allow 80/tcp   # HTTP (ISO/preseed配信)",
      "[13:00:07]     ufw allow 4011/udp # PXE proxy DHCP (iPXE chainload)",
      "[13:00:08]   ufw reload ✅",
      "[13:00:09]   nftables ルール確認:",
      "[13:00:09]     nft list ruleset | grep -E '(67|68|69|80|4011)' ✅",
      "",
      "[13:00:10] Step 3: DHCP 設定 (BIOS/UEFI 両対応)",
      "[13:00:11]   /etc/dnsmasq.d/pxe.conf:",
      "[13:00:11]     # 基本設定",
      "[13:00:11]     dhcp-range=192.168.1.100,192.168.1.200,255.255.255.0,12h",
      "[13:00:11]     dhcp-option=option:dns-server,192.168.1.1",
      "[13:00:12]     enable-tftp",
      "[13:00:12]     tftp-root=/srv/tftp",
      "[13:00:13]     # BIOS クライアント → pxelinux.0",
      "[13:00:13]     dhcp-match=set:bios,option:client-arch,0",
      "[13:00:13]     dhcp-boot=tag:bios,pxelinux.0",
      "[13:00:14]     # UEFI クライアント → grubnetx64.efi.signed",
      "[13:00:14]     dhcp-match=set:efi64,option:client-arch,7",
      "[13:00:14]     dhcp-match=set:efi64,option:client-arch,9",
      "[13:00:14]     dhcp-boot=tag:efi64,grub/grubnetx64.efi.signed",
      "[13:00:15]   BIOS/UEFI 自動判別設定完了 ✅",
      "[13:00:16]   systemctl restart dnsmasq ✅",
      "",
      "[13:00:17] Step 4: DHCP Relay 設定 (複数サブネット対応)",
      "[13:00:18]   支店LAN (192.168.2.0/24, 192.168.3.0/24) からの PXE ブート対応:",
      "[13:00:19]   支店ルーターに DHCP Relay Agent 設定:",
      "[13:00:19]     ip helper-address 192.168.1.1   (Cisco IOS)",
      "[13:00:19]     dhcp-relay 192.168.1.1          (YAMAHA RTX)",
      "[13:00:20]   dnsmasq 追加設定:",
      "[13:00:20]     dhcp-range=192.168.2.100,192.168.2.200,255.255.255.0,12h",
      "[13:00:20]     dhcp-range=192.168.3.100,192.168.3.200,255.255.255.0,12h",
      "[13:00:21]   ⚠️ 既存DHCP サーバーとの競合に注意 — dnsmasq を proxy モードにするか、既存を停止",
      "[13:00:22]   DHCP Relay テスト (支店VLANから): ✅ 応答確認",
      "",
      "[13:00:23] Step 5: ISO からブートファイル抽出",
      "[13:00:24]   ISO マウント:",
      "[13:00:24]     mkdir -p /mnt/cdx-iso",
      "[13:00:24]     mount -o loop cdx-os-standard-v1.0.0-rc2.iso /mnt/cdx-iso",
      "[13:00:25]   vmlinuz 抽出:",
      "[13:00:25]     cp /mnt/cdx-iso/install.amd/vmlinuz /srv/tftp/boot/vmlinuz",
      "[13:00:26]   initrd.gz 抽出:",
      "[13:00:26]     cp /mnt/cdx-iso/install.amd/initrd.gz /srv/tftp/boot/initrd.gz",
      "[13:00:27]   UEFI 用カーネル:",
      "[13:00:27]     cp /mnt/cdx-iso/install.amd/vmlinuz /srv/tftp/grub/vmlinuz",
      "[13:00:27]     cp /mnt/cdx-iso/install.amd/initrd.gz /srv/tftp/grub/initrd.gz",
      "[13:00:28]   umount /mnt/cdx-iso",
      "[13:00:29]   ✅ ブートファイル抽出完了",
      "",
      "[13:00:30] Step 6: TFTP 配置 (BIOS + UEFI 両対応)",
      "[13:00:31]   /srv/tftp/ ディレクトリ構成:",
      "[13:00:31]     ├── pxelinux.0                    (BIOS ブートローダー)",
      "[13:00:31]     ├── ldlinux.c32                   (SYSLINUX モジュール)",
      "[13:00:31]     ├── menu.c32                      (メニューモジュール)",
      "[13:00:31]     ├── libutil.c32                   (ユーティリティ)",
      "[13:00:31]     ├── pxelinux.cfg/",
      "[13:00:31]     │   └── default                   (BIOS 用メニュー)",
      "[13:00:31]     ├── grub/",
      "[13:00:31]     │   ├── grubnetx64.efi.signed    (UEFI ブートローダー)",
      "[13:00:31]     │   ├── grub.cfg                  (UEFI 用メニュー)",
      "[13:00:31]     │   ├── vmlinuz                   (カーネル)",
      "[13:00:31]     │   └── initrd.gz                 (初期RAM)",
      "[13:00:31]     └── boot/",
      "[13:00:31]         ├── vmlinuz                    (カーネル - BIOS用)",
      "[13:00:31]         └── initrd.gz                  (初期RAM - BIOS用)",
      "[13:00:32]   BIOS 用ファイルコピー:",
      "[13:00:32]     cp /usr/lib/PXELINUX/pxelinux.0 /srv/tftp/",
      "[13:00:32]     cp /usr/lib/syslinux/modules/bios/{ldlinux,menu,libutil}.c32 /srv/tftp/",
      "[13:00:33]   UEFI 用ファイルコピー:",
      "[13:00:33]     cp /usr/lib/shim/shimx64.efi.signed /srv/tftp/grub/",
      "[13:00:33]     cp /usr/lib/grub/x86_64-efi-signed/grubnetx64.efi.signed /srv/tftp/grub/",
      "[13:00:34]   TFTP ファイル配置完了 ✅",
      "",
      "[13:00:35] Step 7: iPXE チェインロード設定",
      "[13:00:36]   iPXE によるHTTP経由の高速ブート対応:",
      "[13:00:36]   /srv/tftp/boot.ipxe:",
      "[13:00:36]     #!ipxe",
      "[13:00:36]     menu Construction-DX-OS Network Install",
      "[13:00:37]     item standard [standard] 本社・支店向け",
      "[13:00:37]     item field    [field] 現場向け",
      "[13:00:37]     item kiosk    [kiosk] 共用端末向け",
      "[13:00:37]     choose target && goto ${target}",
      "[13:00:38]     :standard",
      "[13:00:38]     kernel http://192.168.1.1/boot/vmlinuz",
      "[13:00:38]     initrd http://192.168.1.1/boot/initrd.gz",
      "[13:00:38]     imgargs vmlinuz auto=true url=http://192.168.1.1/preseed/standard.cfg",
      "[13:00:38]     boot",
      "[13:00:39]   dnsmasq iPXE chainload 設定:",
      "[13:00:39]     dhcp-userclass=set:ipxe,iPXE",
      "[13:00:39]     dhcp-boot=tag:ipxe,http://192.168.1.1/boot.ipxe",
      "[13:00:39]     dhcp-boot=tag:!ipxe,undionly.kpxe",
      "[13:00:40]   ✅ iPXE チェインロード設定完了",
      "",
      "[13:00:41] Step 8: HTTP 配置 (帯域制御付き)",
      "[13:00:42]   /etc/nginx/sites-enabled/cdx-pxe.conf:",
      "[13:00:42]     server {",
      "[13:00:42]       listen 80;",
      "[13:00:42]       server_name pxe.cdx.internal;",
      "[13:00:43]       # ISO 配信 (帯域制御: 同時10台対応)",
      "[13:00:43]       location /iso/ {",
      "[13:00:43]         root /srv/cdx;",
      "[13:00:43]         autoindex on;",
      "[13:00:43]         limit_rate 100m;             # 100MB/s per connection",
      "[13:00:43]         limit_conn addr 10;          # 同一IPから最大10接続",
      "[13:00:43]       }",
      "[13:00:44]       # preseed / iPXE スクリプト",
      "[13:00:44]       location /preseed/ { root /srv/cdx; }",
      "[13:00:44]       location /boot/    { root /srv/cdx; }",
      "[13:00:44]       # アクセスログ (配布追跡用)",
      "[13:00:44]       access_log /var/log/nginx/cdx-pxe-access.log combined;",
      "[13:00:44]       error_log  /var/log/nginx/cdx-pxe-error.log;",
      "[13:00:44]     }",
      "[13:00:45]   帯域制御設定 (http ブロック):",
      "[13:00:45]     limit_conn_zone $binary_remote_addr zone=addr:10m;",
      "[13:00:46]   ISO 配置: /srv/cdx/iso/cdx-os-standard-v1.0.0-rc2.iso",
      "[13:00:47]   preseed 配置: /srv/cdx/preseed/{standard,field,kiosk}.cfg",
      "[13:00:48]   nginx -t ✅ / systemctl reload nginx ✅",
      "",
      "[13:00:49] Step 9: iPXE メニュー作成 (BIOS + UEFI)",
      "[13:00:50]   BIOS 用 — pxelinux.cfg/default:",
      "[13:00:50]     UI menu.c32",
      "[13:00:50]     MENU TITLE 建設DX OS インストール (BIOS)",
      "[13:00:51]     LABEL standard",
      "[13:00:51]       MENU LABEL [standard] 本社・支店向け",
      "[13:00:51]       KERNEL boot/vmlinuz",
      "[13:00:51]       APPEND initrd=boot/initrd.gz url=http://192.168.1.1/preseed/standard.cfg",
      "[13:00:52]     LABEL field",
      "[13:00:52]       MENU LABEL [field] 現場向け",
      "[13:00:52]       KERNEL boot/vmlinuz",
      "[13:00:52]       APPEND initrd=boot/initrd.gz url=http://192.168.1.1/preseed/field.cfg",
      "[13:00:53]     LABEL kiosk",
      "[13:00:53]       MENU LABEL [kiosk] 共用端末向け",
      "[13:00:53]       KERNEL boot/vmlinuz",
      "[13:00:53]       APPEND initrd=boot/initrd.gz url=http://192.168.1.1/preseed/kiosk.cfg",
      "[13:00:54]   UEFI 用 — grub/grub.cfg:",
      "[13:00:54]     menuentry '[standard] 本社・支店向け' {",
      "[13:00:54]       linux grub/vmlinuz auto=true url=http://192.168.1.1/preseed/standard.cfg",
      "[13:00:54]       initrd grub/initrd.gz",
      "[13:00:54]     }",
      "[13:00:55]     menuentry '[field] 現場向け' {",
      "[13:00:55]       linux grub/vmlinuz auto=true url=http://192.168.1.1/preseed/field.cfg",
      "[13:00:55]       initrd grub/initrd.gz",
      "[13:00:55]     }",
      "[13:00:56]     menuentry '[kiosk] 共用端末向け' {",
      "[13:00:56]       linux grub/vmlinuz auto=true url=http://192.168.1.1/preseed/kiosk.cfg",
      "[13:00:56]       initrd grub/initrd.gz",
      "[13:00:56]     }",
      "[13:00:57]   ✅ BIOS/UEFI 両対応メニュー作成完了",
      "",
      "[13:01:00] Step 10: サービス管理 (systemd)",
      "[13:01:01]   PXE サーバー関連サービス:",
      "[13:01:01]     systemctl enable --now dnsmasq.service     ✅ DHCP+TFTP",
      "[13:01:01]     systemctl enable --now nginx.service       ✅ HTTP配信",
      "[13:01:01]     systemctl enable --now tftpd-hpa.service   ✅ TFTP (fallback)",
      "[13:01:02]   サービス自動起動確認:",
      "[13:01:02]     systemctl is-enabled dnsmasq: enabled ✅",
      "[13:01:02]     systemctl is-enabled nginx:   enabled ✅",
      "[13:01:03]   systemd unit ファイル (カスタム監視):",
      "[13:01:03]     /etc/systemd/system/cdx-pxe-health.timer (5分間隔)",
      "[13:01:03]     /etc/systemd/system/cdx-pxe-health.service (ヘルスチェック)",
      "",
      "[13:01:05] Step 11: ネットワークブート",
      "[13:01:06]   対象 PC の BIOS/UEFI → Network Boot 有効",
      "[13:01:07]   ⚠️ UEFI の場合: Secure Boot 対応 (shimx64.efi.signed 経由)",
      "[13:01:08]   PC 起動 → DHCP 取得 → BIOS/UEFI 自動判別 → ブートローダーロード",
      "[13:01:09]   メニュー表示: [standard] [field] [kiosk]",
      "[13:01:10]   standard 選択 → インストール開始",
      "",
      "[13:01:12] Step 12: ファイル取得確認",
      "[13:01:13]   HTTP アクセスログ:",
      "[13:01:13]     192.168.1.105 GET /preseed/standard.cfg 200",
      "[13:01:13]     192.168.1.105 GET /iso/cdx-os-standard-v1.0.0-rc2.iso 200 (1.8GB)",
      "[13:01:14]   TFTP ログ:",
      "[13:01:14]     192.168.1.105 pxelinux.0 → OK",
      "[13:01:14]     192.168.1.105 boot/vmlinuz → OK",
      "[13:01:15]   ✅ 必要ファイル全て取得成功",
      "[13:01:20]   インストール完了 — 再起動",
      "",
      "[13:01:25] Step 13: 端末登録確認",
      "[13:01:26]   中央管理 WebUI → デバイス一覧",
      "[13:01:27]   新端末出現: CDX-HQ-NEW-001 ✅",
      "[13:01:28]   heartbeat: 受信中 ✅",
      "[13:01:29]   AppArmor: enforced ✅",
      "",
      "[13:01:30] Step 14: PXE サーバー監視",
      "[13:01:31]   cdx-server からの監視設定:",
      "[13:01:31]     GET http://192.168.1.1:80/health → HTTP 200 ✅",
      "[13:01:32]     TFTP ポート (69/udp) 疎通確認 ✅",
      "[13:01:33]     DHCP 応答テスト: nmap --script broadcast-dhcp-discover ✅",
      "[13:01:34]   Prometheus メトリクス:",
      "[13:01:34]     cdx_pxe_dhcp_offers_total: 12",
      "[13:01:34]     cdx_pxe_tftp_transfers_total: 12",
      "[13:01:34]     cdx_pxe_http_iso_downloads_total: 8",
      "[13:01:35]   アラート設定:",
      "[13:01:35]     dnsmasq 停止 → critical アラート",
      "[13:01:35]     nginx 停止 → critical アラート",
      "[13:01:35]     TFTP 転送失敗 → warning アラート",
      "",
      "[13:01:37] Step 15: ログ保存",
      "[13:01:38]   HTTP アクセスログ: /var/log/nginx/cdx-pxe-access.log",
      "[13:01:39]   DHCP ログ: /var/log/dnsmasq.log",
      "[13:01:40]   TFTP ログ: /var/log/tftpd-hpa.log",
      "[13:01:41]   ログ保管先: /srv/cdx/logs/deploy-20260506/",
      "[13:01:42]   ログローテーション: logrotate 設定済み (7日保持)",
      "",
      "[13:01:43] Step 16: ロールバック手順確認",
      "[13:01:44]   📋 インストール失敗時の対応フロー:",
      "[13:01:44]     1. DHCP 未取得 → ケーブル/スイッチ/VLAN 確認",
      "[13:01:44]     2. TFTP 転送失敗 → tftp-hpa ログ確認 / ファイルパーミッション確認",
      "[13:01:44]     3. ISO ダウンロード失敗 → nginx error.log / ディスク容量確認",
      "[13:01:44]     4. preseed エラー → preseed.cfg 文法チェック / debconf-get-selections 確認",
      "[13:01:44]     5. インストール途中失敗 → Alt+F4 でログ確認 / メモリ不足チェック",
      "[13:01:45]     6. cdx-agent 登録失敗 → API エンドポイント疎通 / トークン有効性確認",
      "[13:01:46]   復旧手段:",
      "[13:01:46]     → USB メモリ配布 (Phase 3) にフォールバック",
      "[13:01:46]     → VM 環境で preseed.cfg を再検証 (Phase 2)",
      "[13:01:47] ✅ PXE/iPXE + HTTP 配布プロセス完了 (全16ステップ)",
    ]
  },
  { id: "pxe-auto", label: "PXE + preseed 完全自動", method: "ゼロタッチ配布", desc: "大量展開・5人IT部門での省力化", icon: "🚀", color: "#ef4444", phase: 5,
    steps: [
      { label: "preseed.cfg 作成", desc: "profile 別の preseed.cfg を作成" },
      { label: "PXE メニュー統合", desc: "BIOS/UEFI 両対応メニューに preseed 統合" },
      { label: "基本設定自動化", desc: "言語・キーボード・タイムゾーンを自動設定" },
      { label: "ディスク・ユーザー自動化", desc: "パーティション・ユーザー作成を自動化" },
      { label: "パッケージ自動投入", desc: "必要パッケージと初期設定を自動投入" },
      { label: "post-install 実行", desc: "ホスト名規則適用・cdx-agent インストール" },
      { label: "自動登録", desc: "初回起動時に中央管理へ自動登録" },
      { label: "秘密情報の安全管理", desc: "登録トークンは期限付き取得方式を使用" },
      { label: "帯域・並列制御", desc: "同時インストール台数の帯域管理" },
      { label: "PXEサーバー監視", desc: "サービス稼働をcdx-serverから常時監視" },
      { label: "小規模リハーサル", desc: "5台程度で事前検証を実施" },
      { label: "ロールバック手順", desc: "失敗時の切り戻しフロー確認" },
      { label: "本展開・記録", desc: "成功率・失敗理由・所要時間を記録" },
    ],
    logs: [
      "[14:00:00] === PXE + preseed 完全自動化 (ゼロタッチ) ===",
      "[14:00:01] Step 1: preseed.cfg 作成 (profile別)",
      "[14:00:02]   standard.cfg 生成中...",
      "[14:00:03]   field.cfg 生成中...",
      "[14:00:04]   kiosk.cfg 生成中...",
      "",
      "[14:00:05] Step 2: PXE メニューに preseed 自動インストール項目を追加",
      "[14:00:06]   BIOS 用 — pxelinux.cfg/default:",
      "[14:00:06]     LABEL standard-auto",
      "[14:00:06]       MENU LABEL [standard] 完全自動インストール",
      "[14:00:06]       KERNEL boot/vmlinuz",
      "[14:00:06]       APPEND initrd=boot/initrd.gz auto=true priority=critical url=http://192.168.1.1/preseed/standard.cfg",
      "[14:00:07]   UEFI 用 — grub/grub.cfg:",
      "[14:00:07]     menuentry '[standard] 完全自動インストール' {",
      "[14:00:07]       linux grub/vmlinuz auto=true priority=critical url=http://192.168.1.1/preseed/standard.cfg",
      "[14:00:07]       initrd grub/initrd.gz",
      "[14:00:07]     }",
      "[14:00:08]   ✅ BIOS/UEFI 両対応メニュー統合完了",
      "",
      "[14:00:09] Step 3: 基本設定自動化",
      "[14:00:10]   preseed.cfg — ロケール・キーボード・タイムゾーン:",
      "[14:00:10]     d-i debian-installer/locale string ja_JP.UTF-8",
      "[14:00:10]     d-i keyboard-configuration/xkb-keymap select jp",
      "[14:00:10]     d-i time/zone string Asia/Tokyo",
      "[14:00:10]     d-i clock-setup/ntp boolean true",
      "",
      "[14:00:11] Step 4: ディスク・ユーザー自動化",
      "[14:00:12]   preseed.cfg — パーティション:",
      "[14:00:12]     d-i partman-auto/method string regular",
      "[14:00:12]     d-i partman-auto/choose_recipe select atomic",
      "[14:00:12]     d-i partman/confirm boolean true",
      "[14:00:12]     d-i partman/confirm_nooverwrite boolean true",
      "[14:00:13]   preseed.cfg — ユーザー:",
      "[14:00:13]     d-i passwd/root-login boolean false",
      "[14:00:13]     d-i passwd/user-fullname string CDX User",
      "[14:00:13]     d-i passwd/username string cdxuser",
      "[14:00:13]     d-i passwd/user-password-crypted string $6$rounds=...",
      "",
      "[14:00:14] Step 5: パッケージ自動投入",
      "[14:00:15]   preseed.cfg — パッケージ選択:",
      "[14:00:15]     d-i pkgsel/include string xfce4 xfce4-terminal chromium onlyoffice-desktopeditors",
      "[14:00:15]     d-i pkgsel/include string cdx-agent apparmor apparmor-utils nftables",
      "",
      "[14:00:16] Step 6: post-install 実行",
      "[14:00:17]   preseed.cfg — late_command:",
      "[14:00:17]     d-i preseed/late_command string \\",
      "[14:00:18]       # ホスト名規則適用 (拠点コード-連番)",
      "[14:00:18]       in-target bash -c 'hostnamectl set-hostname cdx-$(cat /sys/class/dmi/id/product_serial | tail -c 6)'; \\",
      "[14:00:19]       # cdx-agent インストール・有効化",
      "[14:00:19]       in-target bash -c '\\",
      "[14:00:19]         systemctl enable cdx-agent-heartbeat.timer; \\",
      "[14:00:19]         systemctl enable cdx-agent-inventory.timer; \\",
      "[14:00:20]         apparmor_parser -r /etc/apparmor.d/usr.bin.cdx-agent; \\",
      "[14:00:20]       '",
      "",
      "[14:00:21] Step 7: 自動登録",
      "[14:00:22]   初回起動時 cdx-agent 自動登録フロー:",
      "[14:00:22]     1. cdx-agent が API エンドポイントに接続",
      "[14:00:22]     2. POST /api/v1/devices/register (Bearer Token)",
      "[14:00:22]     3. shared_secret 受領 → /etc/cdx-agent/shared_secret に保存",
      "[14:00:22]     4. heartbeat timer 起動 → サーバーで端末出現確認",
      "",
      "[14:00:23] Step 8: 秘密情報の安全管理",
      "[14:00:24]   ⚠️ 登録トークン・秘密情報の管理ルール:",
      "[14:00:24]     ✅ ISO/preseed に直書きしない",
      "[14:00:24]     ✅ 期限付き取得方式を使用:",
      "[14:00:24]       → post-install 時に一時トークン API から取得",
      "[14:00:24]       → トークン有効期限: 30分",
      "[14:00:24]       → 登録完了後にトークンを自動無効化",
      "[14:00:25]     ✅ CDX_REGISTRATION_TOKEN は環境変数で管理",
      "",
      "[14:00:26] Step 9: 帯域・並列制御",
      "[14:00:27]   同時インストール時の帯域管理設定:",
      "[14:00:27]   nginx 帯域制御 (Phase 4 で設定済み):",
      "[14:00:27]     limit_rate 100m;          # 100MB/s per connection",
      "[14:00:27]     limit_conn addr 10;       # 同一IPから最大10接続",
      "[14:00:28]   推奨同時展開台数:",
      "[14:00:28]     1GbE LAN: 最大 8台並列 (ISO 1.8GB × 8 = ~15分)",
      "[14:00:28]     10GbE LAN: 最大 30台並列",
      "[14:00:29]   QoS 設定 (オプション):",
      "[14:00:29]     tc qdisc add dev eth0 root tbf rate 800mbit burst 256k latency 50ms",
      "[14:00:30]   ⚠️ 業務時間帯を避けて展開推奨 (昼休み or 夜間)",
      "",
      "[14:00:31] Step 10: PXE サーバー監視",
      "[14:00:32]   cdx-server からの監視項目:",
      "[14:00:32]     サービス稼働: dnsmasq / nginx / tftpd-hpa",
      "[14:00:33]     HTTP ヘルスチェック: GET http://pxe-server/health",
      "[14:00:33]     TFTP ポート疎通: 69/udp",
      "[14:00:34]     DHCP 応答テスト: broadcast-dhcp-discover",
      "[14:00:34]   Prometheus メトリクス連携:",
      "[14:00:34]     cdx_pxe_service_up{service='dnsmasq'}: 1",
      "[14:00:34]     cdx_pxe_service_up{service='nginx'}: 1",
      "[14:00:34]     cdx_pxe_active_installs: 0",
      "[14:00:35]   アラートルール:",
      "[14:00:35]     dnsmasq down > 1min → critical (PXE 不能)",
      "[14:00:35]     nginx down > 1min → critical (ISO配信不能)",
      "[14:00:35]     disk usage > 90% → warning (ISO保管領域)",
      "[14:00:36]   ✅ 監視設定完了",
      "",
      "[14:00:37] Step 11: 小規模リハーサル",
      "[14:00:38]   対象: 5台 (大阪支店 テスト機)",
      "[14:00:39]   リハーサル開始...",
      "[14:00:40]     端末 1/5: PXE ブート → UEFI 検出 → grub メニュー → インストール開始",
      "[14:00:41]     端末 2/5: PXE ブート → BIOS 検出 → pxelinux メニュー → インストール開始",
      "[14:00:42]     端末 3/5: PXE ブート → UEFI 検出 → インストール開始",
      "[14:00:43]     端末 4/5: PXE ブート → UEFI 検出 → インストール開始",
      "[14:00:44]     端末 5/5: PXE ブート → BIOS 検出 → インストール開始",
      "[14:00:55]     端末 1/5: インストール完了 → cdx-agent 登録 ✅",
      "[14:00:56]     端末 2/5: インストール完了 → cdx-agent 登録 ✅",
      "[14:00:57]     端末 3/5: インストール完了 → cdx-agent 登録 ✅",
      "[14:00:58]     端末 4/5: インストール完了 → cdx-agent 登録 ✅",
      "[14:00:59]     端末 5/5: インストール完了 → cdx-agent 登録 ✅",
      "[14:01:00]   リハーサル結果: 5/5 成功 (成功率 100%)",
      "[14:01:01]   BIOS端末: 2台 / UEFI端末: 3台 — 両方正常動作 ✅",
      "[14:01:02]   平均所要時間: 23分/台",
      "",
      "[14:01:03] Step 12: ロールバック手順",
      "[14:01:04]   📋 インストール失敗時の対応フロー:",
      "[14:01:04]     1. PXE ブート失敗 → DHCP/TFTP ログ確認 → ケーブル/VLAN チェック",
      "[14:01:04]     2. UEFI ブート失敗 → Secure Boot 設定確認 → shimx64 パス確認",
      "[14:01:04]     3. preseed エラー → debconf-get-selections で検証 → cfg 修正",
      "[14:01:05]     4. パッケージ取得失敗 → HTTP ログ確認 → APT ミラー疎通チェック",
      "[14:01:05]     5. post-install 失敗 → /var/log/installer/syslog 確認",
      "[14:01:05]     6. cdx-agent 登録失敗 → API エンドポイント疎通 → トークン有効性確認",
      "[14:01:06]   復旧手段:",
      "[14:01:06]     → USB メモリ配布 (Phase 3) にフォールバック",
      "[14:01:06]     → VM で preseed.cfg を再検証 (Phase 2)",
      "[14:01:06]     → 失敗端末のみ手動で PXE 再実行",
      "",
      "[14:01:08] Step 13: 本展開・記録",
      "[14:01:09]   📋 展開記録:",
      "[14:01:09]     リハーサル: 5台 / 成功率 100%",
      "[14:01:09]     BIOS/UEFI混在: 正常対応確認",
      "[14:01:09]     失敗理由: なし",
      "[14:01:09]     平均所要時間: 23分/台",
      "[14:01:10]     推定本展開時間: 30台 × 23分 ÷ 8並列 (1GbE) = 約1.5時間",
      "[14:01:11]   帯域使用量: ピーク 800Mbps (8台並列時)",
      "[14:01:12]   PXE サーバー負荷: CPU 15% / MEM 2.1GB / Disk I/O 正常",
      "[14:01:13]   → 本展開承認後、対象端末の電源を ON にしてください",
      "[14:01:14] ✅ PXE + preseed 完全自動化 準備完了 (全13ステップ)",
    ]
  },
];

const IsoPage = () => {
  const [selected, setSelected] = React.useState(null);
  const [showNew, setShowNew] = React.useState(false);
  const [distMethod, setDistMethod] = React.useState(null);
  const [distRunning, setDistRunning] = React.useState(false);
  const [distStep, setDistStep] = React.useState(-1);
  const [distLogLines, setDistLogLines] = React.useState([]);
  const [distIso, setDistIso] = React.useState("");
  const logRef = React.useRef(null);
  const job = selected ? ISO_JOBS_DATA.find(j => j.id === selected) : null;
  const dm = distMethod ? DIST_METHODS.find(m => m.id === distMethod) : null;

  const startDistribution = () => {
    const currentDm = DIST_METHODS.find(m => m.id === distMethod);
    if (!currentDm || !distIso) return;
    setDistRunning(true);
    setDistStep(0);
    setDistLogLines([]);
    let idx = 0;
    const logs = currentDm.logs;
    const stepCount = currentDm.steps.length;
    const interval = setInterval(() => {
      if (idx < logs.length) {
        const logLine = logs[idx];
        setDistLogLines(prev => [...prev, logLine]);
        const stepIdx = Math.min(Math.floor((idx / logs.length) * stepCount), stepCount - 1);
        setDistStep(stepIdx);
        idx++;
      } else {
        clearInterval(interval);
        setDistStep(stepCount);
        setDistRunning(false);
      }
    }, 250);
  };

  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [distLogLines]);

  // Distribution method detail view
  if (dm) {
    const successIsos = ISO_JOBS_DATA.filter(j => j.status === "succeeded");
    return (
      <div>
        <button onClick={() => { setDistMethod(null); setDistRunning(false); setDistStep(-1); setDistLogLines([]); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← ISO 配布一覧へ戻る</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>{dm.icon}</span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>{dm.label}</h2>
            <p style={{ fontSize: 12, color: dm.color, fontWeight: 600, margin: "2px 0 0" }}>{dm.method}</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{dm.desc}</p>
          </div>
          <div style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 6, background: "#f1f5f9", fontSize: 11, color: "#64748b" }}>
            導入フェーズ {dm.phase}/5
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>配布設定</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>対象 ISO</label>
                <select value={distIso} onChange={e => setDistIso(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#0f172a" }}>
                  <option value="">ISO を選択...</option>
                  {successIsos.map(j => (
                    <option key={j.id} value={j.id}>{j.profile} — #{j.id.slice(0, 8)} ({j.gitRef}, {j.size})</option>
                  ))}
                </select>
              </div>
              {(dm.id === "pxe" || dm.id === "pxe-auto") && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>対象ネットワーク</label>
                  <input type="text" defaultValue="192.168.1.0/24" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxSizing: "border-box" }} />
                </div>
              )}
              {dm.id === "pxe-auto" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>展開台数</label>
                  <input type="number" defaultValue={10} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxSizing: "border-box" }} />
                </div>
              )}
              {dm.id === "usb" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>書込みツール</label>
                  <select style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}>
                    <option>Rufus (Windows)</option>
                    <option>dd (Linux)</option>
                    <option>balenaEtcher (クロスプラットフォーム)</option>
                  </select>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>メモ</label>
                <textarea rows={2} placeholder="配布の目的や対象..." style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, resize: "vertical", boxSizing: "border-box" }}></textarea>
              </div>
              <button onClick={startDistribution} disabled={!distIso || distRunning} style={{
                width: "100%", padding: "10px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: distIso && !distRunning ? "pointer" : "not-allowed",
                background: distIso && !distRunning ? dm.color : "#e2e8f0", color: distIso && !distRunning ? "#fff" : "#94a3b8"
              }}>
                {distRunning ? "実行中..." : distStep >= (dm.steps?.length || 0) ? "✅ 完了 — 再実行" : "配布プロセス開始"}
              </button>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>プロセスステップ ({dm.steps.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {dm.steps.map((s, i) => {
                  const done = distStep > i;
                  const active = distStep === i;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, background: active ? `${dm.color}10` : done ? "#f0fdf4" : "#f8fafc", border: active ? `1.5px solid ${dm.color}` : "1.5px solid transparent" }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
                        background: done ? "#22c55e" : active ? dm.color : "#e8ecf1", color: (done || active) ? "#fff" : "#94a3b8"
                      }}>{done ? "✓" : i + 1}</div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: active ? dm.color : done ? "#22c55e" : "#475569" }}>{s.label}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8" }}>{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...cardStyle, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>配布プロセスログ</div>
                {distRunning && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: dm.color, fontWeight: 500 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: dm.color, animation: "pulse 1.2s ease-in-out infinite" }}></span>実行中...
                </span>}
                {!distRunning && distStep >= (dm.steps?.length || 0) && distLogLines.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e" }}>✅ 完了</span>}
              </div>
              {distLogLines.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 13 }}>
                  ISO を選択して「配布プロセス開始」をクリック
                </div>
              ) : (
                <pre ref={logRef} style={{ background: "#0f172a", color: "#e2e8f0", padding: "14px 16px", borderRadius: 8, fontSize: 11, lineHeight: 1.65, flex: 1, overflowY: "auto", margin: 0, minHeight: 300, maxHeight: 520 }}>
                  {distLogLines.map((line, i) => {
                    if (typeof line !== 'string') return null;
                    const isSuccess = line.includes("✅");
                    const isWarn = line.includes("⚠️");
                    const isHeader = line.includes("===");
                    const isStep = line.startsWith("[") && line.includes("] Step ");
                    const isCheck = line.includes("□");
                    const isTree = line.includes("├") || line.includes("└") || line.includes("│");
                    const isConfig = line.includes("d-i ") || line.includes("dhcp-") || line.includes("LABEL ") || line.includes("KERNEL ") || line.includes("APPEND ") || line.includes("MENU ");
                    const color = isHeader ? "#93c5fd" : isSuccess ? "#4ade80" : isWarn ? "#fbbf24" : isStep ? "#c4b5fd" : isConfig ? "#67e8f9" : isCheck ? "#94a3b8" : isTree ? "#64748b" : "#e2e8f0";
                    const fontWeight = (isHeader || isStep) ? "bold" : "normal";
                    return <div key={i} style={{ color, fontWeight }}>{line}</div>;
                  })}
                  {distRunning && <span style={{ color: dm.color }}>▌</span>}
                </pre>
              )}
            </div>
            {distStep >= (dm.steps?.length || 0) && distLogLines.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>配布結果サマリー</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>完了</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>ステータス</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{dm.steps.length}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>ステップ</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{distLogLines.length}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>ログ行数</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: dm.color }}>Phase {dm.phase}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>導入順</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button style={{ padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>ログをダウンロード</button>
                  <button style={{ padding: "6px 14px", borderRadius: 6, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" }}>監査ログに記録</button>
                  {dm.phase < 5 && (
                    <button onClick={() => { const next = DIST_METHODS.find(m => m.phase === dm.phase + 1); if (next) { setDistMethod(next.id); setDistStep(-1); setDistLogLines([]); setDistIso(""); } }}
                      style={{ padding: "6px 14px", borderRadius: 6, background: "#f8fafc", color: "#2563eb", border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      次の導入フェーズへ →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // New build form
  if (showNew) {
    return (
      <div>
        <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← ジョブ一覧へ戻る</button>
        <div style={{ ...cardStyle, maxWidth: 600 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>新規 ISO ビルド</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>プロファイル</label>
              <select style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#0f172a" }}>
                <option>standard — 本社・支店向け</option>
                <option>field — 現場向け（オフライン対応）</option>
                <option>kiosk — 共用端末向け（制限モード）</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Git Ref (ブランチ / タグ)</label>
              <input type="text" defaultValue="main" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#0f172a", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>メモ (任意)</label>
              <textarea rows={3} placeholder="ビルドの目的や備考..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#0f172a", resize: "vertical", boxSizing: "border-box" }}></textarea>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowNew(false)} style={{ padding: "8px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>ビルド開始</button>
              <button onClick={() => setShowNew(false)} style={{ padding: "8px 20px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" }}>キャンセル</button>
            </div>
          </div>
          {/* Build pipeline */}
          <div style={{ marginTop: 20, padding: "16px", background: "#f8fafc", borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 10 }}>ISO ビルドパイプライン</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "ジョブ作成", desc: "プロファイル・Git Ref 指定", icon: "📝" },
                { label: "Queue 投入", desc: "Redis Queue でキューイング", icon: "📤" },
                { label: "live-build", desc: "Debian build host で実行", icon: "🔨" },
                { label: "アーティファクト保管", desc: "MinIO/S3 に ISO+log+SHA256", icon: "🪣" },
                { label: "配布", desc: "DL / USB / VM / PXE", icon: "⬇️" },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  <div style={{ flex: 1, padding: "10px", background: "#fff", borderRadius: 8, textAlign: "center", border: "1px solid #e8ecf1" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", marginBottom: 1 }}>{s.label}</div>
                    <div style={{ fontSize: 9, color: "#94a3b8" }}>{s.desc}</div>
                  </div>
                  {i < 4 && <div style={{ display: "flex", alignItems: "center", color: "#cbd5e1", fontSize: 14 }}>→</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Job detail
  if (job) {
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← ジョブ一覧へ戻る</button>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>💿</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>ISO Build #{job.id.slice(0, 8)}</h2>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: jBg(job.status), color: jColor(job.status) }}>{jLabel(job.status)}</span>
          </div>
          <table style={{ width: "auto", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {[["ジョブID", job.id], ["プロファイル", job.profile], ["Git Ref", job.gitRef], ["要求者", job.requestedBy], ["作成日時", job.createdAt], ["開始日時", job.startedAt || "—"], ["完了日時", job.finishedAt || "—"], ["ISOサイズ", job.size], ["SHA256", job.sha256 || "—"], ["メモ", job.notes || "—"]].map(([k, v], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "8px 16px 8px 0", color: "#94a3b8", fontWeight: 500, fontSize: 12, width: 120 }}>{k}</td>
                  <td style={{ padding: "8px 0", color: "#0f172a", fontSize: 12 }}>{k === "Git Ref" || k === "SHA256" || k === "ジョブID" ? <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 3, fontSize: 11 }}>{v}</code> : v}</td>
                </tr>
              ))}
              {job.error && <tr><td style={{ padding: "8px 16px 8px 0", color: "#ef4444", fontWeight: 500, fontSize: 12 }}>エラー</td><td style={{ padding: "8px 0" }}><pre style={{ background: "#fef2f2", color: "#dc2626", padding: "8px 12px", borderRadius: 6, fontSize: 11, margin: 0, whiteSpace: "pre-wrap" }}>{job.error}</pre></td></tr>}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {job.status === "succeeded" && <button style={{ padding: "8px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>⬇ ISO をダウンロード</button>}
            {job.status === "running" && <button style={{ padding: "8px 16px", borderRadius: 8, background: "#dc2626", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🛑 キャンセル</button>}
          </div>
        </div>
        {job.status === "running" && (
          <div style={{ ...cardStyle, marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>ビルドログ (リアルタイム SSE)</div>
            <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: "14px 16px", borderRadius: 8, fontSize: 11, lineHeight: 1.6, maxHeight: 240, overflowY: "auto", margin: 0 }}>
{`[09:15:30] Starting ISO build for profile: field
[09:15:31] Git ref: main (commit a8243ba)
[09:15:32] Running: lb config --distribution bookworm --architectures amd64
[09:16:01] P: Setting up chroot environment
[09:16:45] P: Installing core packages (base/desktop/business/security/support)
[09:18:22] P: Running hooks 0100-0400
[09:19:12] P: Building ISO image...
[09:19:13] ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░ 72% — Creating squashfs...`}</pre>
          </div>
        )}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>監査ログ</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {["日時", "アクター", "アクション", "Request ID"].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {AUDIT_LOG.filter(a => job && (a.detail.includes(job.id.slice(0, 8)) || a.detail.includes(job.profile))).slice(0, 4).map((a, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>{a.at}</td>
                  <td style={{ ...tdStyle, color: "#475569" }}>{a.actor}</td>
                  <td style={{ ...tdStyle, color: "#475569" }}>{a.action}</td>
                  <td style={tdStyle}><code style={{ fontSize: 10, color: "#94a3b8" }}>{a.reqId}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>ISO 配布</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>プロファイル別 ISO のビルド・配布・ダウンロード管理</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding: "8px 18px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ 新規 ISO ビルド</button>
      </div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "総ビルド数", val: ISO_JOBS_DATA.length, color: "#2563eb" },
          { label: "成功", val: ISO_JOBS_DATA.filter(j => j.status === "succeeded").length, color: "#22c55e" },
          { label: "実行中", val: ISO_JOBS_DATA.filter(j => j.status === "running").length, color: "#3b82f6" },
          { label: "失敗", val: ISO_JOBS_DATA.filter(j => j.status === "failed").length, color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Job table */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>ビルドジョブ一覧</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8fafc" }}>
            {["ジョブID", "プロファイル", "Git Ref", "状態", "要求者", "作成日時", "完了日時", "サイズ"].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>{ISO_JOBS_DATA.map(j => (
            <tr key={j.id} style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer" }} onClick={() => setSelected(j.id)}
              onMouseEnter={e => e.currentTarget.style.background = "#fafbfd"} onMouseLeave={e => e.currentTarget.style.background = ""}>
              <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500 }}>{j.id.slice(0, 8)}</td>
              <td style={tdStyle}><span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" }}>{j.profile}</span></td>
              <td style={tdStyle}><code style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 3 }}>{j.gitRef}</code></td>
              <td style={tdStyle}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: jBg(j.status), color: jColor(j.status) }}>{jLabel(j.status)}</span></td>
              <td style={{ ...tdStyle, color: "#475569" }}>{j.requestedBy}</td>
              <td style={{ ...tdStyle, color: "#94a3b8" }}>{j.createdAt}</td>
              <td style={{ ...tdStyle, color: "#94a3b8" }}>{j.finishedAt || "—"}</td>
              <td style={{ ...tdStyle, color: "#94a3b8" }}>{j.size}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {/* Distribution methods */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>ISO 配布方法</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>導入順序: Phase 1→2→3→4→5</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {DIST_METHODS.sort((a, b) => a.phase - b.phase).map(m => (
            <div key={m.id} onClick={() => setDistMethod(m.id)} style={{ padding: "16px", background: "#f8fafc", borderRadius: 12, borderTop: `3px solid ${m.color}`, cursor: "pointer", transition: "all 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${m.color}20`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${m.color}15`, color: m.color }}>Phase {m.phase}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: m.color, marginBottom: 6 }}>{m.method}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, lineHeight: 1.4 }}>{m.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {m.steps.slice(0, 4).map((s, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#475569" }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", border: `1.5px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: m.color, flexShrink: 0 }}>{j + 1}</span>
                    {s.label}
                  </div>
                ))}
                {m.steps.length > 4 && <div style={{ fontSize: 10, color: "#94a3b8", paddingLeft: 19 }}>...他 {m.steps.length - 4} ステップ</div>}
              </div>
              <div style={{ marginTop: 10, padding: "6px 0", borderTop: "1px solid #e8ecf1", textAlign: "center", fontSize: 11, color: m.color, fontWeight: 600 }}>開始 →</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

window.IsoPage = IsoPage;

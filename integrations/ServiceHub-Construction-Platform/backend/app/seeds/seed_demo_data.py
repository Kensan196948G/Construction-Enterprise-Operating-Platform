"""
デモデータ投入スクリプト。
各テーブルが 10 件以上になるように不足分を追加する。

Usage:
    docker compose exec api python -m app.seeds.seed_demo_data
"""

import asyncio
import logging
import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import text

from app.db.base import AsyncSessionLocal

log = logging.getLogger(__name__)

INCIDENT_SEEDS = [
    (
        "工事管理システム応答遅延",
        "infrastructure",
        "high",
        "major",
        "in_progress",
        "CPU 使用率が 90% を超え、レスポンスが 5 秒以上になった。",
    ),
    (
        "写真アップロード失敗",
        "application",
        "medium",
        "minor",
        "open",
        "大容量ファイル（50MB 超）のアップロード時に 413 エラーが発生する。",
    ),
    (
        "日報提出通知が未送信",
        "application",
        "medium",
        "minor",
        "resolved",
        "メール通知が SMTP 設定変更後から届かなくなった。SMTP 認証情報を修正し解消。",
    ),
    (
        "現場端末 VPN 接続断",
        "infrastructure",
        "high",
        "major",
        "resolved",
        "渋谷現場の VPN が午前中に断続的に切断。ISP 側の障害だった。",
    ),
    (
        "ナレッジ検索 AI タイムアウト",
        "application",
        "low",
        "minor",
        "closed",
        "OpenAI API のレート制限に達しタイムアウト。バックオフロジックを追加。",
    ),
    (
        "原価入力フォームバリデーションエラー",
        "application",
        "medium",
        "minor",
        "open",
        "予算額に小数点を入力するとエラーになる。フロントのバリデーション修正待ち。",
    ),
    (
        "セキュリティスキャンで HIGH CVE 検出",
        "security",
        "critical",
        "critical",
        "resolved",
        "libcap2 / libsystemd0 の CVE。Dockerfile に apt-get upgrade を追加し解消。",
    ),
    (
        "ダッシュボード読み込み 30 秒超え",
        "application",
        "high",
        "major",
        "in_progress",
        "集計クエリが N+1 問題を起こしている。インデックス追加で対応中。",
    ),
    (
        "MinIO バケット容量 80% 超",
        "infrastructure",
        "medium",
        "minor",
        "open",
        "写真バケットが急増。不要写真の整理と容量拡張を検討中。",
    ),
    (
        "ログイン試行失敗の連続検出",
        "security",
        "high",
        "major",
        "resolved",
        "外部 IP からブルートフォース攻撃。IP ブロックルールを Nginx に追加。",
    ),
]

KNOWLEDGE_SEEDS = [
    (
        "建設業法の下請規制ポイント",
        "SAFETY",
        "建設業法における一括下請負の禁止（第22条）と例外規定をまとめた記事です。\n"
        "主要ポイント：\n1. 一括下請負は原則禁止\n2. 発注者の書面承諾で例外可\n"
        "3. 公共工事は全面禁止\n4. 違反時は建設業許可取消しの可能性あり",
        "建設業法,下請,法務",
    ),
    (
        "足場設置基準（労働安全衛生規則第570条）",
        "SAFETY",
        "足場の構造・使用に関する安全基準。床材の隙間は3cm以下、手すりは85cm以上、"
        "中桟は35cm〜50cmの高さに設置。壁つなぎは垂直5m・水平5.5m以内ごとに設置。",
        "足場,安全,労働安全衛生",
    ),
    (
        "生コンクリートの品質管理手順",
        "QUALITY",
        "スランプ試験・空気量試験・塩化物含有量試験の実施手順と合否判定基準。\n"
        "スランプ許容差：±2.5cm（呼び強度21以上）。塩化物量：0.30kg/m³以下。",
        "品質管理,コンクリート,試験",
    ),
    (
        "鉄筋の継手・定着長さ計算方法",
        "TECHNICAL",
        "SD345使用時の基本定着長は35d（d=鉄筋径）。重ね継手長は1.35L1（一般部）。"
        "フック付きの場合は定着長を5d短縮可。圧接継手の場合の品質確認フロー。",
        "鉄筋,継手,定着",
    ),
    (
        "現場安全朝礼の実施手順",
        "PROCEDURE",
        "毎朝8:00開始。内容：①前日の作業報告 ②本日の作業内容周知 "
        "③危険予知活動（KY活動）④体調確認 ⑤ヘルメット・安全帯の着用確認。"
        "記録は安全日誌に記入し保管（3年間）。",
        "安全朝礼,手順,KY活動",
    ),
    (
        "建設工事における廃棄物処理ルール",
        "PROCEDURE",
        "建設リサイクル法による特定建設資材の分別解体と再資源化義務。"
        "対象工事の閾値：解体工事80m²以上。マニフェスト（E票）の保管義務は5年間。",
        "廃棄物,リサイクル,建設",
    ),
    (
        "ヒヤリハット報告書の書き方",
        "SAFETY",
        "ヒヤリハットとは：事故には至らなかったが、ひやりとした・はっとした出来事。"
        "記載事項：発生日時・場所・状況・原因・対策。"
        "ハインリッヒの法則：1件の重大事故の背後に29件の軽微な事故・300件のヒヤリハット。",
        "ヒヤリハット,安全,報告",
    ),
    (
        "工程表（バーチャート）の作成方法",
        "PROCEDURE",
        "工程表の種類：バーチャート・ネットワーク工程表・出来高曲線。"
        "バーチャート作成手順：①工種分解→②所要日数算定→③施工順序決定→④作図。"
        "クリティカルパスを明示し、天候不順の予備日（10〜15%）を確保する。",
        "工程管理,バーチャート,スケジュール",
    ),
    (
        "コンクリート打設後の養生方法",
        "TECHNICAL",
        "普通ポルトランドセメント使用時の湿潤養生期間：5日以上（平均気温15℃以上）。"
        "寒中コンクリート：打設後5日間は5℃以上を保持。"
        "暑中コンクリート：打設後すぐに覆いをし、散水・養生シートで保護。",
        "養生,コンクリート,品質",
    ),
    (
        "建設現場の熱中症対策マニュアル",
        "SAFETY",
        "WBGT値28℃以上で作業中止を検討。対策：①こまめな水分・塩分補給（20〜30分ごと）"
        "②クールベスト等の冷却グッズ活用 ③日陰での休憩スペース確保 "
        "④健康管理者による巡回。救急搬送基準：意識障害・けいれんが発生した場合。",
        "熱中症,安全,夏季対策",
    ),
]

SAFETY_SEEDS = [
    ("DAILY", 15, 14, 1, "PASS", "鉄筋工事 安全確認。安全帯未着用1名を注意。"),
    ("WEEKLY", 42, 42, 0, "PASS", "週次定期点検。足場・手すりすべて良好。"),
    ("MONTHLY", 80, 78, 2, "COND", "月次総合点検。消火器の期限切れ2本を交換手配済み。"),
    ("DAILY", 15, 15, 0, "PASS", "渋谷現場 日次確認。全員ヘルメット・安全帯着用。"),
    (
        "DAILY",
        12,
        11,
        1,
        "COND",
        "高所作業 安全確認。安全帯フック掛け忘れ1名。再指導実施。",
    ),
    (
        "INSPECTION",
        30,
        29,
        1,
        "COND",
        "第三者機関による定期検査。仮設電気設備に軽微な不備あり。",
    ),
    ("DAILY", 15, 15, 0, "PASS", "横浜現場 日次確認。天候良好、作業安全に実施。"),
    ("WEEKLY", 38, 36, 2, "COND", "週次点検。通路の整理不良2箇所。当日中に是正完了。"),
    ("DAILY", 10, 10, 0, "PASS", "川崎現場 日次確認。小規模作業のため問題なし。"),
    (
        "MONTHLY",
        90,
        88,
        2,
        "COND",
        "月次総合点検。資材の仮置き場所不備2箇所を改善指示。",
    ),
]

COST_SEEDS = [
    ("MATERIAL", "普通ポルトランドセメント 30t", 850000, 880000, "山田建材"),
    ("LABOR", "鉄筋工 8名 × 3日", 960000, 940000, None),
    ("EQUIPMENT", "クレーン車リース 5日間", 750000, 780000, "東洋重機"),
    ("SUBCONTRACT", "電気工事 一式", 1200000, 1180000, "東洋電気工事"),
    ("OVERHEAD", "現場仮設費 2月分", 320000, 315000, None),
    ("MATERIAL", "型枠合板 480枚", 580000, 590000, "木材センター"),
    ("LABOR", "左官工 6名 × 2日", 480000, 500000, None),
    ("MATERIAL", "ALC パネル 40枚", 620000, 630000, "三和建材"),
    ("EQUIPMENT", "発電機リース 10日間", 280000, 270000, "電機レンタル"),
    ("SUBCONTRACT", "設備配管工事", 980000, 960000, "鈴木設備工業"),
]

REPORT_SEEDS = [
    ("SUNNY", 12, 75, True, "基礎配筋80%完了。品質検査合格。"),
    ("CLOUDY", 10, 50, True, "型枠設置開始。墨出し作業完了。"),
    ("RAINY", 0, 50, False, "雨天のため外部作業中止。内装下地作業のみ実施。"),
    ("SUNNY", 15, 90, True, "コンクリート打設完了。養生シート設置。"),
    ("SUNNY", 8, 30, True, "外壁タイル張り着工。工程通り進捗。"),
    ("CLOUDY", 12, 60, True, "設備配管工事 第1工区完了。"),
    ("SUNNY", 10, 70, True, "鉄骨建方3節まで完了。クレーン作業良好。"),
    ("WINDY", 6, 45, True, "強風注意報のため高所作業を午後から開始。"),
    ("SUNNY", 14, 85, True, "内装石膏ボード張り全体90%完了。"),
    ("CLOUDY", 11, 55, True, "防水工事 屋根面完了。下地点検良好。"),
]


def _cast(col: str, typ: str = "uuid") -> str:
    """Return CAST(:col AS typ) expression."""
    return f"CAST(:{col} AS {typ})"


async def seed_demo() -> None:
    async with AsyncSessionLocal() as session:
        # プロジェクト一覧取得
        r = await session.execute(
            text("SELECT id FROM projects WHERE deleted_at IS NULL LIMIT 5")
        )
        project_ids = [str(row[0]) for row in r.fetchall()]

        # 管理者ユーザー取得
        r = await session.execute(
            text("SELECT id FROM users WHERE role='ADMIN' LIMIT 1")
        )
        admin_row = r.fetchone()
        admin_id = str(admin_row[0]) if admin_row else None

        if not project_ids:
            log.warning("プロジェクトが見つかりません。")
            return

        # ─── incidents ──────────────────────────────────────────
        r = await session.execute(
            text("SELECT COUNT(*) FROM incidents WHERE deleted_at IS NULL")
        )
        count = r.scalar() or 0
        needed = max(0, 10 - count)
        log.info("incidents: 現在 %d 件 → %d 件追加", count, needed)

        for i, (title, cat, pri, sev, stat, desc) in enumerate(INCIDENT_SEEDS[:needed]):
            pid = project_ids[i % len(project_ids)]
            await session.execute(
                text(
                    "INSERT INTO incidents"
                    "(id,incident_number,title,description,category,priority,severity,"
                    " status,project_id,created_by,updated_by)"
                    " VALUES(gen_random_uuid(),:num,:title,:desc,:cat,:pri,:sev,:stat,"
                    " CAST(:pid AS uuid),CAST(:uid AS uuid),CAST(:uid AS uuid))"
                ),
                {
                    "num": f"INC-DEMO-{i + 1:03d}",
                    "title": title,
                    "desc": desc,
                    "cat": cat,
                    "pri": pri,
                    "sev": sev,
                    "stat": stat,
                    "pid": pid,
                    "uid": admin_id,
                },
            )

        # ─── knowledge_articles ─────────────────────────────────
        r = await session.execute(
            text("SELECT COUNT(*) FROM knowledge_articles WHERE deleted_at IS NULL")
        )
        count = r.scalar() or 0
        needed = max(0, 10 - count)
        log.info("knowledge_articles: 現在 %d 件 → %d 件追加", count, needed)

        for _i, (title, cat, content, tags) in enumerate(KNOWLEDGE_SEEDS[:needed]):
            views = random.randint(5, 120)  # noqa: S311
            rating = round(random.uniform(3.5, 5.0), 1)  # noqa: S311
            await session.execute(
                text(
                    "INSERT INTO knowledge_articles"
                    "(id,title,category,content,tags,is_published,view_count,rating,"
                    " created_by,updated_by)"
                    " VALUES(gen_random_uuid(),:title,:cat,:content,:tags,"
                    "true,:views,:rating,"
                    " CAST(:uid AS uuid),CAST(:uid AS uuid))"
                ),
                {
                    "title": title,
                    "cat": cat,
                    "content": content,
                    "tags": tags,
                    "views": views,
                    "rating": rating,
                    "uid": admin_id,
                },
            )

        # ─── safety_checks ──────────────────────────────────────
        r = await session.execute(
            text("SELECT COUNT(*) FROM safety_checks WHERE deleted_at IS NULL")
        )
        count = r.scalar() or 0
        needed = max(0, 10 - count)
        log.info("safety_checks: 現在 %d 件 → %d 件追加", count, needed)

        for i, (chk_type, total, ok, ng, result, notes) in enumerate(
            SAFETY_SEEDS[:needed]
        ):
            pid = project_ids[i % len(project_ids)]
            chk_date = date.today() - timedelta(days=i * 3)
            await session.execute(
                text(
                    "INSERT INTO safety_checks"
                    "(id,project_id,check_date,check_type,items_total,items_ok,items_ng,"
                    " overall_result,notes,inspector_id,created_by)"
                    " VALUES(gen_random_uuid(),CAST(:pid AS uuid),"
                    ":dt,:ctype,:total,:ok,:ng,"
                    " :result,:notes,CAST(:uid AS uuid),CAST(:uid AS uuid))"
                ),
                {
                    "pid": pid,
                    "dt": chk_date,
                    "ctype": chk_type,
                    "total": total,
                    "ok": ok,
                    "ng": ng,
                    "result": result,
                    "notes": notes,
                    "uid": admin_id,
                },
            )

        # ─── cost_records ───────────────────────────────────────
        r = await session.execute(
            text("SELECT COUNT(*) FROM cost_records WHERE deleted_at IS NULL")
        )
        count = r.scalar() or 0
        needed = max(0, 10 - count)
        log.info("cost_records: 現在 %d 件 → %d 件追加", count, needed)

        for i, (cat, desc, budget, actual, vendor) in enumerate(COST_SEEDS[:needed]):
            pid = project_ids[i % len(project_ids)]
            rec_date = date.today() - timedelta(days=i * 4)
            await session.execute(
                text(
                    "INSERT INTO cost_records"
                    "(id,project_id,record_date,category,description,"
                    " budgeted_amount,actual_amount,vendor_name,created_by)"
                    " VALUES(gen_random_uuid(),CAST(:pid AS uuid),:dt,:cat,:desc,"
                    " :budget,:actual,:vendor,CAST(:uid AS uuid))"
                ),
                {
                    "pid": pid,
                    "dt": rec_date,
                    "cat": cat,
                    "desc": desc,
                    "budget": budget,
                    "actual": actual,
                    "vendor": vendor if vendor else "",
                    "uid": admin_id,
                },
            )

        # ─── daily_reports ──────────────────────────────────────
        r = await session.execute(
            text("SELECT COUNT(*) FROM daily_reports WHERE deleted_at IS NULL")
        )
        count = r.scalar() or 0
        needed = max(0, 10 - count)
        log.info("daily_reports: 現在 %d 件 → %d 件追加", count, needed)

        r2 = await session.execute(
            text(
                "SELECT column_name FROM information_schema.columns"
                " WHERE table_name='daily_reports' AND table_schema='public'"
            )
        )
        dr_cols = {row[0] for row in r2.fetchall()}

        for i, (weather, workers, progress, safety, work) in enumerate(
            REPORT_SEEDS[:needed]
        ):
            pid = project_ids[i % len(project_ids)]
            rep_date = date.today() - timedelta(days=i * 2 + 1)
            params = {
                "pid": pid,
                "dt": rep_date,
                "weather": weather,
                "workers": workers,
                "progress": progress,
                "safety": safety,
                "work": work,
                "uid": admin_id,
            }

            if "status" in dr_cols and "reporter_id" in dr_cols:
                await session.execute(
                    text(
                        "INSERT INTO daily_reports"
                        "(id,project_id,report_date,weather,worker_count,"
                        " progress_rate,safety_check,work_content,"
                        " status,reporter_id,created_by)"
                        " VALUES(gen_random_uuid(),CAST(:pid AS uuid),"
                        ":dt,:weather,:workers,"
                        " :progress,:safety,:work,"
                        " 'SUBMITTED',CAST(:uid AS uuid),CAST(:uid AS uuid))"
                    ),
                    params,
                )
            else:
                await session.execute(
                    text(
                        "INSERT INTO daily_reports"
                        "(id,project_id,report_date,weather,worker_count,"
                        " progress_rate,safety_check,work_content,created_by)"
                        " VALUES(gen_random_uuid(),CAST(:pid AS uuid),"
                        ":dt,:weather,:workers,"
                        " :progress,:safety,:work,CAST(:uid AS uuid))"
                    ),
                    params,
                )

        # ─── photos ─────────────────────────────────────────────
        r = await session.execute(
            text("SELECT COUNT(*) FROM photos WHERE deleted_at IS NULL")
        )
        count = r.scalar() or 0
        needed = max(0, 10 - count)
        log.info("photos: 現在 %d 件 → %d 件追加", count, needed)

        photo_seeds = [
            ("PROGRESS", "基礎工事_配筋状況_2026-05-10.jpg", 2_450_000),
            ("SAFETY", "安全朝礼_全員集合_2026-05-12.jpg", 1_820_000),
            ("PROGRESS", "鉄骨建方_3節完了_2026-05-14.jpg", 3_210_000),
            ("QUALITY", "コンクリート打設_スランプ試験.jpg", 980_000),
            ("GENERAL", "現場全景_2026-05-15.jpg", 4_530_000),
            ("TROUBLE", "足場不備箇所_改善前_2026-05-16.jpg", 1_200_000),
            ("COMPLETION", "型枠撤去後_完成状況.jpg", 2_980_000),
            ("SAFETY", "保護具着用確認_ヘルメット_2026-05-18.jpg", 870_000),
            ("PROGRESS", "内装下地_石膏ボード張り_進捗80%.jpg", 1_650_000),
            ("QUALITY", "防水試験_散水検査_合格.jpg", 1_100_000),
        ]

        for i, (cat, orig_name, fsize) in enumerate(photo_seeds[:needed]):
            pid = project_ids[i % len(project_ids)]
            fname = f"demo_{i + 1:03d}_{cat.lower()}.jpg"
            taken = date.today() - timedelta(days=i * 2)
            await session.execute(
                text(
                    "INSERT INTO photos"
                    "(id,project_id,file_name,original_name,content_type,file_size,"
                    " bucket_name,object_key,category,caption,taken_at,created_by)"
                    " VALUES(gen_random_uuid(),CAST(:pid AS uuid),"
                    ":fname,:oname,'image/jpeg',:fsize,"
                    " 'servicehub-photos',:okey,:cat,:caption,"
                    "CAST(:taken AS timestamptz),CAST(:uid AS uuid))"
                ),
                {
                    "pid": pid,
                    "fname": fname,
                    "oname": orig_name,
                    "fsize": fsize,
                    "okey": f"demo/{pid}/{fname}",
                    "cat": cat,
                    "caption": orig_name.replace("_", " ").replace(".jpg", ""),
                    "taken": datetime(
                        taken.year,
                        taken.month,
                        taken.day,
                        8,
                        30,
                        0,
                        tzinfo=timezone.utc,
                    ),
                    "uid": admin_id,
                },
            )

        # ─── quality_inspections ─────────────────────────────────
        r = await session.execute(
            text("SELECT COUNT(*) FROM quality_inspections WHERE deleted_at IS NULL")
        )
        count = r.scalar() or 0
        needed = max(0, 10 - count)
        log.info("quality_inspections: 現在 %d 件 → %d 件追加", count, needed)

        qi_seeds = [
            (
                "CONCRETE",
                "スランプ値",
                "18cm±2.5cm",
                "17.5cm",
                "PASS",
                "普通コンクリート 呼び強度24",
            ),
            ("CONCRETE", "空気量", "4.5%±1.5%", "4.8%", "PASS", "AE 剤使用"),
            ("REBAR", "鉄筋径", "D13 ±0.4mm", "D13.1mm", "PASS", "SD345 基礎主筋"),
            ("REBAR", "かぶり厚さ", "40mm以上", "42mm", "PASS", "基礎外周部"),
            (
                "CONCRETE",
                "塩化物含有量",
                "0.30kg/m³以下",
                "0.22kg/m³",
                "PASS",
                "スランプ試験同時実施",
            ),
            (
                "STEEL",
                "高力ボルト締付けトルク",
                "550N·m±10%",
                "538N·m",
                "PASS",
                "M22 トルシア型 F10T",
            ),
            (
                "WATERPROOF",
                "防水層厚さ",
                "3mm以上",
                "3.2mm",
                "PASS",
                "ウレタン塗膜防水 1工区",
            ),
            (
                "CONCRETE",
                "圧縮強度",
                "24N/mm²以上",
                "28.5N/mm²",
                "PASS",
                "28日強度試験",
            ),
            ("REBAR", "配筋間隔", "200mm±10mm", "198mm", "PASS", "基礎スラブ下端筋"),
            (
                "STEEL",
                "溶接部外観検査",
                "欠陥なし",
                "合格",
                "PASS",
                "H鋼溶接部 全数検査",
            ),
        ]

        for i, (itype, target, std, measured, result, remarks) in enumerate(
            qi_seeds[:needed]
        ):
            pid = project_ids[i % len(project_ids)]
            idate = date.today() - timedelta(days=i * 3)
            await session.execute(
                text(
                    "INSERT INTO quality_inspections"
                    "(id,project_id,inspection_date,inspection_type,target_item,"
                    " standard_value,measured_value,result,remarks,created_by)"
                    " VALUES(gen_random_uuid(),CAST(:pid AS uuid),"
                    ":idate,:itype,:target,"
                    " :std,:measured,:result,:remarks,CAST(:uid AS uuid))"
                ),
                {
                    "pid": pid,
                    "idate": idate,
                    "itype": itype,
                    "target": target,
                    "std": std,
                    "measured": measured,
                    "result": result,
                    "remarks": remarks,
                    "uid": admin_id,
                },
            )

        await session.commit()
        log.info("✅ デモデータ投入完了")

        for tbl in [
            "incidents",
            "knowledge_articles",
            "safety_checks",
            "cost_records",
            "daily_reports",
            "photos",
            "quality_inspections",
        ]:
            r = await session.execute(
                text(f"SELECT COUNT(*) FROM {tbl} WHERE deleted_at IS NULL")  # noqa: S608
            )
            log.info("  %s: %d 件", tbl, r.scalar())


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )
    asyncio.run(seed_demo())

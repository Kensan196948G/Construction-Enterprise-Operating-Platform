/**
 * モック用ダミーデータ集
 *
 * 建設・土木業界のリアルな日本語データを各ドメインに多数投入する。
 * - 値は固定 (決定的) にして、リロードしても同じ初期状態に戻れるようにする。
 * - mutable な配列として export し、mock-server がインメモリで CRUD する。
 *
 * 注意: ここは「初期シード」。mock-server.ts が deep copy して保持する。
 */

// ----------------------------------------------------------------
// 共通: デモ組織 / デモユーザー
// ----------------------------------------------------------------
export const DEMO_ORG_ID = 'org-demo-0001';
export const DEMO_USER = {
  id: 'user-demo-0001',
  email: 'admin@civil-ims.local',
  displayName: '山田 太郎 (デモ管理者)',
  organizationId: DEMO_ORG_ID,
  roles: ['ADMIN', 'QUALITY_MANAGER'],
};

// ----------------------------------------------------------------
// F-01 ユーザー / 権限
// ----------------------------------------------------------------
function userRoles(...names: Array<[string, string, string]>) {
  return names.map(([id, name, displayName]) => ({ role: { id, name, displayName } }));
}

export const users = [
  {
    id: 'user-demo-0001',
    email: 'admin@civil-ims.local',
    displayName: '山田 太郎',
    employeeNo: 'EMP-0001',
    departmentId: 'dept-honsha',
    organizationId: DEMO_ORG_ID,
    lastLoginAt: '2026-06-12T23:14:00.000Z',
    roles: userRoles(['r-admin', 'ADMIN', 'システム管理者']),
  },
  {
    id: 'user-demo-0002',
    email: 'sato.hanako@civil-ims.local',
    displayName: '佐藤 花子',
    employeeNo: 'EMP-0002',
    departmentId: 'dept-quality',
    organizationId: DEMO_ORG_ID,
    lastLoginAt: '2026-06-12T08:30:00.000Z',
    roles: userRoles(['r-qm', 'QUALITY_MANAGER', '品質管理責任者']),
  },
  {
    id: 'user-demo-0003',
    email: 'suzuki.ichiro@civil-ims.local',
    displayName: '鈴木 一郎',
    employeeNo: 'EMP-0003',
    departmentId: 'dept-site-a',
    organizationId: DEMO_ORG_ID,
    lastLoginAt: '2026-06-11T17:45:00.000Z',
    roles: userRoles(['r-site', 'SITE_MANAGER', '現場施工管理者']),
  },
  {
    id: 'user-demo-0004',
    email: 'takahashi.kenji@civil-ims.local',
    displayName: '高橋 健二',
    employeeNo: 'EMP-0004',
    departmentId: 'dept-safety',
    organizationId: DEMO_ORG_ID,
    lastLoginAt: '2026-06-12T07:05:00.000Z',
    roles: userRoles(['r-safety', 'SAFETY_OFFICER', '安全衛生責任者']),
  },
  {
    id: 'user-demo-0005',
    email: 'watanabe.yuki@civil-ims.local',
    displayName: '渡辺 由紀',
    employeeNo: 'EMP-0005',
    departmentId: 'dept-env',
    organizationId: DEMO_ORG_ID,
    lastLoginAt: '2026-06-10T13:20:00.000Z',
    roles: userRoles(['r-env', 'ENV_MANAGER', '環境管理責任者']),
  },
  {
    id: 'user-demo-0006',
    email: 'ito.megumi@civil-ims.local',
    displayName: '伊藤 恵',
    employeeNo: 'EMP-0006',
    departmentId: 'dept-audit',
    organizationId: DEMO_ORG_ID,
    lastLoginAt: '2026-06-09T10:00:00.000Z',
    roles: userRoles(['r-audit', 'AUDITOR', '内部監査員']),
  },
  {
    id: 'user-demo-0007',
    email: 'nakamura.shin@civil-ims.local',
    displayName: '中村 慎',
    employeeNo: 'EMP-0007',
    departmentId: 'dept-bim',
    organizationId: DEMO_ORG_ID,
    lastLoginAt: '2026-06-12T15:40:00.000Z',
    roles: userRoles(['r-bim', 'BIM_MANAGER', 'BIM/CIM マネージャー']),
  },
  {
    id: 'user-demo-0008',
    email: 'kobayashi.rie@civil-ims.local',
    displayName: '小林 理恵',
    employeeNo: 'EMP-0008',
    departmentId: 'dept-asset',
    organizationId: DEMO_ORG_ID,
    lastLoginAt: '2026-06-08T09:15:00.000Z',
    roles: userRoles(['r-asset', 'ASSET_MANAGER', 'アセットマネージャー']),
  },
];

// ----------------------------------------------------------------
// F-04 工事案件 (Projects)
// ----------------------------------------------------------------
export const projects = [
  { id: 'prj-0001', code: 'KW-2026-001', name: '第二京浜国道 拡幅工事', clientName: '国土交通省 関東地方整備局', status: 'IN_PROGRESS', startDate: '2026-04-01' },
  { id: 'prj-0002', code: 'KW-2026-002', name: '多摩川 護岸補強工事', clientName: '東京都 建設局', status: 'IN_PROGRESS', startDate: '2026-05-10' },
  { id: 'prj-0003', code: 'KW-2026-003', name: '中央自動車道 橋梁耐震補強', clientName: 'NEXCO 中日本', status: 'OPEN', startDate: '2026-06-01' },
  { id: 'prj-0004', code: 'KW-2026-004', name: '横浜市 下水道管渠更生工事', clientName: '横浜市 環境創造局', status: 'IN_PROGRESS', startDate: '2026-03-15' },
  { id: 'prj-0005', code: 'KW-2026-005', name: '新東名 トンネル覆工コンクリート', clientName: 'NEXCO 中日本', status: 'OPEN', startDate: '2026-07-01' },
  { id: 'prj-0006', code: 'KW-2025-018', name: '相模川 河川改修 第3期', clientName: '神奈川県 県土整備局', status: 'CLOSED', startDate: '2025-09-01' },
  { id: 'prj-0007', code: 'KW-2026-006', name: '川崎臨海部 防潮堤建設', clientName: '川崎市 港湾局', status: 'DRAFT', startDate: '2026-08-01' },
  { id: 'prj-0008', code: 'KW-2026-007', name: '圏央道 IC 改良工事', clientName: 'NEXCO 東日本', status: 'IN_PROGRESS', startDate: '2026-02-20' },
  { id: 'prj-0009', code: 'KW-2026-008', name: '東京駅前 地下歩道 整備', clientName: '東京都 都市整備局', status: 'OPEN', startDate: '2026-06-20' },
  { id: 'prj-0010', code: 'KW-2025-022', name: '小田原 砂防堰堤 工事', clientName: '神奈川県 県土整備局', status: 'CLOSED', startDate: '2025-06-01' },
  { id: 'prj-0011', code: 'KW-2026-009', name: '羽田空港 誘導路 舗装更新', clientName: '東京航空局', status: 'IN_PROGRESS', startDate: '2026-05-01' },
  { id: 'prj-0012', code: 'KW-2026-010', name: '江戸川区 橋梁長寿命化', clientName: '江戸川区 土木部', status: 'DRAFT', startDate: '2026-09-01' },
];

// ----------------------------------------------------------------
// F-02 文書管理 (Documents)
// ----------------------------------------------------------------
export const documents = [
  { id: 'doc-0001', documentNo: 'QMS-MAN-001', title: '品質マニュアル 第7版', status: 'PUBLISHED', currentVersion: '7.0', createdAt: '2026-01-15T09:00:00.000Z' },
  { id: 'doc-0002', documentNo: 'EMS-MAN-001', title: '環境マニュアル 第4版', status: 'PUBLISHED', currentVersion: '4.0', createdAt: '2026-01-20T09:00:00.000Z' },
  { id: 'doc-0003', documentNo: 'OHS-PRO-012', title: '高所作業 安全手順書', status: 'APPROVED', currentVersion: '2.3', createdAt: '2026-03-05T09:00:00.000Z' },
  { id: 'doc-0004', documentNo: 'QMS-PRO-034', title: 'コンクリート品質管理要領', status: 'IN_PROGRESS', currentVersion: '1.5', createdAt: '2026-05-28T09:00:00.000Z' },
  { id: 'doc-0005', documentNo: 'KW-2026-001-SEKO', title: '第二京浜 施工計画書', status: 'APPROVED', currentVersion: '3.0', createdAt: '2026-03-30T09:00:00.000Z' },
  { id: 'doc-0006', documentNo: 'EMS-PRO-008', title: '建設廃棄物 処理マニフェスト管理規程', status: 'PUBLISHED', currentVersion: '2.0', createdAt: '2026-02-10T09:00:00.000Z' },
  { id: 'doc-0007', documentNo: 'QMS-FRM-101', title: '段階確認 立会記録様式', status: 'DRAFT', currentVersion: '0.9', createdAt: '2026-06-08T09:00:00.000Z' },
  { id: 'doc-0008', documentNo: 'OHS-PLN-005', title: '安全衛生管理計画書 2026', status: 'PUBLISHED', currentVersion: '1.0', createdAt: '2026-04-01T09:00:00.000Z' },
  { id: 'doc-0009', documentNo: 'BIM-EIR-003', title: '発注者情報要件 (EIR) テンプレート', status: 'IN_PROGRESS', currentVersion: '1.2', createdAt: '2026-05-15T09:00:00.000Z' },
  { id: 'doc-0010', documentNo: 'QMS-PRO-040', title: '不適合・是正処置 管理規程', status: 'REJECTED', currentVersion: '2.1', createdAt: '2026-05-02T09:00:00.000Z' },
  { id: 'doc-0011', documentNo: 'ASM-PLN-002', title: '保全計画 (橋梁) 2026-2030', status: 'APPROVED', currentVersion: '1.0', createdAt: '2026-04-22T09:00:00.000Z' },
  { id: 'doc-0012', documentNo: 'ISMS-POL-001', title: '情報セキュリティ基本方針', status: 'PUBLISHED', currentVersion: '3.0', createdAt: '2026-01-05T09:00:00.000Z' },
];

// ----------------------------------------------------------------
// F-08 品質計画 (ISO 9001)
// ----------------------------------------------------------------
export const qualityPlans = [
  { id: 'qp-0001', planNo: 'QP-2026-001', title: '第二京浜 拡幅 品質計画書', status: 'PUBLISHED', version: 3, updatedAt: '2026-05-20T09:00:00.000Z' },
  { id: 'qp-0002', planNo: 'QP-2026-002', title: '多摩川 護岸 品質計画書', status: 'APPROVED', version: 2, updatedAt: '2026-05-18T09:00:00.000Z' },
  { id: 'qp-0003', planNo: 'QP-2026-003', title: '橋梁耐震補強 品質計画書', status: 'IN_PROGRESS', version: 1, updatedAt: '2026-06-09T09:00:00.000Z' },
  { id: 'qp-0004', planNo: 'QP-2026-004', title: '下水道管渠更生 品質計画書', status: 'PUBLISHED', version: 2, updatedAt: '2026-04-12T09:00:00.000Z' },
  { id: 'qp-0005', planNo: 'QP-2026-005', title: 'トンネル覆工 品質計画書', status: 'DRAFT', version: 1, updatedAt: '2026-06-10T09:00:00.000Z' },
  { id: 'qp-0006', planNo: 'QP-2026-006', title: '空港誘導路舗装 品質計画書', status: 'REJECTED', version: 1, updatedAt: '2026-05-30T09:00:00.000Z' },
  { id: 'qp-0007', planNo: 'QP-2025-018', title: '相模川改修 品質計画書', status: 'CLOSED', version: 4, updatedAt: '2026-02-28T09:00:00.000Z' },
];

// ----------------------------------------------------------------
// F-09 環境側面 (ISO 14001)
// ----------------------------------------------------------------
export const environmentAspects = [
  { id: 'ea-0001', aspectName: '建設機械からの排出ガス', activity: '掘削・運搬作業', significance: 'HIGH', isLegallyRequired: true, evaluatedAt: '2026-05-01T09:00:00.000Z' },
  { id: 'ea-0002', aspectName: '建設騒音・振動', activity: '杭打ち・解体作業', significance: 'HIGH', isLegallyRequired: true, evaluatedAt: '2026-05-01T09:00:00.000Z' },
  { id: 'ea-0003', aspectName: '建設汚泥の発生', activity: '場所打ち杭・泥水掘削', significance: 'CRITICAL', isLegallyRequired: true, evaluatedAt: '2026-04-20T09:00:00.000Z' },
  { id: 'ea-0004', aspectName: '濁水の河川放流', activity: '河川内 護岸工', significance: 'CRITICAL', isLegallyRequired: true, evaluatedAt: '2026-05-12T09:00:00.000Z' },
  { id: 'ea-0005', aspectName: 'コンクリート殻の排出', activity: '構造物取壊し', significance: 'MEDIUM', isLegallyRequired: true, evaluatedAt: '2026-04-15T09:00:00.000Z' },
  { id: 'ea-0006', aspectName: '軽油・燃料の地下浸透', activity: '重機給油', significance: 'MEDIUM', isLegallyRequired: false, evaluatedAt: '2026-03-30T09:00:00.000Z' },
  { id: 'ea-0007', aspectName: '粉じんの飛散', activity: '土工・舗装切削', significance: 'MEDIUM', isLegallyRequired: false, evaluatedAt: '2026-05-08T09:00:00.000Z' },
  { id: 'ea-0008', aspectName: 'アスベスト含有建材', activity: '既設構造物 解体', significance: 'CRITICAL', isLegallyRequired: true, evaluatedAt: '2026-02-25T09:00:00.000Z' },
  { id: 'ea-0009', aspectName: 'CO2 排出 (重機稼働)', activity: '全工種', significance: 'LOW', isLegallyRequired: false, evaluatedAt: '2026-01-10T09:00:00.000Z' },
  { id: 'ea-0010', aspectName: '伐採木・草木の発生', activity: '伐開除根', significance: 'LOW', isLegallyRequired: false, evaluatedAt: '2026-04-02T09:00:00.000Z' },
];

// ----------------------------------------------------------------
// F-10 安全衛生 ハザード (ISO 45001)
// ----------------------------------------------------------------
export const hazards = [
  { id: 'hz-0001', workActivity: '高所作業 (足場上)', hazardType: '墜落・転落', riskLevel: 'CRITICAL', residualRisk: 'MEDIUM', dueDate: '2026-06-20' },
  { id: 'hz-0002', workActivity: '重機掘削', hazardType: '建設機械との接触', riskLevel: 'CRITICAL', residualRisk: 'LOW', dueDate: '2026-06-15' },
  { id: 'hz-0003', workActivity: '土留め内 作業', hazardType: '土砂崩壊・埋没', riskLevel: 'HIGH', residualRisk: 'MEDIUM', dueDate: '2026-06-25' },
  { id: 'hz-0004', workActivity: 'クレーン揚重', hazardType: '吊荷の落下', riskLevel: 'HIGH', residualRisk: 'LOW', dueDate: '2026-06-18' },
  { id: 'hz-0005', workActivity: '交通規制下 舗装作業', hazardType: '一般車両との接触', riskLevel: 'HIGH', residualRisk: 'MEDIUM', dueDate: '2026-07-01' },
  { id: 'hz-0006', workActivity: '溶接・溶断', hazardType: '火災・火傷', riskLevel: 'MEDIUM', residualRisk: 'LOW', dueDate: '2026-06-30' },
  { id: 'hz-0007', workActivity: '電動工具使用', hazardType: '感電', riskLevel: 'MEDIUM', residualRisk: 'LOW', dueDate: null },
  { id: 'hz-0008', workActivity: '夏季 屋外作業', hazardType: '熱中症', riskLevel: 'HIGH', residualRisk: 'MEDIUM', dueDate: '2026-07-10' },
  { id: 'hz-0009', workActivity: '密閉空間 (管渠内)', hazardType: '酸欠・有毒ガス', riskLevel: 'CRITICAL', residualRisk: 'LOW', dueDate: '2026-06-22' },
  { id: 'hz-0010', workActivity: '粉じん環境下 作業', hazardType: 'じん肺・呼吸器障害', riskLevel: 'MEDIUM', residualRisk: 'LOW', dueDate: null },
];

// ----------------------------------------------------------------
// F-11 資産 (ISO 55001)
// ----------------------------------------------------------------
export const assets = [
  { id: 'as-0001', assetNo: 'AS-BR-0001', name: '第二京浜 跨道橋 A', assetType: '橋梁', currentCondition: 'II (予防保全)', status: '供用中' },
  { id: 'as-0002', assetNo: 'AS-TN-0002', name: '新東名 第3トンネル', assetType: 'トンネル', currentCondition: 'I (健全)', status: '供用中' },
  { id: 'as-0003', assetNo: 'AS-RV-0003', name: '多摩川 護岸ブロック L=1.2km', assetType: '河川構造物', currentCondition: 'III (早期措置)', status: '要補修' },
  { id: 'as-0004', assetNo: 'AS-PV-0004', name: '圏央道 IC ランプ舗装', assetType: '舗装', currentCondition: 'II (予防保全)', status: '供用中' },
  { id: 'as-0005', assetNo: 'AS-SW-0005', name: '横浜市 下水道幹線 #12', assetType: '管渠', currentCondition: 'III (早期措置)', status: '要補修' },
  { id: 'as-0006', assetNo: 'AS-DM-0006', name: '小田原 砂防堰堤', assetType: '砂防', currentCondition: 'I (健全)', status: '供用中' },
  { id: 'as-0007', assetNo: 'AS-BR-0007', name: '江戸川 橋梁 B (鋼橋)', assetType: '橋梁', currentCondition: 'IV (緊急措置)', status: '通行規制中' },
  { id: 'as-0008', assetNo: 'AS-EQ-0008', name: '排水ポンプ場 ポンプ #2', assetType: '機械設備', currentCondition: 'II (予防保全)', status: '稼働中' },
  { id: 'as-0009', assetNo: 'AS-RV-0009', name: '相模川 樋門ゲート', assetType: '河川構造物', currentCondition: 'II (予防保全)', status: '供用中' },
  { id: 'as-0010', assetNo: 'AS-TN-0010', name: '中央道 換気設備', assetType: '機械設備', currentCondition: 'III (早期措置)', status: '要補修' },
];

// ----------------------------------------------------------------
// F-12 BIM/CIM 実行計画 (ISO 19650)
// ----------------------------------------------------------------
export const bimPlans = [
  { id: 'bep-0001', title: '第二京浜 拡幅 BEP', version: '2.1', status: 'PUBLISHED', namingConvention: 'ISO19650 (PRJ-ORG-VOL-LVL-TYP)', updatedAt: '2026-05-22T09:00:00.000Z' },
  { id: 'bep-0002', title: '橋梁耐震補強 BEP', version: '1.0', status: 'APPROVED', namingConvention: 'ISO19650 準拠', updatedAt: '2026-06-01T09:00:00.000Z' },
  { id: 'bep-0003', title: 'トンネル覆工 BEP', version: '0.8', status: 'IN_REVIEW', namingConvention: '社内規程 v2', updatedAt: '2026-06-09T09:00:00.000Z' },
  { id: 'bep-0004', title: '下水道管渠更生 BEP', version: '1.2', status: 'IN_PROGRESS', namingConvention: 'ISO19650 準拠', updatedAt: '2026-06-05T09:00:00.000Z' },
  { id: 'bep-0005', title: '空港誘導路 BEP', version: '1.0', status: 'DRAFT', namingConvention: '発注者指定', updatedAt: '2026-06-11T09:00:00.000Z' },
  { id: 'bep-0006', title: '相模川改修 BEP (完了)', version: '3.0', status: 'ARCHIVED', namingConvention: 'ISO19650 準拠', updatedAt: '2026-03-01T09:00:00.000Z' },
];

// ----------------------------------------------------------------
// F-06 監査計画 (Audit Plans)
// ----------------------------------------------------------------
export const auditPlans = [
  { id: 'aud-0001', planNo: 'IA-2026-Q1', title: '第1四半期 内部監査 (品質)', isoStandard: 'ISO 9001', status: 'CLOSED', scheduledAt: '2026-03-10T00:00:00.000Z' },
  { id: 'aud-0002', planNo: 'IA-2026-Q2', title: '第2四半期 内部監査 (環境)', isoStandard: 'ISO 14001', status: 'IN_PROGRESS', scheduledAt: '2026-06-18T00:00:00.000Z' },
  { id: 'aud-0003', planNo: 'IA-2026-Q2S', title: '第2四半期 内部監査 (安全)', isoStandard: 'ISO 45001', status: 'OPEN', scheduledAt: '2026-06-25T00:00:00.000Z' },
  { id: 'aud-0004', planNo: 'EA-2026-01', title: '外部審査 (更新審査)', isoStandard: 'ISO 9001/14001', status: 'OPEN', scheduledAt: '2026-09-05T00:00:00.000Z' },
  { id: 'aud-0005', planNo: 'IA-2026-Q3', title: '第3四半期 内部監査 (資産)', isoStandard: 'ISO 55001', status: 'DRAFT', scheduledAt: '2026-09-20T00:00:00.000Z' },
  { id: 'aud-0006', planNo: 'IA-2026-BIM', title: 'BIM/CIM 情報管理監査', isoStandard: 'ISO 19650', status: 'DRAFT', scheduledAt: '2026-10-01T00:00:00.000Z' },
];

// ----------------------------------------------------------------
// F-05 是正処置 (Corrective Actions)
// ----------------------------------------------------------------
export const correctiveActions = [
  { id: 'ca-0001', caNo: 'CA-2026-001', sourceType: '内部監査', title: '段階確認記録の未記入', description: '基礎工の段階確認立会記録に未記入箇所が確認された。', isoStandard: 'ISO 9001', severity: 'MEDIUM', status: 'CLOSED', rootCause: '記録様式の周知不足', correctiveAction: '記録様式を電子化し必須項目を入力必須に変更', preventiveAction: '新規入場者教育に記録手順を追加', dueDate: '2026-04-30', closedAt: '2026-04-25T09:00:00.000Z', createdAt: '2026-03-12T09:00:00.000Z' },
  { id: 'ca-0002', caNo: 'CA-2026-002', sourceType: 'ヒヤリハット', title: '重機後進時の接触リスク', description: '掘削作業中、後進するバックホウと作業員が接近した。', isoStandard: 'ISO 45001', severity: 'HIGH', status: 'PENDING_VERIFICATION', rootCause: '誘導員の配置不足', correctiveAction: '重機作業範囲への立入禁止措置と誘導員専任化', preventiveAction: '全現場で重機接触防止装置の導入を検討', dueDate: '2026-06-20', createdAt: '2026-05-28T09:00:00.000Z' },
  { id: 'ca-0003', caNo: 'CA-2026-003', sourceType: '顧客苦情', title: '濁水の河川流出', description: '降雨時に沈砂池容量を超える濁水が河川に流出した。', isoStandard: 'ISO 14001', severity: 'CRITICAL', status: 'IN_PROGRESS', rootCause: '沈砂池容量の設計過小', correctiveAction: '仮設沈砂池の増設と濁水処理プラント設置', preventiveAction: '降雨予測に基づく作業中止基準の策定', dueDate: '2026-06-30', createdAt: '2026-05-15T09:00:00.000Z' },
  { id: 'ca-0004', caNo: 'CA-2026-004', sourceType: '不適合', title: 'コンクリート強度の不足', description: '28日強度試験で呼び強度を下回るロットが発生。', isoStandard: 'ISO 9001', severity: 'HIGH', status: 'OPEN', rootCause: '調査中', dueDate: '2026-07-05', createdAt: '2026-06-08T09:00:00.000Z' },
  { id: 'ca-0005', caNo: 'CA-2026-005', sourceType: '内部監査', title: '産廃マニフェストの保管不備', description: 'マニフェストE票の一部が未回収・未保管。', isoStandard: 'ISO 14001', severity: 'MEDIUM', status: 'IN_PROGRESS', rootCause: '回収確認フローの欠如', correctiveAction: 'マニフェスト電子化システムの導入', dueDate: '2026-07-15', createdAt: '2026-06-02T09:00:00.000Z' },
  { id: 'ca-0006', caNo: 'CA-2026-006', sourceType: 'ヒヤリハット', title: '高所からの工具落下', description: '足場上から工具が落下、下部に作業員なく無災害。', isoStandard: 'ISO 45001', severity: 'MEDIUM', status: 'CLOSED', rootCause: '工具の落下防止措置不足', correctiveAction: '全工具に落下防止ワイヤ装着', preventiveAction: '工具点検を朝礼KYに組込み', dueDate: '2026-05-20', closedAt: '2026-05-19T09:00:00.000Z', createdAt: '2026-05-01T09:00:00.000Z' },
  { id: 'ca-0007', caNo: 'CA-2026-007', sourceType: '外部審査', title: '文書改訂履歴の不整合', description: '品質マニュアルの改訂履歴と版数に不整合。', isoStandard: 'ISO 9001', severity: 'LOW', status: 'OPEN', dueDate: '2026-07-20', createdAt: '2026-06-10T09:00:00.000Z' },
  { id: 'ca-0008', caNo: 'CA-2026-008', sourceType: '不適合', title: '法定点検の期限超過', description: '一部の建設機械で特定自主検査の期限超過。', isoStandard: 'ISO 45001', severity: 'HIGH', status: 'CANCELLED', rootCause: '点検台帳の管理漏れ', dueDate: '2026-06-01', createdAt: '2026-05-10T09:00:00.000Z' },
];

// ----------------------------------------------------------------
// ISMS (ISO 27001) 資産 / インシデント
// ----------------------------------------------------------------
export const ismsAssets = [
  { id: 'isa-0001', assetNo: 'IS-AS-001', name: '工事情報管理サーバー', assetType: 'サーバー', classification: 'confidential', sensitivity: '高', owner: '情報システム部', location: '本社 サーバ室' },
  { id: 'isa-0002', assetNo: 'IS-AS-002', name: '現場 施工写真データ', assetType: 'データ', classification: 'internal', sensitivity: '中', owner: '各現場', location: 'クラウドストレージ' },
  { id: 'isa-0003', assetNo: 'IS-AS-003', name: '顧客契約書 (電子)', assetType: 'データ', classification: 'strictly-confidential', sensitivity: '極高', owner: '営業部', location: '文書管理システム' },
  { id: 'isa-0004', assetNo: 'IS-AS-004', name: '従業員 個人情報DB', assetType: 'データベース', classification: 'strictly-confidential', sensitivity: '極高', owner: '総務部', location: '本社 サーバ室' },
  { id: 'isa-0005', assetNo: 'IS-AS-005', name: '公開Webサイト', assetType: 'システム', classification: 'public', sensitivity: '低', owner: '広報部', location: 'クラウド (CDN)' },
  { id: 'isa-0006', assetNo: 'IS-AS-006', name: 'BIM/CIM モデルデータ', assetType: 'データ', classification: 'confidential', sensitivity: '高', owner: 'BIM推進室', location: 'CDE (共通データ環境)' },
];

export const ismsIncidents = [
  { id: 'isi-0001', incidentNo: 'IR-2026-001', incidentType: 'フィッシングメール', occurredAt: '2026-02-14T03:20:00.000Z', description: '取引先を装ったフィッシングメールを複数名が受信。', severity: 'MEDIUM', status: 'CLOSED', affectedSystems: 'メールシステム' },
  { id: 'isi-0002', incidentNo: 'IR-2026-002', incidentType: '紛失・盗難', occurredAt: '2026-04-03T10:00:00.000Z', description: '現場貸与のタブレット端末を紛失 (遠隔ロック実施)。', severity: 'HIGH', status: 'CLOSED', affectedSystems: 'モバイル端末' },
  { id: 'isi-0003', incidentNo: 'IR-2026-003', incidentType: '不正アクセス試行', occurredAt: '2026-05-21T22:45:00.000Z', description: 'VPN への総当たりログイン試行を検知・遮断。', severity: 'HIGH', status: 'IN_PROGRESS', affectedSystems: 'VPN ゲートウェイ' },
  { id: 'isi-0004', incidentNo: 'IR-2026-004', incidentType: '誤送信', occurredAt: '2026-06-05T14:10:00.000Z', description: '工事図面を誤った宛先へメール送信。', severity: 'MEDIUM', status: 'OPEN', affectedSystems: 'メールシステム' },
  { id: 'isi-0005', incidentNo: 'IR-2026-005', incidentType: 'マルウェア感染', occurredAt: '2026-01-30T08:30:00.000Z', description: 'USB 経由で1台のPCがマルウェア感染、隔離・駆除済み。', severity: 'CRITICAL', status: 'CLOSED', affectedSystems: '現場PC' },
];

// ----------------------------------------------------------------
// BCP (事業継続計画)
// ----------------------------------------------------------------
export const bcpPlans = [
  { id: 'bcp-0001', planNo: 'BCP-2026-001', title: '首都直下地震 事業継続計画', version: 3, status: 'APPROVED', scope: '全社', rto: 72, rpo: 24, approvedAt: '2026-03-01T09:00:00.000Z', approvedBy: '代表取締役社長', createdAt: '2025-11-01T09:00:00.000Z' },
  { id: 'bcp-0002', planNo: 'BCP-2026-002', title: '風水害 (台風) 対応計画', version: 2, status: 'APPROVED', scope: '関東支店', rto: 48, rpo: 12, approvedAt: '2026-04-15T09:00:00.000Z', approvedBy: '関東支店長', createdAt: '2026-01-10T09:00:00.000Z' },
  { id: 'bcp-0003', planNo: 'BCP-2026-003', title: '情報システム障害 復旧計画', version: 1, status: 'IN_PROGRESS', scope: '情報システム部', rto: 8, rpo: 1, createdAt: '2026-05-20T09:00:00.000Z' },
  { id: 'bcp-0004', planNo: 'BCP-2026-004', title: 'パンデミック 対応計画', version: 1, status: 'DRAFT', scope: '全社', rto: 120, rpo: 48, createdAt: '2026-06-01T09:00:00.000Z' },
];

// ----------------------------------------------------------------
// F-13 ダッシュボード KPI
// ----------------------------------------------------------------
export const dashboardKpi = {
  corrective_actions: { open: 3, in_progress: 2, closed_this_month: 2 },
  workflows: { pending_approval: 5, in_progress: 8 },
  audits: { scheduled: 3, in_progress: 1 },
  documents: { total: 12, under_review: 2, draft: 2 },
  quality: { open_nonconformities: 4, critical_nonconformities: 1 },
  environment: { significant_aspects: 4, legal_non_compliant: 1 },
  projects: { active: 6 },
};

// ----------------------------------------------------------------
// 分析 (Analytics)
// ----------------------------------------------------------------
export const isoCompliance = {
  iso9001: { name: 'ISO 9001 品質', score: 92, open_nonconformities: 4 },
  iso14001: { name: 'ISO 14001 環境', score: 88, non_compliant_legal: 1 },
  iso45001: { name: 'ISO 45001 安全', score: 95, open_incidents: 2 },
  iso55001: { name: 'ISO 55001 資産', score: 81, poor_condition_assets: 3 },
  iso19650: { name: 'ISO 19650 BIM', score: 78, wip_containers: 6 },
};

export const qualityKpi = {
  nonconformities: { open: 4, critical: 1 },
  documents: { under_review: 2, published: 6 },
  audits: { in_progress: 1 },
};

export const safetyKpi = {
  near_misses: { ytd: 24, open: 3 },
  incidents: { ytd: 2, with_lost_days: 0 },
  education: { sessions_ytd: 18 },
};

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Civil Construction IMS database...');

  // --- Organization ---
  const org = await prisma.organization.upsert({
    where: { code: 'DEMO-CORP' },
    update: {},
    create: {
      code: 'DEMO-CORP',
      name: '建設デモ株式会社',
      nameKana: 'ケンセツデモカブシキガイシャ',
      address: '東京都千代田区1-1-1',
      phone: '03-0000-0000',
    },
  });

  // --- Departments ---
  const deptQuality = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'QUALITY' } },
    update: {},
    create: { code: 'QUALITY', name: '品質管理部', organizationId: org.id },
  });

  const deptSafety = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'SAFETY' } },
    update: {},
    create: { code: 'SAFETY', name: '安全環境部', organizationId: org.id },
  });

  // --- Roles ---
  const roles = [
    { code: 'SYSTEM_ADMIN', name: 'システム管理者' },
    { code: 'ISO_MANAGER', name: 'ISO統括管理者' },
    { code: 'QUALITY_MANAGER', name: '品質管理責任者' },
    { code: 'ENV_MANAGER', name: '環境管理責任者' },
    { code: 'SAFETY_MANAGER', name: '安全衛生管理責任者' },
    { code: 'ASSET_MANAGER', name: 'アセット管理責任者' },
    { code: 'BIM_MANAGER', name: 'BIM/CIM管理者' },
    { code: 'DEPT_MANAGER', name: '部門長' },
    { code: 'SITE_MANAGER', name: '工事管理者' },
    { code: 'SITE_WORKER', name: '現場担当者' },
    { code: 'AUDITOR_READONLY', name: '閲覧専用監査ユーザー' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  // --- Admin User ---
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'SYSTEM_ADMIN' } });
  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@civil-ims.local' },
    update: {},
    create: {
      email: 'admin@civil-ims.local',
      displayName: 'システム管理者',
      employeeNo: 'SYS001',
      organizationId: org.id,
      departmentId: deptQuality.id,
      passwordHash,
      roles: { create: { roleId: adminRole.id } },
    },
  });

  // --- Document Categories ---
  const docCategories = [
    { code: 'REGULATION', name: '規程・規則', isoStandard: null },
    { code: 'PROCEDURE', name: '手順書', isoStandard: null },
    { code: 'FORM', name: '様式・帳票', isoStandard: null },
    { code: 'QUALITY_PLAN', name: '品質計画書', isoStandard: '9001' },
    { code: 'ENV_PLAN', name: '環境管理計画書', isoStandard: '14001' },
    { code: 'SAFETY_PLAN', name: '安全衛生計画書', isoStandard: '45001' },
    { code: 'BEP', name: 'BEP', isoStandard: '19650' },
  ];

  for (const cat of docCategories) {
    await prisma.documentCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  // --- Sample Project ---
  await prisma.project.upsert({
    where: { code: 'DEMO-2026-001' },
    update: {},
    create: {
      code: 'DEMO-2026-001',
      name: 'デモ橋梁改修工事',
      clientName: 'デモ市役所',
      organizationId: org.id,
      managerId: adminUser.id,
      status: 'ACTIVE',
      createdBy: adminUser.id,
      description: '2026年度デモ橋梁改修工事',
    },
  });

  // --- Workflow Definitions ---
  const wfDefs = [
    {
      code: 'DOC_APPROVAL',
      name: '文書承認ワークフロー',
      targetType: 'document',
      steps: [
        { stepOrder: 1, stepName: '担当者確認', actionType: 'REVIEW' as const },
        { stepOrder: 2, stepName: '管理者承認', actionType: 'APPROVE' as const },
        { stepOrder: 3, stepName: '公開', actionType: 'PUBLISH' as const },
      ],
    },
    {
      code: 'CA_APPROVAL',
      name: '是正処置承認ワークフロー',
      targetType: 'corrective_action',
      steps: [
        { stepOrder: 1, stepName: '是正担当確認', actionType: 'REVIEW' as const },
        { stepOrder: 2, stepName: '管理責任者承認', actionType: 'APPROVE' as const },
      ],
    },
  ];

  for (const wf of wfDefs) {
    const existing = await prisma.workflowDefinition.findUnique({ where: { code: wf.code } });
    if (!existing) {
      await prisma.workflowDefinition.create({
        data: {
          code: wf.code,
          name: wf.name,
          targetType: wf.targetType,
          steps: { create: wf.steps },
        },
      });
    }
  }

  console.log('✅ Seed completed successfully.');
  console.log(`   Admin: admin@civil-ims.local / Admin1234!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

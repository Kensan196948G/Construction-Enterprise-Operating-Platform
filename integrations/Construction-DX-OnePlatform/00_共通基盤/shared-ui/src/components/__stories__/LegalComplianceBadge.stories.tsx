import type { Meta, StoryObj } from '@storybook/react';
import { LegalComplianceBadge, type LegalStandard } from '../LegalComplianceBadge';

const meta: Meta<typeof LegalComplianceBadge> = {
  title: 'ESG/LegalComplianceBadge',
  component: LegalComplianceBadge,
};
export default meta;

type Story = StoryObj<typeof LegalComplianceBadge>;

const STANDARDS: LegalStandard[] = [
  'iso9001',
  'iso14001',
  'iso45001',
  'constructionBusiness',
  'quality',
  'iConstruction',
  'ccus',
];

export const AllCompliant: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {STANDARDS.map((s) => (
        <LegalComplianceBadge key={s} standard={s} status="compliant" />
      ))}
    </div>
  ),
};

export const MixedStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <LegalComplianceBadge standard="iso9001" status="compliant" />
      <LegalComplianceBadge standard="iso14001" status="pending" />
      <LegalComplianceBadge standard="iso45001" status="nonCompliant" />
      <LegalComplianceBadge standard="iConstruction" status="compliant" />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';
import { FormBuilder, type FormField } from '../FormBuilder';

const schema = z.object({
  siteName: z.string().min(1, '現場名は必須です'),
  startDate: z.string().min(1, '開始日は必須です'),
  workType: z.string().min(1),
  budget: z.coerce.number().min(0),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const ConcreteFormBuilder = FormBuilder as (props: {
  schema: typeof schema;
  fields: FormField[];
  onSubmit: (values: FormValues) => void;
  submitLabel?: string;
  showReset?: boolean;
}) => JSX.Element;

const meta: Meta<typeof ConcreteFormBuilder> = {
  title: 'Foundation/FormBuilder',
  component: ConcreteFormBuilder,
};
export default meta;

type Story = StoryObj<typeof ConcreteFormBuilder>;

export const Default: Story = {
  args: {
    schema,
    fields: [
      {
        name: 'siteName',
        label: '現場名',
        type: 'text',
        required: true,
        placeholder: '例: 横浜駅西口開発',
      },
      { name: 'startDate', label: '開始日', type: 'date', required: true },
      {
        name: 'workType',
        label: '工種',
        type: 'select',
        required: true,
        options: [
          { label: '土木', value: 'civil' },
          { label: '建築', value: 'building' },
          { label: '電気', value: 'electric' },
        ],
      },
      { name: 'budget', label: '予算 (千円)', type: 'number', min: 0, step: 100 },
      { name: 'note', label: '備考', type: 'textarea', rows: 3 },
    ],
    onSubmit: (v: FormValues) => alert(JSON.stringify(v, null, 2)),
    showReset: true,
  },
};

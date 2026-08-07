import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'slate-50',
      values: [
        { name: 'slate-50', value: '#f8fafc' },
        { name: 'white', value: '#ffffff' },
        { name: 'slate-900', value: '#0f172a' },
      ],
    },
    a11y: {
      // 主要ルールを有効化
      element: '#storybook-root',
      manual: false,
    },
    layout: 'padded',
    options: {
      storySort: {
        order: [
          'Foundation',
          ['Layout', 'DataTable', 'FormBuilder', 'ChartWrapper', 'FileUploader'],
          'Status',
          ['OfflineIndicator', 'SyncStatusBar', 'AlertSeverityChip'],
          'Field',
          ['MapViewer', 'PhotoCard', 'SafetyBadge'],
          'KPI',
          ['KpiBigNumber', 'ProgressRing', 'RiskHeatmap', 'TimelineLog'],
          'BIM/DigitalTwin',
          ['BimViewerThumb', 'DigitalTwinPanel'],
          'ESG',
          ['SdgBadge', 'EsgScoreCard', 'LegalComplianceBadge'],
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;

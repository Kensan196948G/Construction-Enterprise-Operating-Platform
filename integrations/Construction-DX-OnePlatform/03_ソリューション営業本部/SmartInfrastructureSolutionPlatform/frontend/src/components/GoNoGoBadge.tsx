interface Props {
  decision: 'GO' | 'HOLD' | 'NO_GO' | string;
}

const STYLE: Record<string, string> = {
  GO: 'bg-sol-success text-white',
  HOLD: 'bg-sol-warning text-white',
  NO_GO: 'bg-sol-danger text-white',
};

const LABEL: Record<string, string> = {
  GO: 'GO',
  HOLD: 'HOLD',
  NO_GO: 'NO-GO',
};

export default function GoNoGoBadge({ decision }: Props) {
  const cls = STYLE[decision] ?? 'bg-gray-400 text-white';
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${cls}`}>
      {LABEL[decision] ?? decision}
    </span>
  );
}

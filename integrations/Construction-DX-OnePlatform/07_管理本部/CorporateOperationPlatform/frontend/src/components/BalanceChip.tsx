interface Props {
  balanced: boolean;
}

export function BalanceChip({ balanced }: Props) {
  if (balanced) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        借貸一致 ✓
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
      借貸不一致 !
    </span>
  );
}

export default BalanceChip;

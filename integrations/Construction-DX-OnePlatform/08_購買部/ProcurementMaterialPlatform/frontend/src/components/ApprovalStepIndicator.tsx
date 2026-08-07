import clsx from 'clsx';

interface Props {
  currentStep: number;
  totalSteps: number;
  status: string;
  labels?: string[];
}

const DEFAULT_LABELS = ['現場長', '部長', '役員'];

export function ApprovalStepIndicator({ currentStep, totalSteps, status, labels }: Props) {
  const steps = labels ?? DEFAULT_LABELS.slice(0, totalSteps);
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';

  return (
    <div className="flex items-center gap-2">
      {steps.map((label, idx) => {
        const stepNo = idx + 1;
        const done = stepNo <= currentStep && !isRejected;
        const current = stepNo === currentStep + 1 && !isApproved && !isRejected;
        return (
          <div key={label} className="flex items-center gap-1">
            <div
              className={clsx(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                done && 'bg-proc-ok text-white',
                current && 'bg-proc-accent text-white ring-2 ring-proc-accent/30',
                !done && !current && 'bg-gray-200 text-gray-500',
                isRejected && stepNo === currentStep && 'bg-proc-danger text-white',
              )}
            >
              {isRejected && stepNo === currentStep ? '×' : stepNo}
            </div>
            <span className="text-xs text-gray-700">{label}</span>
            {idx < steps.length - 1 && <span className="text-gray-300">→</span>}
          </div>
        );
      })}
      <span
        className={clsx(
          'ml-3 rounded px-2 py-0.5 text-xs',
          isApproved && 'bg-proc-ok/20 text-proc-ok',
          isRejected && 'bg-proc-danger/20 text-proc-danger',
          !isApproved && !isRejected && 'bg-gray-200 text-gray-700',
        )}
      >
        {status}
      </span>
    </div>
  );
}

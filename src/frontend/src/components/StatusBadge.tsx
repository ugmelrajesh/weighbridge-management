import { cn } from "@/lib/utils";
import type { TransactionStatus } from "../store/weighbridge";

const config: Record<TransactionStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    first_weighed: {
      label: "First Weighed",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    voided: {
      label: "Voided",
      className: "bg-gray-100 text-gray-500 border-gray-200",
    },
  };

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        className,
      )}
    >
      {label}
    </span>
  );
}

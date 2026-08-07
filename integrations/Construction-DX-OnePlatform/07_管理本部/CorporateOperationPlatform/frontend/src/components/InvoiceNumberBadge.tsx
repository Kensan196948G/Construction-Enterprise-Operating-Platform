import { useEffect, useState } from "react";
import { api, endpoints } from "../api/client";

interface Props {
  registrationNo: string;
}

interface ValidationResult {
  is_valid_format: boolean;
  is_registered: boolean | null;
  name?: string | null;
  note?: string | null;
}

export function InvoiceNumberBadge({ registrationNo }: Props) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!registrationNo) return;
    setLoading(true);
    api
      .get<ValidationResult>(endpoints.invoiceValidate(registrationNo))
      .then((r) => setResult(r.data))
      .catch(() => setResult({ is_valid_format: false, is_registered: false }))
      .finally(() => setLoading(false));
  }, [registrationNo]);

  if (loading) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100">
        検証中…
      </span>
    );
  }
  if (!result) return null;

  if (!result.is_valid_format) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
        形式エラー (T+13桁が必要)
      </span>
    );
  }
  if (result.is_registered === true) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        適格 ✓ {result.name ? `(${result.name})` : ""}
      </span>
    );
  }
  if (result.is_registered === false) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
        未登録
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-200 text-slate-700">
      形式OK (国税庁未照会)
    </span>
  );
}

export default InvoiceNumberBadge;

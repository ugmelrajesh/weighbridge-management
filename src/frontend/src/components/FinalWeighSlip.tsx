import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { printSettingsStore } from "../store/weighbridge";

interface FinalWeighSlipProps {
  transactionId: string;
  vehicleNumber: string;
  materialName: string;
  tareWeight: number;
  grossWeight: number;
  netWeight: number;
  firstWeighTime?: string;
  completedAt?: string;
  onClose?: () => void;
}

function getPageSize(size: string, orientation: string): string {
  if (size === "thermal80") return "80mm auto";
  const orient = orientation === "landscape" ? "landscape" : "portrait";
  if (size === "A4") return `A4 ${orient}`;
  return `A5 ${orient}`;
}

function formatDateTime(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}.${min}`;
}

export function FinalWeighSlip({
  vehicleNumber,
  materialName,
  tareWeight,
  grossWeight,
  netWeight,
  completedAt,
  onClose,
}: FinalWeighSlipProps) {
  const handlePrint = () => {
    const settings = printSettingsStore.get();
    const orientation = settings.estimateOrientation ?? "portrait";
    const pageSize = getPageSize(settings.finalWeigh, orientation);
    const styleId = "dynamic-print-page-size";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@media print { @page { size: ${pageSize} !important; margin: 10mm; } }`;
    setTimeout(() => window.print(), 50);
  };

  const dateStr = completedAt
    ? (() => {
        const d = new Date(completedAt);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${dd}-${mm}-${yyyy} ${hh}.${min}`;
      })()
    : formatDateTime();

  const rows = [
    { label: "DATE", value: dateStr },
    { label: "ITEM", value: materialName },
    { label: "TRUCK NO", value: vehicleNumber },
    { label: "FIRST WEIGHT", value: String(tareWeight) },
    { label: "SECOND WEIGHT", value: String(grossWeight) },
    { label: "NET WEIGHT", value: String(netWeight) },
  ];

  return (
    <div className="estimate-print-area">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .estimate-print-area,
          .estimate-print-area * { visibility: visible !important; }
          .estimate-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .no-print { display: none !important; }
          .estimate-slip-table {
            width: 100%;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div
        className="estimate-slip-table mx-auto"
        style={{ maxWidth: "700px", fontFamily: "Arial, sans-serif" }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1.5px solid #333",
          }}
        >
          <tbody>
            {/* Empty header row for company name */}
            <tr>
              <td
                colSpan={2}
                style={{
                  border: "1.5px solid #333",
                  height: "40px",
                  padding: "6px 12px",
                }}
              />
            </tr>
            {rows.map(({ label, value }) => (
              <tr key={label}>
                <td
                  style={{
                    border: "1.5px solid #333",
                    padding: "8px 14px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    width: "45%",
                    background: "#fff",
                    color: "#111",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    border: "1.5px solid #333",
                    padding: "8px 14px",
                    fontSize: "14px",
                    textAlign: "center",
                    background: "#fff",
                    color: "#111",
                    fontWeight: label === "NET WEIGHT" ? "bold" : "normal",
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-3 mt-5 no-print">
        <Button
          onClick={handlePrint}
          className="gap-2"
          data-ocid="final_weigh_slip.print.button"
        >
          <Printer className="w-4 h-4" /> Print Slip
        </Button>
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="gap-2"
            data-ocid="final_weigh_slip.close.button"
          >
            <X className="w-4 h-4" /> Close
          </Button>
        )}
      </div>
    </div>
  );
}

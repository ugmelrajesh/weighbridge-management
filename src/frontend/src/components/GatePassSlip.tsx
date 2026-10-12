import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { printSettingsStore } from "../store/weighbridge";

interface GatePassSlipProps {
  vehicleNumber: string;
  grossWeight: number;
  materialName: string;
  transactionId?: string;
  date?: string;
  time?: string;
  onClose?: () => void;
}

function getPageSize(size: string): string {
  if (size === "A4") return "210mm 297mm";
  if (size === "thermal80") return "80mm auto";
  return "148mm 210mm"; // A5
}

export function GatePassSlip({
  vehicleNumber,
  materialName,
  onClose,
}: GatePassSlipProps) {
  const handlePrint = () => {
    const settings = printSettingsStore.get();
    const pageSize = getPageSize(settings.gatePass);
    const styleId = "dynamic-print-page-size";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@media print { @page { size: ${pageSize}; margin: 10mm; } }`;
    window.print();
  };

  return (
    <div className="gate-pass-print-area">
      {/* Printable slip */}
      <div
        className="mx-auto bg-white text-black"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          maxWidth: "360px",
          padding: "20px 24px",
          textAlign: "center",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: "14px",
            letterSpacing: "4px",
            fontWeight: "bold",
            marginBottom: "16px",
          }}
        >
          GATE PASS
        </div>

        {/* Vehicle Number */}
        <div
          style={{
            fontWeight: "bold",
            fontSize: "25px",
            marginBottom: "12px",
          }}
        >
          {vehicleNumber}
        </div>

        {/* Material Name */}
        <div
          style={{
            fontWeight: "bold",
            fontSize: "35px",
          }}
        >
          {materialName}
        </div>
      </div>

      {/* Action buttons — hidden on print */}
      <div className="flex justify-center gap-3 mt-5 no-print">
        <Button
          onClick={handlePrint}
          className="gap-2"
          data-ocid="gate_pass.print.button"
        >
          <Printer className="w-4 h-4" /> Print Gate Pass
        </Button>
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="gap-2"
            data-ocid="gate_pass.close.button"
          >
            <X className="w-4 h-4" /> Close
          </Button>
        )}
      </div>
    </div>
  );
}

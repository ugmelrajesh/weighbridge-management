import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useRef } from "react";
import type {
  Buyer,
  Material,
  Supplier,
  Transaction,
  Vehicle,
} from "../store/weighbridge";
import { StatusBadge } from "./StatusBadge";

interface TicketProps {
  transaction: Transaction;
  vehicle: Vehicle;
  material: Material;
  supplier?: Supplier;
  buyer?: Buyer;
  onClose?: () => void;
}

function fmt(weight?: number): string {
  if (weight === undefined) return "—";
  return `${weight.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
}

function fmtDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function WeighbridgeTicket({
  transaction,
  vehicle,
  material,
  supplier,
  buyer,
  onClose,
}: TicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 no-print">
        <h2 className="font-semibold text-foreground">Weighbridge Ticket</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            data-ocid="ticket.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              data-ocid="ticket.close_button"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Ticket body */}
      <div
        ref={ticketRef}
        className="print-ticket border border-border rounded bg-white p-6 font-sans text-sm"
      >
        {/* Header */}
        <div className="text-center border-b-2 border-foreground/20 pb-4 mb-4">
          <div className="text-xl font-bold tracking-wider uppercase text-foreground">
            Weighbridge Management System
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Official Weighbridge Ticket
          </div>
        </div>

        {/* Transaction info row */}
        <div className="flex justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Transaction ID</div>
            <div className="font-bold font-mono text-foreground">
              {transaction.id}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Status</div>
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Date Created</div>
            <div className="font-medium">{fmtDate(transaction.createdAt)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="font-medium">
              {fmtDate(transaction.completedAt)}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-border my-3" />

        {/* Vehicle & material */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Vehicle
            </div>
            <div className="font-bold">{vehicle.plateNumber}</div>
            <div className="text-xs text-muted-foreground">
              {vehicle.grossWeight?.toLocaleString()} kg
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {vehicle.vehicleType}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Material
            </div>
            <div className="font-bold">{material.name}</div>
            <div className="text-xs text-muted-foreground">
              {material.category}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Supplier
            </div>
            <div className="font-medium">{supplier?.name || "—"}</div>
            {supplier && (
              <div className="text-xs text-muted-foreground">
                {supplier.contactPerson}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Buyer
            </div>
            <div className="font-medium">{buyer?.name || "—"}</div>
            {buyer && (
              <div className="text-xs text-muted-foreground">
                {buyer.contactPerson}
              </div>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-border my-3" />

        {/* Weights */}
        <div className="mb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
            Weight Details
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded p-3 text-center">
              <div className="text-xs text-muted-foreground">Gross Weight</div>
              <div className="font-bold mt-1">
                {fmt(transaction.firstWeight)}
              </div>
              {transaction.firstWeighTime && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {fmtDate(transaction.firstWeighTime)}
                </div>
              )}
            </div>
            <div className="bg-muted rounded p-3 text-center">
              <div className="text-xs text-muted-foreground">Tare Weight</div>
              <div className="font-bold mt-1">
                {fmt(transaction.secondWeight)}
              </div>
              {transaction.secondWeighTime && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {fmtDate(transaction.secondWeighTime)}
                </div>
              )}
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded p-3 text-center">
              <div className="text-xs text-primary/80 font-medium">
                Net Weight
              </div>
              <div className="text-lg font-bold text-primary mt-1">
                {fmt(transaction.netWeight)}
              </div>
            </div>
          </div>
        </div>

        {transaction.remarks && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Remarks
            </div>
            <div className="text-sm text-foreground">{transaction.remarks}</div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-3 flex justify-between text-xs text-muted-foreground">
          <span>Operator: {transaction.operatorId}</span>
          <span>WeighBridge Pro &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}

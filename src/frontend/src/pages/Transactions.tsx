import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Pencil,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FinalWeighSlip } from "../components/FinalWeighSlip";
import { GatePassSlip } from "../components/GatePassSlip";
import { StatusBadge } from "../components/StatusBadge";
import { WeighbridgeTicket } from "../components/WeighbridgeTicket";
import {
  type Transaction,
  type TransactionStatus,
  store,
} from "../store/weighbridge";

const PAGE_SIZE = 15;

function parseGP(remarks: string) {
  if (!remarks.startsWith("[GATE PASS]")) return null;
  const vehicleMatch = remarks.match(/Vehicle:\s*([^|]+)/);
  const materialMatch = remarks.match(/Material:\s*([^|]+)/);
  const weightMatch = remarks.match(/(?:Tare|Gross):\s*([\d.]+)kg/);
  return {
    vehicleNumber: vehicleMatch?.[1].trim() ?? "",
    materialName: materialMatch?.[1].trim() ?? "",
    tareWeight: weightMatch ? Number.parseFloat(weightMatch[1]) : 0,
  };
}

function buildGPRemarks(
  vehicleNumber: string,
  materialName: string,
  tareWeight: number,
) {
  return `[GATE PASS] Vehicle: ${vehicleNumber} | Material: ${materialName} | Tare: ${tareWeight}kg`;
}

function isGP(tx: Transaction) {
  return tx.remarks?.startsWith("[GATE PASS]") ?? false;
}

export function Transactions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [gatePassTx, setGatePassTx] = useState<Transaction | null>(null);
  const [printAfterOpen, setPrintAfterOpen] = useState(false);
  const [finalSlip, setFinalSlip] = useState<{
    transactionId: string;
    vehicleNumber: string;
    materialName: string;
    tareWeight: number;
    grossWeight: number;
    netWeight: number;
    firstWeighTime?: string;
    completedAt?: string;
  } | null>(null);

  // Edit state
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editVehicle, setEditVehicle] = useState("");
  const [editMaterial, setEditMaterial] = useState("");
  const [editTareField, setEditTareField] = useState("");
  const [editGrossField, setEditGrossField] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editStatus, setEditStatus] = useState<TransactionStatus>("pending");
  const [editSecondWeight, setEditSecondWeight] = useState("");

  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const vehicles = useMemo(() => store.getVehicles(), []);
  const materials = useMemo(() => store.getMaterials(), []);
  const suppliers = useMemo(() => store.getSuppliers(), []);
  const buyers = useMemo(() => store.getBuyers(), []);

  const allTxs = useMemo(() => {
    void refreshKey;
    return [...store.getTransactions()].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allTxs.filter((tx) => {
      const vehicle = vehicles.find((v) => v.id === tx.vehicleId);
      const material = materials.find((m) => m.id === tx.materialId);
      const gpData = parseGP(tx.remarks ?? "");
      const matchSearch =
        !q ||
        tx.id.toLowerCase().includes(q) ||
        vehicle?.plateNumber.toLowerCase().includes(q) ||
        material?.name.toLowerCase().includes(q) ||
        gpData?.vehicleNumber.toLowerCase().includes(q) ||
        gpData?.materialName.toLowerCase().includes(q);
      return (
        matchSearch && (statusFilter === "all" || tx.status === statusFilter)
      );
    });
  }, [allTxs, search, statusFilter, vehicles, materials]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = [
      "ID",
      "Vehicle",
      "Material",
      "Supplier",
      "Buyer",
      "Tare Weight (kg)",
      "Gross Weight (kg)",
      "Net Weight (kg)",
      "Status",
      "Created At",
      "Completed At",
    ];
    const rows = filtered.map((tx) => {
      const gp = parseGP(tx.remarks ?? "");
      return [
        tx.id,
        gp?.vehicleNumber ||
          vehicles.find((v) => v.id === tx.vehicleId)?.plateNumber ||
          "",
        gp?.materialName ||
          materials.find((m) => m.id === tx.materialId)?.name ||
          "",
        suppliers.find((s) => s.id === tx.supplierId)?.name || "",
        buyers.find((b) => b.id === tx.buyerId)?.name || "",
        gp ? (gp.tareWeight ?? tx.firstWeight ?? "") : (tx.firstWeight ?? ""),
        tx.secondWeight ?? "",
        tx.netWeight ?? "",
        tx.status,
        new Date(tx.createdAt).toISOString(),
        tx.completedAt ? new Date(tx.completedAt).toISOString() : "",
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const selectedVehicle = selectedTx
    ? vehicles.find((v) => v.id === selectedTx.vehicleId)
    : undefined;
  const selectedMaterial = selectedTx
    ? materials.find((m) => m.id === selectedTx.materialId)
    : undefined;
  const selectedSupplier = selectedTx?.supplierId
    ? suppliers.find((s) => s.id === selectedTx.supplierId)
    : undefined;
  const selectedBuyer = selectedTx?.buyerId
    ? buyers.find((b) => b.id === selectedTx.buyerId)
    : undefined;
  const gatePassData = gatePassTx ? parseGP(gatePassTx.remarks ?? "") : null;

  function openEditDialog(tx: Transaction) {
    const gpData = isGP(tx) ? parseGP(tx.remarks ?? "") : null;
    setEditTx(tx);
    setEditVehicle(gpData?.vehicleNumber ?? "");
    setEditMaterial(gpData?.materialName ?? "");
    setEditTareField(
      gpData ? String(gpData.tareWeight) : String(tx.firstWeight ?? ""),
    );
    setEditGrossField("");
    setEditRemarks(tx.remarks ?? "");
    setEditStatus(tx.status as TransactionStatus);
    setEditSecondWeight(
      tx.secondWeight !== undefined ? String(tx.secondWeight) : "",
    );
  }

  function handleEditSave() {
    if (!editTx) return;
    const now = Date.now();
    if (isGP(editTx)) {
      const tare = Number(editTareField) || (editTx.firstWeight ?? 0);
      const updates: Partial<Transaction> = {
        status: editStatus,
        remarks: buildGPRemarks(editVehicle.trim(), editMaterial.trim(), tare),
        firstWeight: tare,
      };
      if (editStatus === "completed" && editGrossField.trim() !== "") {
        const gross = Number(editGrossField);
        if (!Number.isNaN(gross) && gross > 0) {
          const net = Math.abs(gross - tare);
          updates.secondWeight = gross;
          updates.secondWeighTime = now;
          updates.netWeight = net;
          updates.completedAt = now;
          store.updateTransaction(editTx.id, updates);
          setEditTx(null);
          setRefreshKey((k) => k + 1);
          toast.success("Transaction completed.");
          setFinalSlip({
            transactionId: editTx.id,
            vehicleNumber: editVehicle.trim(),
            materialName: editMaterial.trim(),
            tareWeight: tare,
            grossWeight: gross,
            netWeight: net,
            firstWeighTime: editTx.firstWeighTime
              ? new Date(editTx.firstWeighTime).toLocaleString()
              : undefined,
            completedAt: new Date(now).toLocaleString(),
          });
          setTimeout(() => window.print(), 300);
          return;
        }
      }
      store.updateTransaction(editTx.id, updates);
    } else {
      const updates: Partial<Transaction> = {
        status: editStatus,
        remarks: editRemarks,
      };
      if (editStatus === "completed" && editSecondWeight.trim() !== "") {
        const tare = Number(editSecondWeight);
        updates.secondWeight = tare;
        if (editTx.firstWeight !== undefined) {
          updates.netWeight = editTx.firstWeight - tare;
          updates.completedAt = editTx.completedAt ?? now;
        }
      }
      store.updateTransaction(editTx.id, updates);
    }
    setEditTx(null);
    setRefreshKey((k) => k + 1);
    toast.success("Transaction updated");
  }

  function handleDelete() {
    if (!deleteTx) return;
    store.deleteTransaction(deleteTx.id);
    setDeleteTx(null);
    setRefreshKey((k) => k + 1);
    toast.success("Transaction deleted");
  }

  function handleDeleteAll() {
    store.clearAllTransactions();
    setDeleteAllOpen(false);
    setRefreshKey((k) => k + 1);
    toast.success("All transactions deleted");
  }

  function handleView(tx: Transaction) {
    setPrintAfterOpen(false);
    if (isGP(tx)) setGatePassTx(tx);
    else setSelectedTx(tx);
  }

  function handleReprint(tx: Transaction) {
    if (
      isGP(tx) &&
      tx.status === "completed" &&
      tx.secondWeight !== undefined
    ) {
      const gpData = parseGP(tx.remarks ?? "");
      setFinalSlip({
        transactionId: tx.id,
        vehicleNumber: gpData?.vehicleNumber ?? "",
        materialName: gpData?.materialName ?? "",
        tareWeight: tx.firstWeight ?? gpData?.tareWeight ?? 0,
        grossWeight: tx.secondWeight,
        netWeight: tx.netWeight ?? 0,
        firstWeighTime: tx.firstWeighTime
          ? new Date(tx.firstWeighTime).toLocaleString()
          : undefined,
        completedAt: tx.completedAt
          ? new Date(tx.completedAt).toLocaleString()
          : undefined,
      });
      setTimeout(() => window.print(), 300);
    } else {
      setPrintAfterOpen(true);
      if (isGP(tx)) setGatePassTx(tx);
      else setSelectedTx(tx);
    }
  }

  const editIsGP = editTx ? isGP(editTx) : false;
  const editTareNum = Number(editTareField) || 0;
  const editGrossNum = Number(editGrossField) || 0;
  const editNetPreview =
    editTareNum > 0 && editGrossNum > 0
      ? Math.abs(editGrossNum - editTareNum)
      : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">
          Transaction History
        </h1>
        <p className="text-sm text-muted-foreground">
          {allTxs.length} total transactions
        </p>
      </div>
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              All Transactions
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search ID, vehicle, material..."
                  className="pl-8 h-8 text-xs w-full sm:w-52"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  data-ocid="transactions.search_input"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="h-8 text-xs w-full sm:w-36"
                  data-ocid="transactions.status.select"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="first_weighed">First Weighed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={exportCSV}
                className="h-8 text-xs"
                data-ocid="transactions.export.button"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteAllOpen(true)}
                className="h-8 text-xs"
                data-ocid="transactions.delete_all.button"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Vehicle
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Material
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Tare (kg)
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Gross (kg)
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Net (kg)
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((tx, i) => {
                  const gpData = isGP(tx) ? parseGP(tx.remarks ?? "") : null;
                  return (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted/30"
                      data-ocid={`transactions.item.${i + 1}`}
                    >
                      <TableCell className="text-xs">
                        {gpData?.vehicleNumber ||
                          vehicles.find((v) => v.id === tx.vehicleId)
                            ?.plateNumber ||
                          "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {gpData?.materialName ||
                          materials.find((m) => m.id === tx.materialId)?.name ||
                          "—"}
                      </TableCell>
                      {/* Tare: firstWeight for gate pass, secondWeight for regular */}
                      <TableCell className="text-xs">
                        {isGP(tx)
                          ? (tx.firstWeight ?? gpData?.tareWeight) !== undefined
                            ? (tx.firstWeight ??
                                gpData?.tareWeight)!.toLocaleString()
                            : "—"
                          : tx.secondWeight !== undefined
                            ? tx.secondWeight.toLocaleString()
                            : "—"}
                      </TableCell>
                      {/* Gross: secondWeight for gate pass, firstWeight for regular */}
                      <TableCell className="text-xs">
                        {isGP(tx)
                          ? tx.secondWeight !== undefined
                            ? tx.secondWeight.toLocaleString()
                            : "—"
                          : tx.firstWeight !== undefined
                            ? tx.firstWeight.toLocaleString()
                            : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-bold">
                        {tx.netWeight !== undefined
                          ? tx.netWeight.toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tx.status as TransactionStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => handleView(tx)}
                            title="View"
                            data-ocid={`transactions.view.button.${i + 1}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => handleReprint(tx)}
                            title="Reprint"
                            data-ocid={`transactions.reprint.button.${i + 1}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => openEditDialog(tx)}
                            title="Edit"
                            data-ocid={`transactions.edit_button.${i + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                            onClick={() => setDeleteTx(tx)}
                            title="Delete"
                            data-ocid={`transactions.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-sm text-muted-foreground"
                      data-ocid="transactions.empty_state"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  data-ocid="transactions.pagination_prev"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  data-ocid="transactions.pagination_next"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weighbridge Ticket Modal */}
      <Dialog
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) setSelectedTx(null);
          else if (printAfterOpen) setTimeout(() => window.print(), 300);
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="transactions.ticket.modal"
        >
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTx && selectedVehicle && selectedMaterial && (
            <WeighbridgeTicket
              transaction={selectedTx}
              vehicle={selectedVehicle}
              material={selectedMaterial}
              supplier={selectedSupplier}
              buyer={selectedBuyer}
              onClose={() => setSelectedTx(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Gate Pass View/Reprint Modal */}
      <Dialog
        open={!!gatePassTx}
        onOpenChange={(open) => {
          if (!open) setGatePassTx(null);
          else if (printAfterOpen) setTimeout(() => window.print(), 300);
        }}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="transactions.gate_pass.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-center">Gate Pass</DialogTitle>
          </DialogHeader>
          {gatePassTx && gatePassData && (
            <GatePassSlip
              vehicleNumber={gatePassData.vehicleNumber}
              grossWeight={gatePassData.tareWeight}
              materialName={gatePassData.materialName}
              transactionId={`T${gatePassTx.firstWeighTime ?? gatePassTx.createdAt}`}
              date={new Date(
                gatePassTx.firstWeighTime ?? gatePassTx.createdAt,
              ).toLocaleDateString("en-US")}
              time={new Date(
                gatePassTx.firstWeighTime ?? gatePassTx.createdAt,
              ).toLocaleTimeString("en-US")}
              onClose={() => setGatePassTx(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Final Weighing Slip Modal */}
      <Dialog
        open={!!finalSlip}
        onOpenChange={(open) => !open && setFinalSlip(null)}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="transactions.final_slip.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-center">
              Final Weighing Slip
            </DialogTitle>
          </DialogHeader>
          {finalSlip && (
            <FinalWeighSlip {...finalSlip} onClose={() => setFinalSlip(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={(open) => !open && setEditTx(null)}>
        <DialogContent className="max-w-md" data-ocid="transactions.edit.modal">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              {editIsGP
                ? "Update gate pass or complete final weighing."
                : "Update transaction details."}
            </DialogDescription>
          </DialogHeader>
          {editTx && (
            <div className="space-y-4 py-2">
              {editIsGP ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Vehicle Number</Label>
                    <Input
                      value={editVehicle}
                      onChange={(e) => setEditVehicle(e.target.value)}
                      className="h-8 text-xs"
                      data-ocid="transactions.edit.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Material Name</Label>
                    <Input
                      value={editMaterial}
                      onChange={(e) => setEditMaterial(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Tare Weight (kg) — First Weigh
                    </Label>
                    <Input
                      type="number"
                      value={editTareField}
                      onChange={(e) => setEditTareField(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={editStatus}
                      onValueChange={(v) =>
                        setEditStatus(v as TransactionStatus)
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        data-ocid="transactions.edit.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="first_weighed">
                          First Weighed
                        </SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="voided">Voided</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editStatus === "completed" && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">
                          Final Weighing
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Gross Weight (kg) — Final Weigh{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={editGrossField}
                          onChange={(e) => setEditGrossField(e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Enter final gross weight"
                          data-ocid="transactions.edit.gross_weight_input"
                        />
                      </div>
                      {editNetPreview !== null && (
                        <div className="flex items-center justify-between rounded bg-primary/10 px-3 py-2">
                          <span className="text-xs text-primary/80 font-medium">
                            Calculated Net Weight
                          </span>
                          <span className="text-sm font-bold text-primary">
                            {editNetPreview.toLocaleString()} kg
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Saving will mark as Completed and open the print slip.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Remarks</Label>
                    <Textarea
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                      className="text-xs"
                      rows={3}
                      data-ocid="transactions.edit.textarea"
                    />
                  </div>
                  {editStatus === "completed" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Tare Weight (kg)</Label>
                      <Input
                        type="number"
                        value={editSecondWeight}
                        onChange={(e) => setEditSecondWeight(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Enter tare weight"
                        data-ocid="transactions.edit.tare_input"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={editStatus}
                      onValueChange={(v) =>
                        setEditStatus(v as TransactionStatus)
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        data-ocid="transactions.edit.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="first_weighed">
                          First Weighed
                        </SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="voided">Voided</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditTx(null)}
              data-ocid="transactions.edit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditSave}
              data-ocid="transactions.edit.save_button"
            >
              {editIsGP && editStatus === "completed" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete &amp;
                  Print
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <Dialog
        open={deleteAllOpen}
        onOpenChange={(open) => !open && setDeleteAllOpen(false)}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="transactions.delete_all.dialog"
        >
          <DialogHeader>
            <DialogTitle>Delete All Transactions</DialogTitle>
            <DialogDescription>
              This will permanently delete all {allTxs.length} transaction(s).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteAllOpen(false)}
              data-ocid="transactions.delete_all.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              data-ocid="transactions.delete_all.confirm_button"
            >
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTx}
        onOpenChange={(open) => !open && setDeleteTx(null)}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="transactions.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete transaction{" "}
              <span className="font-mono font-semibold">{deleteTx?.id}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTx(null)}
              data-ocid="transactions.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              data-ocid="transactions.delete.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

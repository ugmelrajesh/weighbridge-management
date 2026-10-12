import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArchiveRestore,
  Download,
  KeyRound,
  Pencil,
  Plus,
  Printer,
  Settings,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type EstimateOrientation,
  type Material,
  type MaterialUnit,
  type PrintPaperSize,
  type Vehicle,
  type VehicleType,
  pinStore,
  printSettingsStore,
  store,
} from "../store/weighbridge";

// ---- Delete key hook ----
function useDeleteKeyConfirm(isOpen: boolean, onConfirm: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete") {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onConfirm]);
}

// ---- CSV helpers for Vehicles ----
function exportVehiclesToExcel(vehicles: Vehicle[]) {
  const header = "Plate Number,Tare Weight (kg),Vehicle Type,Status";
  const rows = vehicles.map(
    (v) =>
      `${v.plateNumber},${v.grossWeight},${v.vehicleType},${v.isActive ? "Active" : "Inactive"}`,
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vehicles.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseVehiclesFromExcel(
  file: File,
  onDone: (imported: number, skipped: number) => void,
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const header = lines[0].toLowerCase();
      if (!header.includes("plate")) {
        toast.error(
          "Please upload a CSV file with columns: Plate Number, Tare Weight (kg), Vehicle Type",
        );
        return;
      }
      const dataLines = lines.slice(1);
      const existing = store.getVehicles();
      const existingPlates = new Set(
        existing.map((v) => v.plateNumber.toUpperCase()),
      );
      let imported = 0;
      let skipped = 0;
      for (const line of dataLines) {
        const cols = line.split(",").map((c) => c.trim());
        const plate = cols[0] ?? "";
        const weight = Number(cols[1] ?? 0);
        const typeRaw = (cols[2] ?? "truck").toLowerCase().trim();
        const validTypes: VehicleType[] = [
          "truck",
          "tanker",
          "trailer",
          "other",
        ];
        const vehicleType: VehicleType = validTypes.includes(
          typeRaw as VehicleType,
        )
          ? (typeRaw as VehicleType)
          : "other";
        if (!plate || weight <= 0) {
          skipped++;
          continue;
        }
        if (existingPlates.has(plate.toUpperCase())) {
          skipped++;
          continue;
        }
        store.createVehicle({
          plateNumber: plate,
          grossWeight: weight,
          vehicleType,
        });
        existingPlates.add(plate.toUpperCase());
        imported++;
      }
      onDone(imported, skipped);
    } catch {
      toast.error("Failed to parse file. Please check the format.");
    }
  };
  reader.readAsText(file);
}

// ---- Vehicles Tab ----
function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    store.getVehicles(),
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    plateNumber: "",
    grossWeight: 0,
    vehicleType: "truck" as VehicleType,
  });
  const importRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEditing(null);
    setForm({ plateNumber: "", grossWeight: 0, vehicleType: "truck" });
    setOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      plateNumber: v.plateNumber,
      grossWeight: v.grossWeight,
      vehicleType: v.vehicleType,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.plateNumber || form.grossWeight <= 0) {
      toast.error("All fields required");
      return;
    }
    if (editing) {
      store.updateVehicle(editing.id, form);
      toast.success("Vehicle updated");
    } else {
      store.createVehicle(form);
      toast.success("Vehicle added");
    }
    setVehicles(store.getVehicles());
    setOpen(false);
  };

  const handleToggleStatus = (v: Vehicle) => {
    store.toggleVehicleStatus(v.id);
    setVehicles(store.getVehicles());
    toast.success(
      `Vehicle ${v.plateNumber} set to ${v.isActive ? "Inactive" : "Active"}`,
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    store.deleteVehicle(deleteTarget.id);
    setVehicles(store.getVehicles());
    setDeleteTarget(null);
    toast.success("Vehicle permanently deleted");
  };

  const handleExport = () => {
    exportVehiclesToExcel(vehicles);
    toast.success(`Exported ${vehicles.length} vehicles to vehicles.csv`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseVehiclesFromExcel(file, (imported, skipped) => {
      setVehicles(store.getVehicles());
      if (imported > 0) {
        toast.success(
          `Imported ${imported} vehicle(s) successfully.${skipped > 0 ? ` ${skipped} row(s) skipped (duplicate or invalid).` : ""}`,
        );
      } else {
        toast.warning(
          `No new vehicles imported. ${skipped} row(s) were skipped (duplicate or invalid).`,
        );
      }
    });
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  useDeleteKeyConfirm(!!deleteTarget, handleDelete);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Vehicles ({vehicles.filter((v) => v.isActive).length} active)
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            data-ocid="vehicles.export_button"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Export Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => importRef.current?.click()}
            data-ocid="vehicles.import_button"
          >
            <Upload className="w-3.5 h-3.5 mr-1" /> Import Excel
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            size="sm"
            onClick={openAdd}
            data-ocid="vehicles.add.primary_button"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* Import hint */}
      <div className="mb-3 p-2 bg-muted/40 rounded text-xs text-muted-foreground border">
        <strong>Import format:</strong> Excel columns —{" "}
        <code>Plate Number</code>, <code>Tare Weight (kg)</code>,{" "}
        <code>Vehicle Type</code> (truck / tanker / trailer / other). Duplicate
        plates are skipped.
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase">
                Plate
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase">
                Tare Weight
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase">
                Type
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v, i) => (
              <TableRow key={v.id} data-ocid={`vehicles.item.${i + 1}`}>
                <TableCell className="font-mono text-xs font-medium">
                  {v.plateNumber}
                </TableCell>
                <TableCell className="text-xs">{`${v.grossWeight?.toLocaleString()} kg`}</TableCell>
                <TableCell className="text-xs capitalize">
                  {v.vehicleType}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={v.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {v.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => openEdit(v)}
                      data-ocid={`vehicles.edit_button.${i + 1}`}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 px-2 text-xs ${
                        v.isActive
                          ? "text-amber-600 border-amber-400 hover:bg-amber-50"
                          : "text-green-600 border-green-400 hover:bg-green-50"
                      }`}
                      onClick={() => handleToggleStatus(v)}
                      data-ocid={`vehicles.status_button.${i + 1}`}
                    >
                      {v.isActive ? (
                        <>
                          <ToggleRight className="w-3 h-3 mr-1" /> Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3 mr-1" /> Activate
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteTarget(v)}
                      data-ocid={`vehicles.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {vehicles.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground text-sm"
                  data-ocid="vehicles.empty_state"
                >
                  No vehicles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="vehicles.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Vehicle" : "Add Vehicle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Plate Number</Label>
              <Input
                className="mt-1"
                value={form.plateNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, plateNumber: e.target.value }))
                }
                data-ocid="vehicles.plate.input"
              />
            </div>
            <div>
              <Label>Tare Weight (kg)</Label>
              <Input
                className="mt-1"
                value={form.grossWeight === 0 ? "" : String(form.grossWeight)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    grossWeight: Number(e.target.value),
                  }))
                }
                type="number"
                placeholder="e.g. 20000"
                data-ocid="vehicles.grossWeight.input"
              />
            </div>
            <div>
              <Label>Vehicle Type</Label>
              <Select
                value={form.vehicleType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, vehicleType: v as VehicleType }))
                }
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="vehicles.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="tanker">Tanker</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="vehicles.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="vehicles.save_button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{deleteTarget?.plateNumber}</strong> from the system. This
              action cannot be undone.
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                Tip: Press the{" "}
                <kbd className="px-1 py-0.5 rounded border text-xs font-mono">
                  Delete
                </kbd>{" "}
                key to confirm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Materials Tab ----
function MaterialsTab() {
  const [materials, setMaterials] = useState<Material[]>(() =>
    store.getMaterials(),
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "ton" as MaterialUnit,
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", category: "", unit: "ton" });
    setOpen(true);
  };
  const openEdit = (m: Material) => {
    setEditing(m);
    setForm({ name: m.name, category: m.category, unit: m.unit });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.category) {
      toast.error("All fields required");
      return;
    }
    if (editing) {
      store.updateMaterial(editing.id, form);
      toast.success("Material updated");
    } else {
      store.createMaterial(form);
      toast.success("Material added");
    }
    setMaterials(store.getMaterials());
    setOpen(false);
  };

  const handleToggleStatus = (m: Material) => {
    store.toggleMaterialStatus(m.id);
    setMaterials(store.getMaterials());
    toast.success(
      `Material "${m.name}" set to ${m.isActive ? "Inactive" : "Active"}`,
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    store.deleteMaterial(deleteTarget.id);
    setMaterials(store.getMaterials());
    setDeleteTarget(null);
    toast.success("Material permanently deleted");
  };

  useDeleteKeyConfirm(!!deleteTarget, handleDelete);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Materials ({materials.filter((m) => m.isActive).length} active)
        </h2>
        <Button
          size="sm"
          onClick={openAdd}
          data-ocid="materials.add.primary_button"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Material
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase">
                Category
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase">
                Unit
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m, i) => (
              <TableRow key={m.id} data-ocid={`materials.item.${i + 1}`}>
                <TableCell className="font-medium text-xs">{m.name}</TableCell>
                <TableCell className="text-xs">{m.category}</TableCell>
                <TableCell className="text-xs uppercase">{m.unit}</TableCell>
                <TableCell>
                  <Badge
                    variant={m.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {m.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => openEdit(m)}
                      data-ocid={`materials.edit_button.${i + 1}`}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 px-2 text-xs ${
                        m.isActive
                          ? "text-amber-600 border-amber-400 hover:bg-amber-50"
                          : "text-green-600 border-green-400 hover:bg-green-50"
                      }`}
                      onClick={() => handleToggleStatus(m)}
                      data-ocid={`materials.status_button.${i + 1}`}
                    >
                      {m.isActive ? (
                        <>
                          <ToggleRight className="w-3 h-3 mr-1" /> Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3 mr-1" /> Activate
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteTarget(m)}
                      data-ocid={`materials.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {materials.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground text-sm"
                  data-ocid="materials.empty_state"
                >
                  No materials.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="materials.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Material" : "Add Material"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="materials.name.input"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                className="mt-1"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                data-ocid="materials.category.input"
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, unit: v as MaterialUnit }))
                }
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="materials.unit.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ton">ton</SelectItem>
                  <SelectItem value="liter">liter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="materials.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="materials.save_button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Material?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>{" "}
              from the system. This action cannot be undone.
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                Tip: Press the{" "}
                <kbd className="px-1 py-0.5 rounded border text-xs font-mono">
                  Delete
                </kbd>{" "}
                key to confirm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Backup & Restore Tab ----
interface BackupData {
  version: number;
  exportedAt: string;
  vehicles: unknown[];
  materials: unknown[];
  transactions: unknown[];
}

function BackupTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupData | null>(null);

  const vehicles = store.getVehicles();
  const materials = store.getMaterials();
  const transactions = store.getTransactions();

  const handleExport = () => {
    const payload: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      vehicles,
      materials,
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weighbridge-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      `Backup exported — ${vehicles.length} vehicles, ${materials.length} materials, ${transactions.length} transactions`,
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (
          !Array.isArray(parsed.vehicles) ||
          !Array.isArray(parsed.materials) ||
          !Array.isArray(parsed.transactions)
        ) {
          toast.error(
            "Invalid backup file. Missing vehicles, materials, or transactions.",
          );
          return;
        }
        setPendingRestore(parsed as BackupData);
      } catch {
        toast.error(
          "Failed to read backup file. Make sure it is a valid JSON.",
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRestoreConfirm = () => {
    if (!pendingRestore) return;
    localStorage.setItem(
      "wb_vehicles",
      JSON.stringify(pendingRestore.vehicles),
    );
    localStorage.setItem(
      "wb_materials",
      JSON.stringify(pendingRestore.materials),
    );
    localStorage.setItem(
      "wb_transactions",
      JSON.stringify(pendingRestore.transactions),
    );
    localStorage.setItem("wb_initialized", "1");
    setPendingRestore(null);
    toast.success(
      `Restore complete — ${pendingRestore.vehicles.length} vehicles, ${pendingRestore.materials.length} materials, ${pendingRestore.transactions.length} transactions loaded.`,
    );
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="space-y-6 max-w-xl">
      {/* Export Section */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Export Backup</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Download all your data as a JSON file. Use this to transfer data to
          another computer or keep a backup copy.
        </p>
        <p className="text-xs font-medium text-foreground">
          {vehicles.length} vehicles · {materials.length} materials ·{" "}
          {transactions.length} transactions
        </p>
        <Button
          onClick={handleExport}
          className="w-full sm:w-auto"
          data-ocid="backup.export_button"
        >
          <Download className="w-4 h-4 mr-2" /> Export Backup
        </Button>
      </div>

      {/* Restore Section */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Restore from Backup</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a previously exported backup file. This will{" "}
          <strong>REPLACE</strong> all current data.
        </p>

        {/* Warning */}
        <div className="flex gap-2 items-start rounded-md border border-amber-300 bg-amber-50 p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            Restoring will overwrite all existing vehicles, materials, and
            transactions. This cannot be undone.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
          data-ocid="backup.dropzone"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto"
          data-ocid="backup.upload_button"
        >
          <Upload className="w-4 h-4 mr-2" /> Upload Backup File
        </Button>
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={!!pendingRestore}
        onOpenChange={(open) => !open && setPendingRestore(null)}
      >
        <AlertDialogContent data-ocid="backup.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  This backup contains{" "}
                  <strong>
                    {pendingRestore?.vehicles.length ?? 0} vehicles
                  </strong>
                  ,{" "}
                  <strong>
                    {pendingRestore?.materials.length ?? 0} materials
                  </strong>
                  , and{" "}
                  <strong>
                    {pendingRestore?.transactions.length ?? 0} transactions
                  </strong>
                  .
                </p>
                {pendingRestore?.exportedAt && (
                  <p className="text-xs text-muted-foreground">
                    Exported on{" "}
                    {new Date(pendingRestore.exportedAt).toLocaleString()}
                  </p>
                )}
                <p className="text-amber-700 font-medium text-xs">
                  All current data will be permanently replaced. This cannot be
                  undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="backup.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="backup.confirm_button"
            >
              Restore Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change PIN Section */}
      <ChangePinSection />
    </div>
  );
}

// ---- Change PIN Section ----
function ChangePinSection() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handleUpdate = () => {
    setError("");
    if (!pinStore.verifyPin(currentPin)) {
      setError("Current PIN is incorrect.");
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setError("New PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PIN and confirmation do not match.");
      return;
    }
    pinStore.setPin(newPin);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    toast.success("PIN updated successfully.");
  };

  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Change PIN</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Update the 4-digit numeric PIN used to unlock the app.
      </p>
      <div className="space-y-3 max-w-xs">
        <div className="space-y-1">
          <Label className="text-xs">Current PIN</Label>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={currentPin}
            onChange={(e) => {
              setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            data-ocid="pin.current_input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">New PIN</Label>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={newPin}
            onChange={(e) => {
              setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            data-ocid="pin.new_input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Confirm New PIN</Label>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            data-ocid="pin.confirm_input"
          />
        </div>
        {error && (
          <p className="text-xs text-destructive" data-ocid="pin.error_state">
            {error}
          </p>
        )}
        <Button
          onClick={handleUpdate}
          className="w-full sm:w-auto"
          data-ocid="pin.submit_button"
        >
          <KeyRound className="w-3.5 h-3.5 mr-2" /> Update PIN
        </Button>
      </div>
    </div>
  );
}

// ---- Print Settings Tab ----
function PrintSettingsTab() {
  const [settings, setSettings] = useState(() => printSettingsStore.get());

  const handleSizeChange = (
    key: "gatePass" | "finalWeigh",
    value: PrintPaperSize,
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    printSettingsStore.save(updated);
    toast.success("Print settings saved");
  };

  const handleOrientationChange = (value: EstimateOrientation) => {
    const updated = { ...settings, estimateOrientation: value };
    setSettings(updated);
    printSettingsStore.save(updated);
    toast.success("Print settings saved");
  };

  const sizeLabel = (size: PrintPaperSize) => {
    if (size === "A4") return "A4 (210 × 297 mm)";
    if (size === "A5") return "A5 (148 × 210 mm)";
    return "Thermal 80mm";
  };

  const currentOrientation = settings.estimateOrientation ?? "portrait";

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Printer className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Gate Pass Slip (Estimate)</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Paper size used when printing the Gate Pass / Estimate slip.
        </p>
        <div className="flex gap-2 flex-wrap">
          {(["A4", "A5", "thermal80"] as PrintPaperSize[]).map((size) => (
            <button
              type="button"
              key={size}
              onClick={() => handleSizeChange("gatePass", size)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                settings.gatePass === size
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
              data-ocid={`print_settings.gatepass_${size}`}
            >
              {sizeLabel(size)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Printer className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">
            Estimate (Final Weighing) Slip
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Paper size used when printing the Final Weighing / Estimate slip.
        </p>
        <div className="flex gap-2 flex-wrap">
          {(["A4", "A5", "thermal80"] as PrintPaperSize[]).map((size) => (
            <button
              type="button"
              key={size}
              onClick={() => handleSizeChange("finalWeigh", size)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                settings.finalWeigh === size
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
              data-ocid={`print_settings.finalweigh_${size}`}
            >
              {sizeLabel(size)}
            </button>
          ))}
        </div>
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-xs font-medium text-foreground">
            Print Orientation
          </p>
          <p className="text-xs text-muted-foreground">
            Choose portrait or landscape for the Estimate slip printout.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleOrientationChange("portrait")}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                currentOrientation === "portrait"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
              data-ocid="print_settings.estimate_portrait"
            >
              &#9645; Portrait
            </button>
            <button
              type="button"
              onClick={() => handleOrientationChange("landscape")}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                currentOrientation === "landscape"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
              data-ocid="print_settings.estimate_landscape"
            >
              &#9643; Landscape
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Management() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Management Panel</h1>
        <p className="text-sm text-muted-foreground">
          Manage vehicles and materials
        </p>
      </div>
      <Tabs defaultValue="vehicles">
        <TabsList className="mb-4">
          <TabsTrigger value="vehicles" data-ocid="management.vehicles.tab">
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="materials" data-ocid="management.materials.tab">
            Materials
          </TabsTrigger>
          <TabsTrigger
            value="print-settings"
            data-ocid="management.print_settings.tab"
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            Print Settings
          </TabsTrigger>
          <TabsTrigger value="backup" data-ocid="management.backup.tab">
            <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
            Backup &amp; Restore
          </TabsTrigger>
        </TabsList>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <TabsContent value="vehicles">
              <VehiclesTab />
            </TabsContent>
            <TabsContent value="materials">
              <MaterialsTab />
            </TabsContent>
            <TabsContent value="print-settings">
              <PrintSettingsTab />
            </TabsContent>
            <TabsContent value="backup">
              <BackupTab />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

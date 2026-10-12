import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { FileCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { GatePassSlip } from "../components/GatePassSlip";
import { type Material, type Vehicle, store } from "../store/weighbridge";

function VehicleAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelect: (vehicle: Vehicle | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    if (value.length < 2) return [];
    const q = value.toUpperCase();
    return vehicles.filter((v) => v.plateNumber.toUpperCase().includes(q));
  }, [value, vehicles]);
  useEffect(() => {
    if (value.length >= 2) {
      setVehicles(store.getVehicles().filter((v) => v.isActive));
      setOpen(true);
    } else setOpen(false);
  }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id="gp-vehicle"
        className="mt-1"
        placeholder="e.g. KL-1234"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          onSelect(null);
        }}
        autoComplete="off"
        data-ocid="gate_pass.vehicle_number.input"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((v) => (
            <button
              key={v.id}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(v.plateNumber);
                onSelect(v);
                setOpen(false);
              }}
            >
              <span className="font-mono font-semibold">{v.plateNumber}</span>
              <span className="text-muted-foreground text-xs">
                {v.vehicleType} &mdash; {v.grossWeight.toLocaleString()} kg
              </span>
            </button>
          ))}
        </div>
      )}
      {open && value.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-sm px-3 py-2 text-xs text-muted-foreground">
          No saved vehicle found &mdash; enter details manually to save new
          vehicle
        </div>
      )}
    </div>
  );
}

function MaterialAutocomplete({
  value,
  onChange,
}: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    if (value.length < 1) return [];
    const q = value.toLowerCase();
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }, [value, materials]);
  useEffect(() => {
    if (value.length >= 1) {
      setMaterials(store.getMaterials().filter((m) => m.isActive));
      setOpen(true);
    } else setOpen(false);
  }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id="gp-material"
        className="mt-1"
        placeholder="e.g. M SAND, P SAND, DUST"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        data-ocid="gate_pass.material_name.input"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(m.name);
                setOpen(false);
              }}
            >
              <span className="font-semibold">{m.name}</span>
              <span className="text-muted-foreground text-xs">
                {m.category} &mdash; {m.unit}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && value.length >= 1 && filtered.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-sm px-3 py-2 text-xs text-muted-foreground">
          No saved material found &mdash; will be entered as custom material
        </div>
      )}
    </div>
  );
}

function GatePassForm() {
  const navigate = useNavigate();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [gatePassSlip, setGatePassSlip] = useState<{
    vehicleNumber: string;
    grossWeight: number;
    materialName: string;
    transactionId: string;
    date: string;
    time: string;
  } | null>(null);

  const handleSaveAndPrint = () => {
    if (!vehicleNumber.trim() || !materialName.trim() || !tareWeight.trim()) {
      toast.error("All fields are required");
      return;
    }
    const tw = Number.parseFloat(tareWeight);
    if (Number.isNaN(tw) || tw <= 0) {
      toast.error("Enter a valid tare weight");
      return;
    }
    const ts = Date.now();
    const tsDate = new Date(ts);
    if (!selectedVehicle) {
      const existing = store
        .getVehicles()
        .find(
          (v) =>
            v.plateNumber.toUpperCase() === vehicleNumber.trim().toUpperCase(),
        );
      if (!existing) {
        store.createVehicle({
          plateNumber: vehicleNumber.trim().toUpperCase(),
          grossWeight: tw,
          vehicleType: "truck",
        });
        toast.info(
          `New vehicle ${vehicleNumber.trim().toUpperCase()} saved to management panel`,
        );
      }
    }
    // Save as first_weighed with tare weight in firstWeight
    store.createTransaction({
      vehicleId: `gp-${ts}`,
      materialId: `gp-mat-${ts}`,
      operatorId: "gate-operator",
      status: "first_weighed",
      remarks: `[GATE PASS] Vehicle: ${vehicleNumber.trim()} | Material: ${materialName.trim()} | Tare: ${tw}kg`,
      firstWeight: tw,
      firstWeighTime: ts,
    });
    setGatePassSlip({
      vehicleNumber: vehicleNumber.trim(),
      grossWeight: tw,
      materialName: materialName.trim(),
      transactionId: `T${ts}`,
      date: tsDate.toLocaleDateString("en-US"),
      time: tsDate.toLocaleTimeString("en-US"),
    });
    toast.success("Gate pass saved as First Weigh In.");
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" /> Gate Pass Entry
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Saved as First Weigh In. Type 2+ characters to search saved
            vehicles.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gp-vehicle">
              Vehicle Number <span className="text-destructive">*</span>
            </Label>
            <VehicleAutocomplete
              value={vehicleNumber}
              onChange={setVehicleNumber}
              onSelect={(v) => {
                setSelectedVehicle(v);
                if (v) setTareWeight(v.grossWeight.toString());
              }}
            />
            {selectedVehicle && (
              <p className="text-xs text-green-600 mt-1">
                Matched saved vehicle &mdash; tare weight auto-filled
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="gp-material">
              Material Name <span className="text-destructive">*</span>
            </Label>
            <MaterialAutocomplete
              value={materialName}
              onChange={setMaterialName}
            />
          </div>
          <div>
            <Label htmlFor="gp-weight">
              Tare Weight (kg) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="gp-weight"
              type="number"
              min="0"
              step="0.01"
              className="mt-1 text-lg font-bold"
              placeholder="Enter tare weight in kg"
              value={tareWeight}
              onChange={(e) => setTareWeight(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveAndPrint()}
              data-ocid="gate_pass.gross_weight.input"
            />
            {!selectedVehicle && vehicleNumber.length >= 2 && (
              <p className="text-xs text-muted-foreground mt-1">
                New vehicle &mdash; tare weight will be saved to management
                panel
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/" })}
              data-ocid="gate_pass.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAndPrint}
              className="gap-2"
              data-ocid="gate_pass.save_print.button"
            >
              <FileCheck className="w-4 h-4" /> Save & Print Gate Pass
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={!!gatePassSlip}
        onOpenChange={(open) => !open && setGatePassSlip(null)}
      >
        <DialogContent className="max-w-sm" data-ocid="gate_pass.dialog">
          <DialogHeader>
            <DialogTitle className="text-center">Gate Pass</DialogTitle>
          </DialogHeader>
          {gatePassSlip && (
            <GatePassSlip
              {...gatePassSlip}
              onClose={() => {
                setGatePassSlip(null);
                setVehicleNumber("");
                setMaterialName("");
                setTareWeight("");
                setSelectedVehicle(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NewTransaction() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Gate Pass</h1>
        <p className="text-sm text-muted-foreground">
          Issue a gate pass for vehicle entry. Saved as First Weigh In record.
        </p>
      </div>
      <GatePassForm />
    </div>
  );
}

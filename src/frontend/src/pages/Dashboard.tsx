import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Plus,
  Scale,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { store } from "../store/weighbridge";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card
      className={`shadow-card border ${accent ? "border-primary/30 bg-primary/5" : ""}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent ? "bg-primary/20" : "bg-muted"}`}
          >
            <Icon
              className={`w-5 h-5 ${accent ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const stats = useMemo(() => store.getDashboardStats(), []);
  const recentTxs = useMemo(() => store.getRecentTransactions(), []);
  const vehicles = useMemo(() => store.getVehicles(), []);
  const materials = useMemo(() => store.getMaterials(), []);

  function vehiclePlate(id: string) {
    return vehicles.find((v) => v.id === id)?.plateNumber || id;
  }
  function materialName(id: string) {
    return materials.find((m) => m.id === id)?.name || id;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Weighbridge operations overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Transactions"
          value={stats.totalTransactionsToday}
          sub="Completed today"
          icon={Scale}
          accent
        />
        <StatCard
          title="Today's Net Weight"
          value={`${(stats.totalNetWeightToday / 1000).toFixed(2)} t`}
          sub="Metric tons"
          icon={TrendingUp}
        />
        <StatCard
          title="This Week"
          value={stats.totalTransactionsThisWeek}
          sub={`${(stats.totalNetWeightThisWeek / 1000).toFixed(2)} t net weight`}
          icon={Calendar}
        />
        <StatCard
          title="This Month"
          value={stats.totalTransactionsThisMonth}
          sub={`${(stats.totalNetWeightThisMonth / 1000).toFixed(2)} t net weight`}
          icon={BarChart3}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => navigate({ to: "/transactions/new" })}
          data-ocid="dashboard.new_transaction.primary_button"
        >
          <Plus className="w-4 h-4 mr-1" /> New Transaction
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/transactions" })}
          data-ocid="dashboard.view_transactions.secondary_button"
        >
          <ClipboardList className="w-4 h-4 mr-1" /> View All Transactions
        </Button>
      </div>

      {/* Recent transactions */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Vehicle
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Material
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Net Weight
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTxs.map((tx, i) => (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-muted/30"
                    data-ocid={`recent_transactions.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs font-medium text-primary">
                      {tx.id}
                    </TableCell>
                    <TableCell className="text-xs">
                      {vehiclePlate(tx.vehicleId)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {materialName(tx.materialId)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {tx.netWeight !== undefined
                        ? `${tx.netWeight.toLocaleString()} kg`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {recentTxs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-8"
                      data-ocid="recent_transactions.empty_state"
                    >
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

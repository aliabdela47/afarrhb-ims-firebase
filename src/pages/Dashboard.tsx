import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Package,
  AlertTriangle,
  ClipboardList,
  Truck,
  Plus,
  FilePlus2,
  ArrowRightCircle,
  Activity,
} from "lucide-react";

import { db } from "@/lib/firebase";
import {
  getAllDocs,
  queryDocs,
  convertTimestamps,
} from "@/lib/db";
import type {
  Item,
  Request,
  Issuance,
  Vehicle,
  AuditLog,
} from "@/entities";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// If you have a dedicated Spinner/Loader component, replace this with that.
const InlineSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
    Loading...
  </div>
);

// Simple error text renderer
const ErrorText: React.FC<{ message?: string }> = ({ message }) => (
  <div className="text-sm text-red-500 py-4">
    {message ?? "Something went wrong while loading data."}
  </div>
);

// Colors for charts (aligned with a typical AfarRHB gradient palette)
const VEHICLE_STATUS_COLORS: Record<string, string> = {
  available: "#22c55e", // green-500
  assigned: "#3b82f6", // blue-500
  maintenance: "#f97316", // orange-500
  inactive: "#6b7280", // gray-500
  other: "#a855f7", // purple-500
};

type IssuanceTrendPoint = {
  date: string;
  count: number;
};

type VehicleStatusPoint = {
  name: string;
  value: number;
};

const getLastNDays = (n: number): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  // Normalize to local midnight to keep labeling consistent
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
};

const formatDateLabel = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()}`; // MM/DD

const Dashboard: React.FC = () => {
  /**
   * KPI: Total Items
   */
  const {
    data: totalItems,
    isLoading: isTotalItemsLoading,
    error: totalItemsError,
  } = useQuery<number>({
    queryKey: ["dashboard", "totalItems"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "items"));
      return snapshot.size;
    },
  });

  /**
   * KPI & list: Low Stock Items
   * We fetch all items and filter client-side based on current_stock <= min_stock_level
   */
  const {
    data: lowStockItems,
    isLoading: isLowStockItemsLoading,
    error: lowStockItemsError,
  } = useQuery<Item[]>({
    queryKey: ["dashboard", "lowStockItems"],
    queryFn: async () => {
      const rawItems = await getAllDocs<Item>("items");
      const items = convertTimestamps<Item>(rawItems);
      return items.filter(
        (item) =>
          typeof item.current_stock === "number" &&
          typeof item.min_stock_level === "number" &&
          item.current_stock <= item.min_stock_level
      );
    },
  });

  const lowStockCount = lowStockItems?.length ?? 0;

  /**
   * KPI: Pending Requests
   */
  const {
    data: pendingRequestsCount,
    isLoading: isPendingRequestsLoading,
    error: pendingRequestsError,
  } = useQuery<number>({
    queryKey: ["dashboard", "pendingRequestsCount"],
    queryFn: async () => {
      const raw = await queryDocs<Request>("requests", [
        where("status", "==", "pending"),
      ]);
      return raw.length;
    },
  });

  /**
   * KPI: Active Vehicles (is_active == true and status in ['available', 'assigned'])
   */
  const {
    data: activeVehiclesCount,
    isLoading: isActiveVehiclesLoading,
    error: activeVehiclesError,
  } = useQuery<number>({
    queryKey: ["dashboard", "activeVehiclesCount"],
    queryFn: async () => {
      const vehiclesRaw = await getAllDocs<Vehicle>("vehicles");
      const vehicles = convertTimestamps<Vehicle>(vehiclesRaw);
      return vehicles.filter(
        (v) =>
          (v as any).is_active === true &&
          (v.status === "available" || v.status === "assigned")
      ).length;
    },
  });

  /**
   * Issuance Trend (7 days) - completed issuances only
   */
  const {
    data: issuanceTrendData,
    isLoading: isIssuanceTrendLoading,
    error: issuanceTrendError,
  } = useQuery<IssuanceTrendPoint[]>({
    queryKey: ["dashboard", "issuanceTrend"],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6); // include today: 7-day window
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "issuances"),
        where("status", "==", "completed"),
        where("issuance_date", ">=", Timestamp.fromDate(sevenDaysAgo)),
        orderBy("issuance_date", "asc")
      );

      const snapshot = await getDocs(q);
      const raw: Issuance[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Issuance),
      }));
      const issuances = convertTimestamps<Issuance>(raw);

      const days = getLastNDays(7);
      const countByDate: Record<string, number> = {};
      days.forEach((d) => {
        const key = d.toDateString();
        countByDate[key] = 0;
      });

      issuances.forEach((iss) => {
        const issDate =
          (iss as any).issuance_date instanceof Date
            ? (iss as any).issuance_date
            : (iss as any).issuance_date?.toDate?.() ??
              new Date((iss as any).issuance_date);
        issDate.setHours(0, 0, 0, 0);
        const key = issDate.toDateString();
        if (key in countByDate) {
          countByDate[key] += 1;
        }
      });

      const trend: IssuanceTrendPoint[] = days.map((d) => ({
        date: formatDateLabel(d),
        count: countByDate[d.toDateString()] ?? 0,
      }));

      return trend;
    },
  });

  /**
   * Recent Issuances (last 5 completed)
   */
  const {
    data: recentIssuances,
    isLoading: isRecentIssuancesLoading,
    error: recentIssuancesError,
  } = useQuery<Issuance[]>({
    queryKey: ["dashboard", "recentIssuances"],
    queryFn: async () => {
      const q = query(
        collection(db, "issuances"),
        where("status", "==", "completed"),
        orderBy("issuance_date", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const raw: Issuance[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Issuance),
      }));
      return convertTimestamps<Issuance>(raw);
    },
  });

  /**
   * Vehicle Status Distribution (pie chart)
   */
  const {
    data: vehicleStatusData,
    isLoading: isVehicleStatusLoading,
    error: vehicleStatusError,
  } = useQuery<VehicleStatusPoint[]>({
    queryKey: ["dashboard", "vehicleStatusData"],
    queryFn: async () => {
      const vehiclesRaw = await getAllDocs<Vehicle>("vehicles");
      const vehicles = convertTimestamps<Vehicle>(vehiclesRaw);

      const counts: Record<string, number> = {};
      vehicles.forEach((v) => {
        const status = (v.status || "other").toLowerCase();
        counts[status] = (counts[status] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });

  /**
   * Recent Activity (audit_logs, last 5)
   */
  const {
    data: recentActivity,
    isLoading: isRecentActivityLoading,
    error: recentActivityError,
  } = useQuery<AuditLog[]>({
    queryKey: ["dashboard", "recentActivity"],
    queryFn: async () => {
      const q = query(
        collection(db, "audit_logs"),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const raw: AuditLog[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as AuditLog),
      }));
      return convertTimestamps<AuditLog>(raw);
    },
  });

  /**
   * Memoized Pie data with fallback
   */
  const vehicleStatusPieData = useMemo<VehicleStatusPoint[]>(() => {
    return vehicleStatusData ?? [];
  }, [vehicleStatusData]);

  /**
   * NOTE ABOUT SPARKLINES:
   * The spec mentions 30-day sparkline trends.
   * Implementing those would require additional endpoints or
   * heavier aggregations. For now, intentionally omitted and
   * left as a future enhancement as per the spec.
   */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50 px-4 py-6 md:px-8 lg:px-10">
      {/* Page header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:mb-8 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Overview of inventory, requests, fleet status, and recent activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="glass-card border-slate-700/60 bg-slate-900/60 backdrop-blur"
          >
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Items */}
        <Card className="glass-card border-slate-800/60 bg-gradient-to-br from-sky-500/15 via-slate-900/70 to-slate-950/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-slate-200">
              Total Items
            </CardTitle>
            <div className="rounded-full bg-sky-500/15 p-2">
              <Package className="h-4 w-4 text-sky-400" />
            </div>
          </CardHeader>
          <CardContent>
            {totalItemsError ? (
              <ErrorText message="Failed to load total items." />
            ) : isTotalItemsLoading ? (
              <InlineSpinner />
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight">
                  {totalItems ?? 0}
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Total active inventory items.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="glass-card border-slate-800/60 bg-gradient-to-br from-amber-500/15 via-slate-900/70 to-slate-950/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-slate-200">
              Low Stock Alerts
            </CardTitle>
            <div className="rounded-full bg-amber-500/15 p-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {lowStockItemsError ? (
              <ErrorText message="Failed to load low stock items." />
            ) : isLowStockItemsLoading ? (
              <InlineSpinner />
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight">
                  {lowStockCount}
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Items at or below minimum stock level.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="glass-card border-slate-800/60 bg-gradient-to-br from-violet-500/15 via-slate-900/70 to-slate-950/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-slate-200">
              Pending Requests
            </CardTitle>
            <div className="rounded-full bg-violet-500/15 p-2">
              <ClipboardList className="h-4 w-4 text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            {pendingRequestsError ? (
              <ErrorText message="Failed to load pending requests." />
            ) : isPendingRequestsLoading ? (
              <InlineSpinner />
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight">
                  {pendingRequestsCount ?? 0}
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Requests awaiting approval or processing.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Vehicles */}
        <Card className="glass-card border-slate-800/60 bg-gradient-to-br from-emerald-500/15 via-slate-900/70 to-slate-950/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-slate-200">
              Active Vehicles
            </CardTitle>
            <div className="rounded-full bg-emerald-500/15 p-2">
              <Truck className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            {activeVehiclesError ? (
              <ErrorText message="Failed to load active vehicles." />
            ) : isActiveVehiclesLoading ? (
              <InlineSpinner />
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight">
                  {activeVehiclesCount ?? 0}
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Vehicles currently available or assigned.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Button className="glass-card flex w-full items-center justify-between border border-slate-800/60 bg-slate-900/70 text-slate-100 hover:bg-slate-900/90">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            New Item
          </div>
          <ArrowRightCircle className="h-4 w-4 text-slate-400" />
        </Button>
        <Button className="glass-card flex w-full items-center justify-between border border-slate-800/60 bg-slate-900/70 text-slate-100 hover:bg-slate-900/90">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FilePlus2 className="h-4 w-4" />
            Create Request
          </div>
          <ArrowRightCircle className="h-4 w-4 text-slate-400" />
        </Button>
        <Button className="glass-card flex w-full items-center justify-between border border-slate-800/60 bg-slate-900/70 text-slate-100 hover:bg-slate-900/90">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4" />
            Issue Items
          </div>
          <ArrowRightCircle className="h-4 w-4 text-slate-400" />
        </Button>
        <Button className="glass-card flex w-full items-center justify-between border border-slate-800/60 bg-slate-900/70 text-slate-100 hover:bg-slate-900/90">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Truck className="h-4 w-4" />
            Track Vehicle
          </div>
          <ArrowRightCircle className="h-4 w-4 text-slate-400" />
        </Button>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left column: Issuance Trend + Recent Issuances */}
        <div className="space-y-6 xl:col-span-2">
          {/* Issuance trend chart */}
          <Card className="glass-card border-slate-800/60 bg-slate-950/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-100">
                  Issuances (Last 7 Days)
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Daily count of completed issuances.
                </p>
              </div>
            </CardHeader>
            <CardContent className="h-64">
              {issuanceTrendError ? (
                <ErrorText message="Failed to load issuance trend." />
              ) : isIssuanceTrendLoading ? (
                <InlineSpinner />
              ) : issuanceTrendData && issuanceTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={issuanceTrendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148, 163, 184, 0.15)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid rgba(148,163,184,0.3)",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                      }}
                      cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#issuanceBarGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient
                        id="issuanceBarGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                        <stop
                          offset="100%"
                          stopColor="#0f172a"
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No issuance data available for the last 7 days.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Issuances */}
          <Card className="glass-card border-slate-800/60 bg-slate-950/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-100">
                  Recent Issuances
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last 5 completed issuance records.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentIssuancesError ? (
                <ErrorText message="Failed to load recent issuances." />
              ) : isRecentIssuancesLoading ? (
                <InlineSpinner />
              ) : recentIssuances && recentIssuances.length > 0 ? (
                <ul className="space-y-2.5 text-xs">
                  {recentIssuances.map((iss) => {
                    const date =
                      (iss as any).issuance_date instanceof Date
                        ? (iss as any).issuance_date
                        : (iss as any).issuance_date?.toDate?.() ??
                          new Date((iss as any).issuance_date);

                    return (
                      <li
                        key={(iss as any).id ?? JSON.stringify(iss)}
                        className="flex items-center justify-between rounded-md border border-slate-800/60 bg-slate-900/60 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-100">
                            {(iss as any).reference_code ??
                              (iss as any).id ??
                              "Issuance"}
                          </span>
                          <span className="mt-0.5 text-[0.7rem] text-slate-400">
                            {(iss as any).facility_name ??
                              (iss as any).destination ??
                              "Destination not specified"}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[0.7rem] text-slate-400">
                            {date instanceof Date
                              ? date.toLocaleDateString()
                              : "—"}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0 text-[0.65rem] uppercase text-emerald-300"
                          >
                            Completed
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No completed issuances recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Vehicle Status, Activity, Low Stock */}
        <div className="space-y-6">
          {/* Vehicle Status Distribution */}
          <Card className="glass-card border-slate-800/60 bg-slate-950/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-100">
                Vehicle Status
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Distribution of vehicles by operational status.
              </p>
            </CardHeader>
            <CardContent className="flex h-56 items-center justify-between gap-4">
              {vehicleStatusError ? (
                <ErrorText message="Failed to load vehicle status distribution." />
              ) : isVehicleStatusLoading ? (
                <InlineSpinner />
              ) : vehicleStatusPieData.length > 0 ? (
                <>
                  <div className="h-full w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#020617",
                            border: "1px solid rgba(148,163,184,0.3)",
                            borderRadius: "0.5rem",
                            fontSize: "0.75rem",
                          }}
                        />
                        <Pie
                          data={vehicleStatusPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          stroke="rgba(15,23,42,0.9)"
                          strokeWidth={2}
                        >
                          {vehicleStatusPieData.map((entry, index) => {
                            const key = entry.name?.toLowerCase?.() ?? "other";
                            const color =
                              VEHICLE_STATUS_COLORS[key] ??
                              VEHICLE_STATUS_COLORS.other;
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={color}
                              />
                            );
                          })}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex w-1/2 flex-col gap-1.5 text-xs">
                    {vehicleStatusPieData.map((entry) => {
                      const key = entry.name?.toLowerCase?.() ?? "other";
                      const color =
                        VEHICLE_STATUS_COLORS[key] ??
                        VEHICLE_STATUS_COLORS.other;
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="capitalize text-slate-200">
                              {entry.name}
                            </span>
                          </div>
                          <span className="font-medium text-slate-100">
                            {entry.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="w-full text-center text-xs text-muted-foreground">
                  No vehicle data available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass-card border-slate-800/60 bg-slate-950/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-100">
                Recent Activity
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest audit log entries from the system.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivityError ? (
                <ErrorText message="Failed to load recent activity." />
              ) : isRecentActivityLoading ? (
                <InlineSpinner />
              ) : recentActivity && recentActivity.length > 0 ? (
                <ul className="space-y-2.5 text-xs">
                  {recentActivity.map((log) => {
                    const ts =
                      (log as any).timestamp instanceof Date
                        ? (log as any).timestamp
                        : (log as any).timestamp?.toDate?.() ??
                          new Date((log as any).timestamp);

                    return (
                      <li
                        key={(log as any).id ?? JSON.stringify(log)}
                        className="flex items-start justify-between rounded-md border border-slate-800/60 bg-slate-900/60 px-3 py-2"
                      >
                        <div className="flex flex-1 flex-col pr-2">
                          <span className="font-medium text-slate-100">
                            {(log as any).action ??
                              (log as any).event ??
                              "Activity"}
                          </span>
                          <span className="mt-0.5 text-[0.7rem] text-slate-400">
                            {(log as any).description ??
                              (log as any).details ??
                              "No additional details."}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[0.65rem] text-slate-500">
                            {ts instanceof Date
                              ? ts.toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </span>
                          {(log as any).actor && (
                            <Badge
                              variant="outline"
                              className="border-slate-700/60 bg-slate-900/60 px-1.5 py-0 text-[0.65rem]"
                            >
                              {(log as any).actor}
                            </Badge>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No recent activity recorded.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Items list */}
          <Card className="glass-card border-slate-800/60 bg-slate-950/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-100">
                Low Stock Items
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Items at or below their defined minimum stock level.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockItemsError ? (
                <ErrorText message="Failed to load low stock items." />
              ) : isLowStockItemsLoading ? (
                <InlineSpinner />
              ) : lowStockItems && lowStockItems.length > 0 ? (
                <ul className="space-y-2.5 text-xs">
                  {lowStockItems.slice(0, 5).map((item) => (
                    <li
                      key={(item as any).id ?? JSON.stringify(item)}
                      className="flex items-center justify-between rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-100">
                          {(item as any).name ??
                            (item as any).item_name ??
                            "Item"}
                        </span>
                        <span className="mt-0.5 text-[0.7rem] text-slate-400">
                          Code:{" "}
                          {(item as any).code ??
                            (item as any).sku ??
                            "—"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[0.7rem] text-slate-200">
                          {(item as any).current_stock ?? 0} /{" "}
                          {(item as any).min_stock_level ?? 0}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[0.65rem] text-amber-300"
                        >
                          Low stock
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No items are currently below their minimum stock level.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
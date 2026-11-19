import React, { useEffect, useState } from 'react';
import {
  Users,
  Database,
  Activity,
  Gauge,
  RefreshCw,
  Download,
} from 'lucide-react';
import { FilterBar } from '../components/FilterBar';
import { EChartWrapper } from '../components/EChartWrapper';
import { MetricCard, ChartContainer, Button, ErrorState } from '../components/ui';
import { api, downloadFile } from '../services/api';
import { SafetyBeacon3D } from '../components/SafetyBeacon3D';
import {
  DashboardSummary,
  FilterState,
  TrendPoint,
  ZoneComparison,
  StatusDistribution,
  HistogramBin,
  HeatmapCell,
  LoginResponse,
} from '../types';

export const ExecutiveDashboardPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(() => {
    try { return JSON.parse(localStorage.getItem('chromaguard_user') || 'null'); } catch { return null; }
  });
  const isWorker = currentUser?.role === 'ROLE_WORKER';
  const workerId = isWorker ? currentUser?.associatedWorkerId || '' : '';
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    zoneId: '',
    shiftId: '',
    workerId: workerId,
    demoStatus: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [zoneComparison, setZoneComparison] = useState<ZoneComparison[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDistribution[]>([]);
  const [histogram, setHistogram] = useState<HistogramBin[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [workerComp, setWorkerComp] = useState<any[]>([]);

  const loadData = async (activeFilters: FilterState) => {
    setLoading(true);
    setError(null);
    try {
      if (isWorker && !workerId) {
        throw new Error('This worker account is not linked to a worker profile. Ask an administrator to link it before viewing exposure data.');
      }
      const scopedFilters = isWorker ? { ...activeFilters, workerId } : activeFilters;
      const [sumRes, trendRes, zoneRes, statusRes, histRes, heatRes, workerRes] = await Promise.all([
        api.getSummary(scopedFilters),
        api.getTrends(scopedFilters),
        api.getZoneComparison(scopedFilters),
        api.getStatusDistribution(scopedFilters),
        api.getHistogram(scopedFilters, 10),
        api.getHeatmap(scopedFilters),
        currentUser?.role === 'ROLE_ADMIN' ? api.getWorkerComparison(scopedFilters, 8) : Promise.resolve([]),
      ]);

      setSummary(sumRes);
      setTrends(trendRes);
      setZoneComparison(zoneRes);
      setStatusDist(statusRes);
      setHistogram(histRes);
      setHeatmap(heatRes);
      setWorkerComp(workerRes);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filters);
  }, [filters, currentUser]);

  useEffect(() => {
    const handleUserChanged = (event: Event) => {
      const user = (event as CustomEvent<LoginResponse>).detail;
      setCurrentUser(user);
      setFilters((previous) => ({ ...previous, workerId: user?.role === 'ROLE_WORKER' ? user.associatedWorkerId || '' : '' }));
    };
    window.addEventListener('chromaguard:user-changed', handleUserChanged);
    return () => window.removeEventListener('chromaguard:user-changed', handleUserChanged);
  }, []);

  useEffect(() => {
    const handleReset = () => loadData(filters);
    window.addEventListener('chromaguard:simulation-reset', handleReset);
    return () => window.removeEventListener('chromaguard:simulation-reset', handleReset);
  }, [filters]);

  const handleExportCsv = () => {
    void downloadFile(api.getExportCsvUrl(filters));
  };

  // 1. Line Chart Option: Exposure Trend by Date
  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#26384CFFF',
      borderColor: '#E8793A',
      textStyle: { color: '#21354B' },
      formatter: (params: any) => {
        if (!params || !params.length) return '';
        const d = params[0].axisValue;
        let html = `<div style="font-weight:600;margin-bottom:4px;color:#E8793A;">Date: ${d}</div>`;
        params.forEach((p: any) => {
          html += `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;">
            <span style="color:${p.color}">● ${p.seriesName}:</span>
            <strong style="color:#26384C">${Number(p.value).toFixed(2)} ppm·hr</strong>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      data: ['Daily Mean Dose', 'Peak Observed Dose'],
      textStyle: { color: '#748194', fontSize: 11 },
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trends.map((t) => t.date),
      axisLine: { lineStyle: { color: '#D9E0E5' } },
      axisLabel: {
        color: '#748194',
        fontSize: 10,
        formatter: (val: string) => val.slice(5), // MM-DD
      },
    },
    yAxis: {
      type: 'value',
      name: 'Dose (ppm·hr)',
      nameTextStyle: { color: '#748194', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(30,48,69,0.08)' } },
      axisLabel: { color: '#748194', fontSize: 10 },
    },
    series: [
      {
        name: 'Daily Mean Dose',
        type: 'line',
        data: trends.map((t) => t.avgExposurePpmHr),
        smooth: true,
        itemStyle: { color: '#E8793A' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 240, 255, 0.35)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0.0)' },
            ],
          },
        },
      },
      {
        name: 'Peak Observed Dose',
        type: 'line',
        data: trends.map((t) => t.maxExposurePpmHr),
        smooth: true,
        itemStyle: { color: '#F59E0B' },
        lineStyle: { width: 2, type: 'dashed' },
      },
    ],
  };

  // 2. Bar Chart Option: Zone Comparison
  const zoneChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#26384CFFF',
      borderColor: '#4B8B7C',
      textStyle: { color: '#21354B' },
      formatter: (params: any) => {
        if (!params || !params.length) return '';
        const zCode = params[0].axisValue;
        const match = zoneComparison.find((z) => z.zoneCode === zCode);
        let html = `<div style="font-weight:600;margin-bottom:4px;color:#4B8B7C;">${zCode} - ${match ? match.zoneName : ''}</div>`;
        params.forEach((p: any) => {
          html += `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;">
            <span style="color:${p.color}">● ${p.seriesName}:</span>
            <strong style="color:#26384C">${Number(p.value).toFixed(2)} ppm·hr</strong>
          </div>`;
        });
        if (match) {
          html += `<div style="font-size:10px;color:#748194;margin-top:4px;">Risk Tier: <strong style="color:#F59E0B">${match.riskTier}</strong> | Alerts: ${match.alertCount}</div>`;
        }
        return html;
      },
    },
    legend: {
      data: ['Observed Mean Dose', 'Baseline Target Dose'],
      textStyle: { color: '#748194', fontSize: 11 },
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: zoneComparison.map((z) => z.zoneCode),
      axisLine: { lineStyle: { color: '#D9E0E5' } },
      axisLabel: { color: '#748194', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: 'ppm·hr',
      nameTextStyle: { color: '#748194', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(30,48,69,0.08)' } },
      axisLabel: { color: '#748194', fontSize: 10 },
    },
    series: [
      {
        name: 'Observed Mean Dose',
        type: 'bar',
        data: zoneComparison.map((z) => z.avgExposurePpmHr),
        barWidth: '28%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#00B4D8',
        },
      },
      {
        name: 'Baseline Target Dose',
        type: 'bar',
        data: zoneComparison.map((z) => z.baselineExposure),
        barWidth: '28%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#475569',
        },
      },
    ],
  };

  // 3. Donut Chart Option: Status Distribution
  const statusDonutOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#26384CFFF',
      borderColor: '#E8793A',
      textStyle: { color: '#21354B' },
      formatter: '{b}: <strong>{c} records</strong> ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '4%',
      top: 'center',
      textStyle: { color: '#748194', fontSize: 11 },
    },
    series: [
      {
        name: 'Demo Status',
        type: 'pie',
        radius: ['50%', '74%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#21354B',
          },
        },
        data: statusDist.map((s) => ({
          name: s.displayName,
          value: s.count,
          itemStyle: { color: s.color },
        })),
      },
    ],
  };

  // 4. Histogram Option: Exposure Value Distribution
  const histogramOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#26384CFFF',
      borderColor: '#E8793A',
      textStyle: { color: '#21354B' },
      formatter: (params: any) => {
        if (!params || !params.length) return '';
        const bin = params[0].axisValue;
        const count = params[0].value;
        return `<div style="font-weight:600;color:#E8793A;">Interval: ${bin} ppm·hr</div>
          <div style="font-size:11px;margin-top:2px;">Records: <strong>${count}</strong></div>`;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: histogram.map((h) => h.binLabel),
      axisLine: { lineStyle: { color: '#D9E0E5' } },
      axisLabel: { color: '#748194', rotate: 25, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: 'Frequency',
      nameTextStyle: { color: '#748194', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(30,48,69,0.08)' } },
      axisLabel: { color: '#748194', fontSize: 10 },
    },
    series: [
      {
        name: 'Frequency',
        type: 'bar',
        data: histogram.map((h) => h.count),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#E8793A' },
              { offset: 1, color: '#26384CFFF' },
            ],
          },
        },
      },
    ],
  };

  // 5. Horizontal Bar Option: Top Exposed Workers
  const workerCompOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#26384CFFF',
      borderColor: '#E8793A',
      textStyle: { color: '#21354B' },
      formatter: (params: any) => {
        if (!params || !params.length) return '';
        const name = params[0].axisValue;
        const match = workerComp.find((w) => w.workerName === name);
        let html = `<div style="font-weight:600;color:#E8793A;">${name}</div>`;
        if (match) {
          html += `<div style="font-size:11px;color:#748194;">Badge: ${match.workerId}</div>
            <div style="font-size:11px;margin-top:4px;">Mean Dose: <strong>${match.avgExposurePpmHr} ppm·hr</strong></div>
            <div style="font-size:11px;">Peak Dose: <strong>${match.maxExposurePpmHr} ppm·hr</strong></div>
            <div style="font-size:11px;">Events: <strong>${match.recordCount}</strong></div>`;
        }
        return html;
      },
    },
    grid: { left: '3%', right: '6%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'value',
      name: 'ppm·hr',
      splitLine: { lineStyle: { color: 'rgba(30,48,69,0.08)' } },
      axisLabel: { color: '#748194', fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: workerComp.map((w) => w.workerName).reverse(),
      axisLine: { lineStyle: { color: '#D9E0E5' } },
      axisLabel: { color: '#748194', fontSize: 11 },
    },
    series: [
      {
        name: 'Mean Exposure',
        type: 'bar',
        data: workerComp.map((w) => w.avgExposurePpmHr).reverse(),
        barWidth: '42%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: '#4B8B7C',
        },
      },
    ],
  };

  // 6. Heatmap Option: Zone-by-Date Matrix
  const uniqueDates = Array.from(new Set(heatmap.map((h) => h.date))).sort();
  const uniqueZones = Array.from(new Set(heatmap.map((h) => h.zoneCode)));

  const heatmapMatrixData = heatmap.map((cell) => {
    const xIdx = uniqueDates.indexOf(cell.date);
    const yIdx = uniqueZones.indexOf(cell.zoneCode);
    return [xIdx, yIdx, cell.avgExposurePpmHr];
  });

  const heatmapOption = {
    tooltip: {
      position: 'top',
      backgroundColor: '#26384CFFF',
      borderColor: '#E8793A',
      textStyle: { color: '#21354B' },
      formatter: (params: any) => {
        const val = params.value;
        const d = uniqueDates[val[0]];
        const z = uniqueZones[val[1]];
        return `<div style="font-weight:600;color:#E8793A;">Zone: ${z}</div>
          <div style="font-size:11px;">Date: ${d}</div>
          <div style="font-size:11px;margin-top:2px;">Mean Dose: <strong>${val[2]} ppm·hr</strong></div>`;
      },
    },
    grid: { left: '4%', right: '3%', bottom: '15%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: uniqueDates.map((d) => d.slice(5)),
      splitArea: { show: true },
      axisLabel: { color: '#748194', fontSize: 10, rotate: 45 },
    },
    yAxis: {
      type: 'category',
      data: uniqueZones,
      splitArea: { show: true },
      axisLabel: { color: '#748194', fontSize: 11 },
    },
    visualMap: {
      min: 0,
      max: 22,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      textStyle: { color: '#748194', fontSize: 10 },
      inRange: {
        color: ['#0B132B', '#00B4D8', '#F59E0B', '#EF4444'],
      },
    },
    series: [
      {
        name: 'Exposure Intensity',
        type: 'heatmap',
        data: heatmapMatrixData,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return (
    <div className="dashboard-page space-y-7">
      {/* Page Title & Controls */}
      <div className="dashboard-hero relative overflow-hidden rounded-[2rem] min-h-[270px] flex flex-col md:flex-row items-center justify-between gap-3 px-6 md:px-9 py-6 md:py-7">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide dashboard-eyebrow"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />LIVE SAFETY OVERVIEW</div>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight dashboard-title">{isWorker ? 'Your shift, at a glance.' : 'See the whole operation.'}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 dashboard-copy">
            {isWorker
              ? `Personal exposure history and safety status for ${currentUser?.fullName || 'your worker profile'} (${workerId}).`
              : 'Aggregated exposure dosage, zone variations, risk categories, and threshold evaluations. All values are deterministic academic simulations.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {currentUser?.role === 'ROLE_ADMIN' && <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            iconLeft={<Download className="w-3.5 h-3.5" />}
          >
            Export Filtered CSV
          </Button>}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData(filters)}
            loading={loading}
            iconLeft={<RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Refresh overview
          </Button>
          {currentUser?.role === 'ROLE_ADMIN' && <span className="dashboard-sample-note">Educational simulation · synthetic data</span>}
          </div>
        </div>
        <div className="dashboard-beacon-wrap relative w-full md:w-[300px] h-[220px] md:h-[260px] shrink-0"><div className="absolute inset-5 rounded-full bg-orange-300/35 blur-3xl" /><SafetyBeacon3D /><div className="absolute right-0 bottom-2 px-3 py-1.5 rounded-full dashboard-beacon-label">3D SAFETY BEACON</div></div>
      </div>

      {/* Global Filter Bar (Dates, Zone, Shift, Worker, Status) */}
      {isWorker ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-100">
          <strong className="text-emerald-300">PERSONAL VIEW · {workerId}</strong>
          <span className="ml-2 text-slate-300">Showing only your exposure records. You can filter by date, zone, shift, and status.</span>
          <div className="mt-3"><FilterBar filters={filters} onChange={(next) => setFilters({ ...next, workerId })} lockedWorkerId={workerId} /></div>
        </div>
      ) : <FilterBar filters={filters} onChange={setFilters} />}

      {/* Global Visible Error State if API Fails */}
      {error && (
        <ErrorState
          title="Telemetry API Communication Failed"
          message="Could not retrieve real-time exposure records from the Spring Boot backend service."
          error={error}
          onRetry={() => loadData(filters)}
        />
      )}

      {/* KPI METRIC CARDS (ROW 1: CORE TELEMETRY METRICS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span>{isWorker ? 'MY EXPOSURE TELEMETRY' : 'CORE EXPOSURE TELEMETRY'}</span>
          <span>DISCRETE SIMULATED DOSE</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <MetricCard
            title={isWorker ? 'My Worker Profile' : 'Sample Personnel'}
            value={summary ? summary.totalWorkers : (isWorker ? 1 : 40)}
            unit={isWorker ? 'Profile' : 'Staff'}
            subtitle={isWorker ? workerId : 'Distinct Workers Filtered'}
            icon={<Users className="w-5 h-5" />}
            iconColor="cyan"
            loading={loading}
          />

          <MetricCard
            title="Exposure Records"
            value={summary ? summary.totalRecords : 718}
            unit="Events"
            subtitle="Ingested Shift Telemetry"
            icon={<Database className="w-5 h-5" />}
            iconColor="teal"
            loading={loading}
          />

          <MetricCard
            title="Mean Exposure Dose"
            value={summary ? summary.avgExposurePpmHr.toFixed(2) : '7.11'}
            unit="ppm·hr"
            subtitle="Temporal Integration"
            icon={<Activity className="w-5 h-5" />}
            iconColor="cyan"
            loading={loading}
          />

          <MetricCard
            title="Peak Exposure Dose"
            value={summary ? summary.maxExposurePpmHr.toFixed(1) : '25.9'}
            unit="ppm·hr"
            subtitle="Highest Observed Spike"
            icon={<Gauge className="w-5 h-5" />}
            iconColor="rose"
            loading={loading}
          />
        </div>
      </div>

      {/* 6 ANALYTICAL CHARTS (ALL CONNECTED TO API RESPONSES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Time-series Line Chart */}
        <ChartContainer
          title={isWorker ? 'My Exposure Over Time' : 'Time-Series Exposure Trend'}
          subtitle={isWorker ? 'Your daily mean and peak exposure dose' : 'Daily aggregated mean and peak exposure over time'}
          infoTooltip="Computed via calculationService.groupByDate() with summarizingDouble on active filter criteria"
          loading={loading}
          error={error}
          isEmpty={trends.length === 0}
          emptyMessage="No trend records match the active filter criteria."
          onRefresh={() => loadData(filters)}
          onExportCsv={handleExportCsv}
          heightClass="h-72"
        >
          <EChartWrapper options={trendChartOption} height="100%" loading={loading} />
        </ChartContainer>

        {/* Chart 2: Zone-Comparison Bar Chart */}
        {!isWorker && <ChartContainer
          title="Zone Exposure vs Baseline"
          subtitle="Comparison of observed average exposure against target baseline across zones"
          infoTooltip="Compares Acid Gas Recovery, Catalyst Cracking, Sulfur Farm, Desulfurization, Flare Pit"
          loading={loading}
          error={error}
          isEmpty={zoneComparison.length === 0}
          emptyMessage="No zone records match the active filter criteria."
          onRefresh={() => loadData(filters)}
          onExportCsv={handleExportCsv}
          heightClass="h-72"
        >
          <EChartWrapper options={zoneChartOption} height="100%" loading={loading} />
        </ChartContainer>}

        {/* Chart 3: Status-Distribution Donut Chart */}
        <ChartContainer
          title={isWorker ? 'My Safety Status Breakdown' : 'Status Distribution Breakdown'}
          subtitle={isWorker ? 'Your records grouped by exposure status' : 'Proportion of events in Normal, Elevated, Warning, and Critical tiers'}
          infoTooltip="Evaluated against demonstration thresholds: Normal (<8), Elevated (8-14.9), Warning (15-19.9), Critical (>=20)"
          loading={loading}
          error={error}
          isEmpty={statusDist.length === 0}
          emptyMessage="No status records available."
          onRefresh={() => loadData(filters)}
          onExportCsv={handleExportCsv}
          heightClass="h-72"
        >
          <EChartWrapper options={statusDonutOption} height="100%" loading={loading} />
        </ChartContainer>

        {/* Chart 4: Value Histogram */}
        <ChartContainer
          title={isWorker ? 'My Exposure Dose Distribution' : 'Exposure Value Frequency Histogram'}
          subtitle={isWorker ? 'Distribution of your recorded exposure doses' : 'Binned distribution of synthetic exposure records into 10 intervals'}
          infoTooltip="Dynamically calculated by analyticsService.calculateExposureHistogram() in Java Streams"
          loading={loading}
          error={error}
          isEmpty={histogram.length === 0}
          emptyMessage="No histogram bins computed."
          onRefresh={() => loadData(filters)}
          onExportCsv={handleExportCsv}
          heightClass="h-72"
        >
          <EChartWrapper options={histogramOption} height="100%" loading={loading} />
        </ChartContainer>

        {/* Chart 5: Worker Comparison Chart */}
        {!isWorker && <ChartContainer
          title="Highest Mean Exposure Personnel"
          subtitle="Top 8 workers ranked by cumulative average exposure dose"
          infoTooltip="Identifies workers experiencing elevated exposure due to high-risk zone assignments"
          loading={loading}
          error={error}
          isEmpty={workerComp.length === 0}
          emptyMessage="No worker comparison data available."
          onRefresh={() => loadData(filters)}
          onExportCsv={handleExportCsv}
          heightClass="h-72"
        >
          <EChartWrapper options={workerCompOption} height="100%" loading={loading} />
        </ChartContainer>}

        {/* Chart 6: Zone-by-Time Heatmap */}
        {!isWorker && <ChartContainer
          title="Zone vs Temporal Heatmap Matrix"
          subtitle="2D matrix of daily exposure intensity across all 5 monitored facility zones"
          infoTooltip="2-dimensional cross-tabulation mapping date on X-axis, zone on Y-axis, and mean ppm·hr as intensity"
          loading={loading}
          error={error}
          isEmpty={heatmap.length === 0}
          emptyMessage="No heatmap cells available."
          onRefresh={() => loadData(filters)}
          onExportCsv={handleExportCsv}
          heightClass="h-72"
        >
          <EChartWrapper options={heatmapOption} height="100%" loading={loading} />
        </ChartContainer>}
      </div>
    </div>
  );
};



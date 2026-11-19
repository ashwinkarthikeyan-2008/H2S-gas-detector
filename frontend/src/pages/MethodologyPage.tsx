import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Database,
  Calculator,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  FileCode,
  Terminal,
  HelpCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { DemoResetResponse } from '../types';

export const MethodologyPage: React.FC = () => {
  const [resetting, setResetting] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [resetResult, setResetResult] = useState<DemoResetResponse | null>(null);

  const handleResetConfirm = async () => {
    setResetting(true);
    try {
      const res = await api.resetDemo();
      setResetResult(res);
      setConfirmModalOpen(false);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/30 text-xs font-mono text-cyan-400 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>PROJECT SPECIFICATION &amp; DEFENSE GUIDE</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Methodology &amp; Academic Concepts</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Detailed technical documentation connecting Java OOP &amp; Spring Boot architecture with academic Data Exploration &amp; Visualization (DEV) principles.
          </p>
        </div>

        <button
          onClick={() => setConfirmModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Simulation Database</span>
        </button>
      </div>

      {/* Reset Confirmation Feedback */}
      {resetResult && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-400/40 text-emerald-300 text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{resetResult.message}</span>
          </div>
          <p className="text-slate-300 text-[11px] font-mono">
            Remaining: {resetResult.workersLoaded} worker profiles, {resetResult.recordsLoaded} records, and {resetResult.alertsLoaded} alerts. Zone and shift choices remain available for registration.
          </p>
        </div>
      )}

      {/* SECTION 1: MANDATORY SAFETY & COMPLIANCE DISCLAIMER */}
      <div className="glass-card-critical rounded-2xl p-6 border border-rose-500/40 space-y-3">
        <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>CRITICAL LIMITATIONS &amp; SAFETY DISCLAIMER</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          ChromaGuard is an educational, software-only prototype constructed exclusively for computer science demonstration and academic data exploration. <strong>Under no circumstances should this software be utilized for real-world life-safety monitoring, worker gas clearance, or industrial OSHA compliance.</strong>
        </p>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>All gas exposure readings (expressed in simulated $ppm \cdot hr$) are deterministic synthetic figures.</li>
          <li>Simulated RGB color channels mimic photographic badge scans but are not chemically calibrated.</li>
          <li>Warning (15.0 ppm·hr) and Critical (20.0 ppm·hr) triggers represent project demonstration thresholds, not certified regulatory PEL/STEL limits.</li>
        </ul>
      </div>

      {/* SECTION 2: MATHEMATICAL FORMULATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cumulative Dose Math */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
            <Calculator className="w-4 h-4" />
            <span>Cumulative Dose Integration Formula</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Illustrative shift cumulative dose $D$ is evaluated over an 8-hour shift duration $\Delta t$ using discrete numerical integration:
          </p>
          <div className="p-3.5 rounded-xl bg-midnight-950 border border-cyan-500/20 text-center font-mono text-cyan-300 text-sm">
            D = &Sigma; ( C<sub>i</sub> &times; &Delta;t &times; &eta; )
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Where $C_i$ is the ambient concentration proxy in $ppm$, $\Delta t$ is 8 hours, and $\eta$ is an industrial duty cycle factor (0.85 &ndash; 1.15).
          </p>
        </div>

        {/* Tukey IQR Outlier Math */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 font-semibold text-sm">
            <Calculator className="w-4 h-4" />
            <span>Tukey's Fences Outlier Methodology</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Non-parametric outlier detection relies on the Interquartile Range ($IQR$) across the 718 sorted exposure observations:
          </p>
          <div className="p-3 rounded-xl bg-midnight-950 border border-teal-500/20 text-center font-mono text-teal-300 text-xs space-y-1">
            <div>IQR = Q<sub>3</sub> &minus; Q<sub>1</sub></div>
            <div>Lower Fence = Q<sub>1</sub> &minus; 1.5 &times; IQR</div>
            <div>Upper Fence = Q<sub>3</sub> + 1.5 &times; IQR</div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Records exceeding the upper fence correspond to simulated industrial fugitive emission spikes in the Desulfurization Trench and Acid Gas Recovery units.
          </p>
        </div>
      </div>

      {/* SECTION 3: JAVA CONCEPT MAPPING */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Java 21 Academic Concept Mapping</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">Object-Oriented Encapsulation</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Domain models (<code>Worker</code>, <code>ExposureRecord</code>, <code>Alert</code>) enforce private state, controlled accessors, and entity relationships.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-teal-400">Java Streams &amp; Collectors API</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Employed across <code>AnalyticsService</code> and <code>ExposureCalculationService</code> for grouping by zone/date, averaging, finding maxima, and calculating variance.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-amber-400">Enums with Rich Behavior</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <code>DemoStatus</code>, <code>RiskTier</code>, and <code>UserRole</code> encapsulate display names, threshold evaluations, and security role semantics.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">Clean Layered Architecture</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Strict separation between REST Controllers, Business Services, Spring Data Repositories, JPA Entities, and transfer DTOs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-teal-400">Spring Data JPA &amp; JPQL</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Declarative repositories with parameterized multi-filter queries (<code>findWithFilters</code>) for date ranges, shifts, and zones.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-amber-400">JUnit 5 Unit &amp; Integration Tests</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              11 comprehensive test cases validating statistics, threshold evaluations, MockMvc HTTP endpoints, and dataset loading integrity.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: DATA EXPLORATION & VISUALIZATION (DEV) CONCEPT MAPPING */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Layers className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Data Exploration &amp; Visualization (DEV) Concept Mapping</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">Data Hygiene &amp; Verification</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Systematic missing-value audits, duplicate record checks, and schema type verification performed on the 718-record sample corpus.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-teal-400">Parametric &amp; Non-Parametric Stats</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Simultaneous evaluation of mean/standard deviation (parametric) alongside median/IQR/quartiles (non-parametric) to measure distributional skew.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-amber-400">
            <span className="font-semibold text-amber-400">Tukey IQR Outlier Fences</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Statistical isolation of transient industrial events using $Q_1 - 1.5 \cdot IQR$ and $Q_3 + 1.5 \cdot IQR$ without premature classification as true hazards.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">Bivariate Pearson Correlation</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Quantitative relationship measurement between gas concentration, shift cumulative dose, and simulated colorimetric RGB values.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-teal-400">Multi-Dimensional Visual Encoding</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Visual mapping utilizing time-series lines (trends), categorical bars (zones), radial proportion donuts (statuses), and 2D heatmaps (temporal matrices).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-amber-400">Contextual Interpretation Panels</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Dedicated analytical commentary contextualizing mathematical discoveries against industrial petrochemical operations.
            </p>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR DATABASE RESET */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-midnight-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Confirm Simulation Database Reset</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This clears registered worker accounts, worker profiles, exposure records, and alerts. Admin accounts and zone/shift choices used during registration remain.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetConfirm}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-glow-red transition flex items-center space-x-1.5"
              >
                {resetting ? <span>Clearing...</span> : <span>Clear worker data</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

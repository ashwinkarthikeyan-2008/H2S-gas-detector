import React, { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { downloadFile } from '../services/api';

export const DashboardExportActions: React.FC<{ csvUrl: string; scopeLabel: string }> = ({ csvUrl, scopeLabel }) => {
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const savePdf = () => {
    document.body.classList.add('dashboard-print-mode');
    const cleanup = () => document.body.classList.remove('dashboard-print-mode');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => { window.print(); window.setTimeout(cleanup, 1000); }, 100);
  };
  const saveCsv = async () => {
    setDownloading(true); setError('');
    try { await downloadFile(csvUrl); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not export the CSV file.'); }
    finally { setDownloading(false); }
  };
  return <div className="dashboard-export-controls">
    <div className="dashboard-export-panel">
      <div className="dashboard-export-intro"><span className="dashboard-export-icon"><Download className="h-4 w-4"/></span><span><strong>Download dashboard</strong><small>Charts are also available as individual PNG images.</small></span></div>
      <div className="dashboard-export-actions">
        <button type="button" onClick={savePdf} className="dashboard-export-button is-pdf"><Printer className="h-4 w-4"/><span>Full dashboard PDF</span></button>
        <button type="button" disabled={downloading} onClick={() => void saveCsv()} className="dashboard-export-button is-csv"><Download className="h-4 w-4"/><span>{downloading ? 'Preparing CSV…' : 'Readings CSV'}</span></button>
      </div>
    </div>
    <p className="dashboard-export-help">CSV exports {scopeLabel} exposure records.</p>
    {error && <p role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}
  </div>;
};

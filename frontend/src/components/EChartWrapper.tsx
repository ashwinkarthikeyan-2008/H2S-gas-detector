import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Download } from 'lucide-react';

interface EChartWrapperProps {
  options: any;
  height?: string;
  className?: string;
  loading?: boolean;
  downloadName?: string;
}

export const EChartWrapper: React.FC<EChartWrapperProps> = ({
  options,
  height = '320px',
  className = '',
  loading = false,
  downloadName,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark', {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;

    // Apply global industrial dark theme defaults
    const themedOptions: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      color: ['#00F0FF', '#00B4D8', '#14B8A6', '#F59E0B', '#EF4444', '#818CF8', '#38BDF8'],
      textStyle: {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      },
      tooltip: {
        backgroundColor: 'rgba(8, 13, 25, 0.94)',
        borderColor: 'rgba(0, 240, 255, 0.35)',
        borderWidth: 1,
        borderRadius: 12,
        padding: [10, 14],
        textStyle: {
          color: '#F1F5F9',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
        },
        extraCssText: 'box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px);',
        ...options?.tooltip,
      },
      grid: {
        containLabel: true,
        left: 12,
        right: 16,
        top: 36,
        bottom: 16,
        ...options?.grid,
      },
      ...options,
    };

    chart.setOption(themedOptions, true);

    if (loading) {
      chart.showLoading({
        text: 'Analyzing Telemetry...',
        color: '#00F0FF',
        textColor: '#94A3B8',
        maskColor: 'rgba(5, 8, 17, 0.8)',
        fontSize: 13,
        showSpinner: true,
        spinnerRadius: 10,
        lineWidth: 2,
      });
    } else {
      chart.hideLoading();
    }

    const handleResize = () => {
      chart.resize();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [options, loading]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  const downloadChart = () => {
    const chart = chartInstance.current;
    if (!chart || chart.isDisposed()) return;
    const image = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });
    const anchor = document.createElement('a');
    anchor.href = image;
    anchor.download = `${downloadName || 'chromaguard-chart'}.png`;
    anchor.click();
  };

  return (
    <div className={`chart-export-wrap ${className}`}>
      <div ref={chartRef} style={{ height }} className="w-full relative" />
      {downloadName && <div className="chart-export-footer"><span>PNG image · high resolution</span><button type="button" onClick={downloadChart} className="chart-export-button" title={`Download ${downloadName} chart as PNG`}><Download className="h-3.5 w-3.5"/><span>Download chart</span></button></div>}
    </div>
  );
};

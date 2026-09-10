import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Zap, Clock, Trophy, Gauge, Activity, AlertCircle } from 'lucide-react';
import { ProviderId, ProviderResultState } from '../types';

interface ExecutionSpeedSummaryProps {
  selectedProviders: ProviderId[];
  providerResults: Record<ProviderId, ProviderResultState>;
  isGenerating: boolean;
}

const PROVIDER_COLORS: Record<ProviderId, { base: string; light: string; name: string }> = {
  google: { base: '#38bdf8', light: '#7dd3fc', name: 'Google Imagen 3' },
  openai: { base: '#10b981', light: '#34d399', name: 'OpenAI DALL-E 3' },
  stability: { base: '#a855f7', light: '#c084fc', name: 'Stability AI' },
  replicate: { base: '#f59e0b', light: '#fbbf24', name: 'Replicate' },
  fal: { base: '#ec4899', light: '#f472b6', name: 'Fal.ai' },
};

export const ExecutionSpeedSummary: React.FC<ExecutionSpeedSummaryProps> = ({
  selectedProviders,
  providerResults,
  isGenerating,
}) => {
  // Collect data for selected providers
  const completedResults = selectedProviders
    .map((id) => providerResults[id])
    .filter(
      (r): r is ProviderResultState =>
        Boolean(r) &&
        (r.status === 'success' || r.status === 'simulated') &&
        typeof r.executionTimeMs === 'number' &&
        r.executionTimeMs > 0
    );

  const hasAnyData = completedResults.length > 0;

  // Find fastest provider
  const fastestResult = hasAnyData
    ? [...completedResults].sort(
        (a, b) => (a.executionTimeMs || 0) - (b.executionTimeMs || 0)
      )[0]
    : null;

  // Calculate average
  const totalMs = completedResults.reduce((acc, r) => acc + (r.executionTimeMs || 0), 0);
  const avgMs = hasAnyData ? totalMs / completedResults.length : 0;

  // Prepare chart items
  const chartData = selectedProviders.map((id) => {
    const res = providerResults[id];
    const ms = res?.executionTimeMs || 0;
    const seconds = ms > 0 ? Number((ms / 1000).toFixed(2)) : 0;
    const isCompleted = res && (res.status === 'success' || res.status === 'simulated');
    const isFastest = fastestResult && fastestResult.id === id;
    const config = PROVIDER_COLORS[id] || { base: '#94a3b8', light: '#cbd5e1', name: id };

    let deltaText = '';
    if (fastestResult && fastestResult.executionTimeMs && ms > 0 && !isFastest) {
      const deltaSec = ((ms - fastestResult.executionTimeMs) / 1000).toFixed(2);
      deltaText = `+${deltaSec}s`;
    }

    return {
      id,
      name: res?.name || config.name,
      shortName: id === 'google' ? 'Imagen 3' : id === 'openai' ? 'DALL-E 3' : id === 'stability' ? 'SD3.5' : id === 'replicate' ? 'CodeFormer' : 'Fal.ai',
      model: res?.model || '',
      ms,
      seconds,
      isFastest,
      isCompleted,
      status: res?.status || 'idle',
      error: res?.error,
      color: config.base,
      deltaText,
    };
  });

  // Custom tooltip for recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center space-x-2 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.isFastest ? '#fbbf24' : data.color }}
            />
            <span className="font-bold text-neutral-100">{data.name}</span>
            {data.isFastest && (
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-semibold text-[10px] border border-amber-400/30 flex items-center space-x-1">
                <Trophy className="w-2.5 h-2.5" />
                <span>Más Rápida</span>
              </span>
            )}
          </div>
          <div className="space-y-1 text-neutral-300">
            <p className="flex justify-between space-x-4">
              <span className="text-neutral-400">Tiempo de ejecución:</span>
              <span className="font-mono font-bold text-neutral-100">
                {data.seconds > 0 ? `${data.seconds} s (${data.ms.toLocaleString()} ms)` : 'Pendiente'}
              </span>
            </p>
            {data.deltaText && (
              <p className="flex justify-between space-x-4">
                <span className="text-neutral-400">Diferencia vs más rápida:</span>
                <span className="font-mono text-amber-400 font-medium">{data.deltaText}</span>
              </p>
            )}
            <p className="flex justify-between space-x-4">
              <span className="text-neutral-400">Modelo:</span>
              <span className="font-mono text-[11px] text-neutral-400">{data.model}</span>
            </p>
            <p className="flex justify-between space-x-4">
              <span className="text-neutral-400">Estado:</span>
              <span
                className={`font-semibold capitalize ${
                  data.status === 'success' || data.status === 'simulated'
                    ? 'text-emerald-400'
                    : data.status === 'loading'
                    ? 'text-amber-400'
                    : data.status === 'error'
                    ? 'text-rose-400'
                    : 'text-neutral-500'
                }`}
              >
                {data.status === 'success' || data.status === 'simulated'
                  ? 'Completado'
                  : data.status === 'loading'
                  ? 'Generando...'
                  : data.status === 'error'
                  ? 'Error'
                  : 'Pendiente'}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="execution-speed-summary"
      className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md backdrop-blur-sm space-y-3.5"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shadow-sm">
            <Gauge className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Velocidad y Tiempos de Ejecución
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                Benchmark
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Comparativa de latencia en milisegundos de cada API concurrente
            </p>
          </div>
        </div>

        {/* Winner Badge or Status */}
        {isGenerating ? (
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium animate-pulse">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            <span>Midiendo latencia en vivo...</span>
          </div>
        ) : fastestResult ? (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-bold shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>
              Más rápida: {fastestResult.name} ({(fastestResult.executionTimeMs! / 1000).toFixed(2)}s)
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500">
            <Clock className="w-3 h-3" />
            <span>Esperando ejecución</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      {hasAnyData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Tiempo Mínimo</span>
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-base font-extrabold font-mono text-amber-300">
                {(fastestResult!.executionTimeMs! / 1000).toFixed(2)}s
              </span>
              <span className="text-[10px] text-neutral-400 truncate">
                {fastestResult?.name.split(' ')[0]}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Tiempo Promedio</span>
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-base font-extrabold font-mono text-neutral-100">
                {(avgMs / 1000).toFixed(2)}s
              </span>
              <span className="text-[10px] text-neutral-400">
                ({completedResults.length} completadas)
              </span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 flex items-center space-x-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Despacho Concurrente</span>
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-base font-extrabold font-mono text-emerald-300">
                100% Paralelo
              </span>
              <span className="text-[10px] text-neutral-400">HTTP streaming</span>
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart Container */}
      {hasAnyData ? (
        <div className="w-full pt-1 pb-1">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 8, right: 40, left: 10, bottom: 8 }}
                barSize={20}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  stroke="#262626"
                  opacity={0.6}
                />
                <XAxis
                  type="number"
                  domain={[0, 'dataMax + 0.5']}
                  unit="s"
                  tick={{ fill: '#737373', fontSize: 11 }}
                  axisLine={{ stroke: '#404040' }}
                  tickLine={{ stroke: '#404040' }}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  tick={{ fill: '#d4d4d4', fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: '#404040' }}
                  tickLine={false}
                  width={85}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Bar
                  dataKey="seconds"
                  radius={[0, 6, 6, 0]}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.isFastest ? '#fbbf24' : entry.color}
                      stroke={entry.isFastest ? '#fef08a' : 'transparent'}
                      strokeWidth={entry.isFastest ? 1 : 0}
                      fillOpacity={entry.isCompleted ? 0.9 : 0.25}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart footer legend and delta badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-neutral-300 font-medium">Más rápida (1er lugar)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-600"></span>
                <span>Otras APIs</span>
              </span>
            </div>
            <div className="font-mono text-[10px] text-neutral-500">
              * Tiempos medidos desde despacho hasta recepción completa
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Idle State Placeholder */
        <div className="py-6 px-4 rounded-xl bg-neutral-950/40 border border-neutral-800/60 text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-9 h-9 rounded-xl bg-neutral-800/80 flex items-center justify-center text-neutral-500 mb-1">
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-neutral-300">
            Gráfico de Tiempos de Ejecución
          </p>
          <p className="text-[11px] text-neutral-400 max-w-md">
            Haz clic en <span className="text-amber-400 font-medium">"Generar y Restaurar Todo"</span> para lanzar las {selectedProviders.length} IAs simultáneamente. Aquí verás un gráfico comparativo de barras con la velocidad exacta de cada API.
          </p>
        </div>
      )}
    </div>
  );
};

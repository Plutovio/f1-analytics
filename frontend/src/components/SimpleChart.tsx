import React, { useState, useMemo } from 'react';
import { Minus, Plus, Grid } from 'lucide-react';

interface ChartLine {
  key: string;
  label: string;
  color: string;
}

interface SimpleChartProps {
  data: any[];
  lines: ChartLine[];
  type?: 'line' | 'line-inverse' | 'bar' | 'gap';
  height?: number;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  lines,
  type = 'line',
  height = 300,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pinnedIdx, setPinnedIdx] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [lineVisibility, setLineVisibility] = useState<Record<string, boolean>>(() =>
    lines.reduce((acc, line) => ({ ...acc, [line.key]: true }), {})
  );

  const toggleLine = (key: string) => {
    setLineVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Find the last valid index where there's data for any visible line
  const activeData = useMemo(() => {
    let lastValidIndex = -1;
    data.forEach((d, i) => {
      const hasData = lines.some((l) => {
        const val = d[l.key];
        return val !== null && val !== undefined && val !== '';
      });
      if (hasData) lastValidIndex = i;
    });
    return lastValidIndex >= 0 ? data.slice(0, lastValidIndex + 1) : [];
  }, [data, lines]);

  // Extract all visible values
  const allValues = useMemo(() => {
    return activeData.flatMap((d) =>
      lines
        .filter((l) => lineVisibility[l.key])
        .map((l) => {
          const val = d[l.key];
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
          }
          return null;
        })
        .filter((v): v is number => v !== null)
    );
  }, [activeData, lines, lineVisibility]);

  if (!activeData || activeData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500">
        No Data Yet
      </div>
    );
  }

  const padding = { top: 30, right: 30, bottom: 80, left: 50 };
  const baseWidth = 800;
  const width = baseWidth * zoom;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const dataMax = allValues.length > 0 ? Math.max(...allValues, 0) : 10;

  let yMin = 0;
  let yMax = 10;

  if (type === 'line-inverse') {
    yMin = 1;
    yMax = Math.min(22, Math.max(5, dataMax + 1));
  } else {
    yMax = Math.max(10, dataMax * 1.05);
  }

  const getX = (i: number) =>
    padding.left + i * (chartW / Math.max(1, activeData.length - 1));

  const getY = (val: any) => {
    if (val === null || val === undefined || val === '' || val === 'DNF' || val === 'R' || val === 'D' || val === 'W') {
      return null;
    }
    const numVal = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(numVal)) return null;

    if (type === 'line-inverse') {
      // P1 is at top (padding.top), P22 is at bottom (height - padding.bottom)
      return padding.top + ((numVal - yMin) / (yMax - yMin)) * chartH;
    }
    return height - padding.bottom - (numVal / yMax) * chartH;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (pinnedIdx !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const viewBoxX = ratio * width;

    const step = chartW / Math.max(1, activeData.length - 1);
    let idx = Math.round((viewBoxX - padding.left) / step);
    idx = Math.max(0, Math.min(activeData.length - 1, idx));
    setHoverIdx(idx);
  };

  const handleClick = () => {
    if (hoverIdx !== null) {
      setPinnedIdx(pinnedIdx === hoverIdx ? null : hoverIdx);
    }
  };

  const handleMouseLeave = () => {
    if (pinnedIdx === null) setHoverIdx(null);
  };

  const displayIdx = pinnedIdx !== null ? pinnedIdx : hoverIdx;
  const visibleLines = lines.filter((l) => lineVisibility[l.key]);

  return (
    <div className="w-full flex flex-col relative group select-none">
      {/* Controls */}
      <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1 p-1 rounded-lg backdrop-blur-md bg-slate-800/80 border border-slate-700 shadow-sm text-slate-200">
          <button
            onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            title="Zoom Out"
          >
            <Minus size={14} />
          </button>
          <span className="px-1 text-xs font-mono font-bold">{zoom}x</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.5))}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            title="Zoom In"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="p-1.5 rounded-lg backdrop-blur-md bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition-colors text-slate-200"
          title={showGrid ? 'Hide Grid' : 'Show Grid'}
        >
          <Grid size={14} />
        </button>
      </div>

      {/* Legends */}
      <div className="flex flex-wrap gap-2 mb-4">
        {lines.map((line) => (
          <button
            key={line.key}
            onClick={() => toggleLine(line.key)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all backdrop-blur-md border ${
              lineVisibility[line.key]
                ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                : 'bg-slate-900/20 border-slate-800 text-slate-500 opacity-40'
            }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: line.color }}
            ></div>
            <span>{line.label}</span>
          </button>
        ))}
      </div>

      {/* SVG Container */}
      <div className="w-full overflow-x-auto scrollbar-hide bg-slate-950/40 border border-white/5 rounded-xl p-2">
        <svg
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="cursor-crosshair"
        >
          {/* Grid lines */}
          {showGrid && (
            <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
              {/* Vertical grids */}
              {activeData.map((_, i) => (
                <line
                  key={`v-grid-${i}`}
                  x1={getX(i)}
                  y1={padding.top}
                  x2={getX(i)}
                  y2={height - padding.bottom}
                />
              ))}
              {/* Horizontal grids */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                const yVal = type === 'line-inverse'
                  ? yMin + p * (yMax - yMin)
                  : p * yMax;
                const y = getY(yVal);
                if (y === null) return null;
                return (
                  <line
                    key={`h-grid-${i}`}
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                  />
                );
              })}
            </g>
          )}

          {/* X Axis Labels */}
          <g fill="rgba(255, 255, 255, 0.4)" fontSize="10" className="font-mono">
            {activeData.map((d, i) => {
              const x = getX(i);
              const label = d.round ? `R${d.round}` : d.label || '';
              return (
                <text
                  key={`x-label-${i}`}
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  transform={`rotate(-45, ${x}, ${height - padding.bottom + 20})`}
                >
                  {label}
                </text>
              );
            })}
          </g>

          {/* Y Axis Labels */}
          <g fill="rgba(255, 255, 255, 0.4)" fontSize="10" className="font-mono" textAnchor="end">
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
              const yVal = type === 'line-inverse'
                ? yMin + p * (yMax - yMin)
                : p * yMax;
              const y = getY(yVal);
              if (y === null) return null;
              return (
                <text key={`y-label-${i}`} x={padding.left - 10} y={y + 3}>
                  {type === 'line-inverse' ? `P${Math.round(yVal)}` : Math.round(yVal)}
                </text>
              );
            })}
          </g>

          {/* Paths and lines */}
          {type !== 'bar' ? (
            visibleLines.map((line) => {
              const points = activeData
                .map((d, i) => {
                  const val = d[line.key];
                  const y = getY(val);
                  return y !== null ? `${getX(i)},${y}` : null;
                })
                .filter((p): p is string => p !== null);

              if (points.length < 2) return null;

              const pathD = `M ${points.join(' L ')}`;
              return (
                <g key={`group-${line.key}`}>
                  {/* Outer Glow */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="chart-path opacity-20 filter blur-sm"
                  />
                  {/* Main Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="chart-path"
                  />
                  {/* Points circles */}
                  {activeData.map((d, i) => {
                    const val = d[line.key];
                    const y = getY(val);
                    if (y === null) return null;
                    return (
                      <circle
                        key={`circle-${line.key}-${i}`}
                        cx={getX(i)}
                        cy={y}
                        r="3.5"
                        fill="#0f172a"
                        stroke={line.color}
                        strokeWidth="1.5"
                        className="hover:scale-125 transition-transform"
                      />
                    );
                  })}
                </g>
              );
            })
          ) : (
            // Bar Chart type
            visibleLines.map((line, lIdx) => {
              const barW = Math.max(
                4,
                chartW / activeData.length / visibleLines.length - 2
              );
              return activeData.map((d, i) => {
                const val = d[line.key];
                const y = getY(val);
                if (y === null) return null;

                const baseBarX = getX(i) - (chartW / activeData.length) / 2.5;
                const barX = baseBarX + lIdx * barW;
                const barH = height - padding.bottom - y;

                return (
                  <rect
                    key={`bar-${line.key}-${i}`}
                    x={barX}
                    y={y}
                    width={barW}
                    height={barH}
                    fill={line.color}
                    className="chart-bar"
                    rx="2"
                  />
                );
              });
            })
          )}

          {/* Hover highlight line */}
          {displayIdx !== null && activeData[displayIdx] && (
            <g>
              <line
                x1={getX(displayIdx)}
                y1={padding.top}
                x2={getX(displayIdx)}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeDasharray="4,4"
              />
              {visibleLines.map((line) => {
                const val = activeData[displayIdx][line.key];
                const y = getY(val);
                if (y === null) return null;
                return (
                  <circle
                    key={`hover-highlight-${line.key}`}
                    cx={getX(displayIdx)}
                    cy={y}
                    r="6"
                    fill={line.color}
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    className="shadow-lg animate-ping"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Tooltip detail card */}
      {displayIdx !== null && activeData[displayIdx] && (
        <div className="mt-4 p-3 rounded-lg border border-white/10 bg-slate-900/90 backdrop-blur-md shadow-xl text-xs space-y-2">
          <div className="flex justify-between items-center font-bold text-slate-300">
            <span>
              {activeData[displayIdx].race_name
                ? `${activeData[displayIdx].flag || ''} ${activeData[displayIdx].race_name}`
                : `Round ${activeData[displayIdx].round}`}
            </span>
            {pinnedIdx !== null && (
              <button
                onClick={() => setPinnedIdx(null)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 uppercase tracking-widest font-mono"
              >
                [ Unpin ]
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {visibleLines.map((line) => {
              const val = activeData[displayIdx][line.key];
              const displayVal =
                val === null || val === undefined || val === ''
                  ? 'N/A'
                  : type === 'line-inverse'
                  ? `P${val}`
                  : `${val}`;
              return (
                <div
                  key={`tooltip-detail-${line.key}`}
                  className="p-2 rounded bg-slate-800/40 border border-white/5"
                >
                  <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: line.color }}
                    ></span>
                    {line.label}
                  </div>
                  <div className="font-mono font-bold text-slate-200 mt-1">
                    {displayVal}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

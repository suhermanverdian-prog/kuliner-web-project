import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { cn } from '../../lib/utils';
import { formatRupiah } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label, formatter, valuePrefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 p-3 rounded-lg shadow-xl animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-sm font-mono tabular-nums font-bold">
              {valuePrefix}{formatter ? formatter(entry.value) : entry.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ChartWrapper({
  data,
  type = 'bar',
  dataKey = 'value',
  labelKey = 'label',
  height = 300,
  className,
  valueFormatter,
  valuePrefix,
  color = '#f59e0b' // amber-500
}) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("w-full flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg", className)} style={{ height: `${height}px` }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No Data Available</p>
      </div>
    );
  }

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-full bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg animate-pulse", className)} style={{ height: `${height}px` }} />
    );
  }

  return (
    <div className={cn("w-full font-mono tabular-nums", className)} style={{ height: `${height}px`, minHeight: `${height}px`, overflow: 'hidden' }}>
      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
            <XAxis 
              dataKey={labelKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'currentColor' }} 
              className="text-zinc-500 dark:text-zinc-400 font-sans font-black uppercase tracking-widest"
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-zinc-500 dark:text-zinc-400"
              tickFormatter={(val) => {
                 if(val >= 1000000) return (val/1000000).toFixed(1) + 'M';
                 if(val >= 1000) return (val/1000).toFixed(1) + 'k';
                 return val;
              }}
            />
            <Tooltip 
              content={<CustomTooltip formatter={valueFormatter} valuePrefix={valuePrefix} />} 
              cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} 
            />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} barSize={32}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={color} 
                  className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
            <XAxis 
              dataKey={labelKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'currentColor' }} 
              className="text-zinc-500 dark:text-zinc-400 font-sans font-black uppercase tracking-widest"
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-zinc-500 dark:text-zinc-400"
              tickFormatter={(val) => {
                 if(val >= 1000000) return (val/1000000).toFixed(1) + 'M';
                 if(val >= 1000) return (val/1000).toFixed(1) + 'k';
                 return val;
              }}
            />
            <Tooltip 
              content={<CustomTooltip formatter={valueFormatter} valuePrefix={valuePrefix} />} 
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={3} 
              dot={{ r: 4, fill: color, strokeWidth: 0 }} 
              activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

type MetricBarProps = {
  label: string;
  valuePct: number;
  colorClass: string;
};

export function MetricBar({ label, valuePct, colorClass }: MetricBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{valuePct.toFixed(1)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-800">
        <div
          className={`h-3 rounded-full transition-all duration-200 ${colorClass}`}
          style={{ width: `${Math.max(0, Math.min(100, valuePct))}%` }}
        />
      </div>
    </div>
  );
}

import type { ActivityTableRow } from "@/types/report";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function ActivityTable({ data }: { data: ActivityTableRow[] }) {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-card-lg">
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-bold">Activity Progress</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Progress is calculated from weekly values up to selected cutoff date.
        </p>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-2 text-muted-foreground">
            <tr>
              <th className="px-5 py-4">WBS</th>
              <th className="px-5 py-4">Activity</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4 text-right">Amount</th>
              <th className="px-5 py-4">Progress</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => {
              const isPlan = row.type === "P";
              const progress = Math.min(row.progress, 100);

              return (
                <tr
                  key={`${row.wbs}-${row.type}-${index}`}
                  className="border-t border-border"
                >
                  <td className="px-5 py-4 font-medium">{row.wbs}</td>

                  <td className="max-w-[420px] px-5 py-4">
                    <div className="line-clamp-2">{row.activity}</div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isPlan
                          ? "bg-blue-500/15 text-accent"
                          : "bg-emerald-500/15 text-success"
                      }`}
                    >
                      {isPlan ? "Plan" : "Actual"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatMoney(row.amount)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex min-w-[180px] items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className={`h-full rounded-full ${
                            isPlan ? "bg-blue-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <span
                        className={`w-16 text-right font-semibold tabular-nums ${
                          isPlan ? "text-accent" : "text-success"
                        }`}
                      >
                        {row.progress.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

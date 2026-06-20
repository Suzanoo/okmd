import type { ChartRow } from "@/types/report";

export function ProgressTable({ data }: { data: ChartRow[] }) {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-card-lg">
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-bold">Progress Data</h2>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-surface-2 text-muted-foreground">
          <tr>
            <th className="px-5 py-4">Period</th>
            <th className="px-5 py-4">Plan</th>
            <th className="px-5 py-4">Actual</th>
            <th className="px-5 py-4">Variance</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => {
            const actual = row.actual;
            const variance = actual === null ? null : actual - row.plan;

            return (
              <tr key={row.date} className="border-t border-border">
                <td className="px-5 py-4">{row.label}</td>
                <td className="px-5 py-4 font-semibold text-accent">
                  {row.plan.toFixed(2)}%
                </td>
                <td className="px-5 py-4 font-semibold text-success">
                  {actual === null ? "-" : `${actual.toFixed(2)}%`}
                </td>
                <td
                  className={`px-5 py-4 font-semibold ${
                    variance === null
                      ? "text-muted-foreground"
                      : variance >= 0
                        ? "text-success"
                        : "text-danger"
                  }`}
                >
                  {variance === null
                    ? "-"
                    : `${variance >= 0 ? "+" : ""}${variance.toFixed(2)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

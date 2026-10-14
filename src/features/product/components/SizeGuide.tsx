import type { SizeGuideProps } from "@/features/product/models";
import { SIZE_CHARTS } from "@/features/product/constants";

/** Garment size chart for the product's side of the store. */
export function SizeGuide({ gender }: SizeGuideProps) {
  const chart = SIZE_CHARTS[gender];
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface p-4 text-sm">
      <table className="w-full text-left tabular-nums">
        <thead className="text-muted">
          <tr>
            <th className="pb-2 font-medium">Size</th>
            <th className="pb-2 font-medium">{chart.upperLabel}</th>
            <th className="pb-2 font-medium">Waist (cm)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {chart.rows.map((r) => (
            <tr key={r.size}>
              <td className="py-2 font-medium">{r.size}</td>
              <td>{r.upper}</td>
              <td>{r.waist}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

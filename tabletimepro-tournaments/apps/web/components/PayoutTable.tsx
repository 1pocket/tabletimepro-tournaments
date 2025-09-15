'use client';
export function PayoutTable({ amounts }: { amounts: number[] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
      {amounts.map((amt, idx) => (
        <tr key={idx} className="border-b border-zinc-800">
          <td className="py-1">Place {idx+1}</td>
          <td className="py-1 text-right">${amt}</td>
        </tr>
      ))}
      </tbody>
    </table>
  );
}

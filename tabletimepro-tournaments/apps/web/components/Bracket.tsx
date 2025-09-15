'use client';
import { MatchPair } from '@ttpro/core';

export function Bracket({ pairs }: { pairs: MatchPair[] }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex justify-between items-center rounded bg-panel px-3 py-2">
          <span>{pair.p1 || 'BYE'}</span>
          <span className="text-muted">vs</span>
          <span>{pair.p2 || 'BYE'}</span>
        </div>
      ))}
    </div>
  );
}

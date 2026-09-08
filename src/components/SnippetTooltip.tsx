/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info } from 'lucide-react';

export interface TooltipData {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface SnippetTooltipProps {
  tooltip: TooltipData | null;
}

/**
 * マウスカーソル近傍に表示される補足説明のスマートツールチップ。
 */
export const SnippetTooltip: React.FC<SnippetTooltipProps> = ({ tooltip }) => {
  if (!tooltip) return null;

  return (
    <div
      style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
      className="fixed z-50 pointer-events-none transition-all duration-75 animate-fade-in"
    >
      <div className="bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 dark:border-slate-300/80 max-w-xs font-sans backdrop-blur-md">
        <div className="flex items-center space-x-1.5 font-bold text-[11px] mb-1 text-amber-400 dark:text-amber-600 border-b border-slate-700/60 dark:border-slate-300/60 pb-1">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>補足・説明</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-200 dark:text-slate-800 break-words">{tooltip.text}</p>
      </div>
    </div>
  );
};

export default SnippetTooltip;

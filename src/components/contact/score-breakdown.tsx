'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ScoreBreakdownData {
  basic_score?: number;
  qualification_score?: number;
  document_score?: number;
  engagement_score?: number;
  total?: number;
}

interface ScoreBreakdownProps {
  score: number;
  breakdown?: ScoreBreakdownData;
  reasons?: string[];
  showDetails?: boolean;
}

function getTemperature(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 70) return { label: 'Hot', color: '#DC2626', bgColor: '#FEE2E2' };
  if (score >= 40) return { label: 'Warm', color: '#F59E0B', bgColor: '#FEF3C7' };
  return { label: 'Cold', color: '#3B82F6', bgColor: '#DBEAFE' };
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#DC2626';  // red for hot
  if (score >= 40) return '#F59E0B';  // amber for warm
  return '#3B82F6';  // blue for cold
}

export function ScoreBreakdown({ score, breakdown, reasons, showDetails = true }: ScoreBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const temp = getTemperature(score);
  const scoreColor = getScoreColor(score);

  // If no breakdown data, just show score
  const hasBreakdown = breakdown && (
    breakdown.basic_score !== undefined ||
    breakdown.qualification_score !== undefined ||
    breakdown.document_score !== undefined
  );

  return (
    <div className="space-y-2">
      {/* Main score display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            ARI Score
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            style={{ backgroundColor: temp.bgColor, color: temp.color }}
            className="text-xs font-medium"
          >
            {temp.label}
          </Badge>
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: scoreColor }}
          >
            {score}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(score, 100)}%`,
            backgroundColor: scoreColor,
          }}
        />
      </div>

      {/* Expandable details */}
      {showDetails && (hasBreakdown || (reasons && reasons.length > 0)) && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Sembunyikan detail
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Lihat detail skor
            </>
          )}
        </button>
      )}

      {/* Expanded breakdown */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t">
          {/* Score breakdown bars */}
          {hasBreakdown && (
            <div className="space-y-2">
              <BreakdownBar
                label="Data Dasar"
                value={breakdown.basic_score || 0}
                max={25}
                color="#10B981"
              />
              <BreakdownBar
                label="Kualifikasi"
                value={breakdown.qualification_score || 0}
                max={35}
                color="#3B82F6"
              />
              <BreakdownBar
                label="Dokumen"
                value={breakdown.document_score || 0}
                max={30}
                color="#8B5CF6"
              />
              <BreakdownBar
                label="Engagement"
                value={breakdown.engagement_score || 0}
                max={10}
                color="#F59E0B"
              />
            </div>
          )}

          {/* Reasons list */}
          {reasons && reasons.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Alasan:</p>
              <ul className="text-xs space-y-0.5">
                {reasons.map((reason, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

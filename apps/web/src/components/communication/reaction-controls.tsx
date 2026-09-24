import { Handshake, PartyPopper, ThumbsUp } from "lucide-react";
import type { ReactionKind, ReactionSummary } from "@/lib/types";

const reactions = [
  { kind: "ACKNOWLEDGE", label: "Acknowledge", icon: ThumbsUp },
  { kind: "SUPPORT", label: "Support", icon: Handshake },
  { kind: "CELEBRATE", label: "Celebrate", icon: PartyPopper },
] as const;

export function ReactionControls({
  summary,
  disabled,
  onChange,
}: {
  summary: ReactionSummary;
  disabled?: boolean;
  onChange: (kind: ReactionKind | null) => void;
}) {
  return (
    <div className="reaction-controls" aria-label="Reactions">
      {reactions.map(({ kind, label, icon: Icon }) => (
        <button
          key={kind}
          type="button"
          className={summary.viewerReaction === kind ? "active" : ""}
          aria-pressed={summary.viewerReaction === kind}
          disabled={disabled}
          onClick={() =>
            onChange(summary.viewerReaction === kind ? null : kind)
          }
        >
          <Icon />
          <span className="sr-only">{label}</span>
          {summary.reactionCounts[kind]}
        </button>
      ))}
    </div>
  );
}

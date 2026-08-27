import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReactionControls } from "./reaction-controls";

const summary = {
  viewerReaction: "ACKNOWLEDGE" as const,
  reactionCounts: { ACKNOWLEDGE: 2, SUPPORT: 1, CELEBRATE: 0 },
};

describe("ReactionControls", () => {
  it("exposes the selected reaction and toggles it off", async () => {
    const onChange = vi.fn();
    render(<ReactionControls summary={summary} onChange={onChange} />);

    const acknowledge = screen.getByRole("button", { name: /acknowledge/i });
    expect(acknowledge).toHaveAttribute("aria-pressed", "true");
    expect(acknowledge).toHaveTextContent("2");

    await userEvent.click(acknowledge);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("selects a different reaction and respects the disabled state", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ReactionControls summary={summary} onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /support/i }));
    expect(onChange).toHaveBeenCalledWith("SUPPORT");

    rerender(
      <ReactionControls summary={summary} onChange={onChange} disabled />,
    );
    expect(screen.getByRole("button", { name: /celebrate/i })).toBeDisabled();
  });
});

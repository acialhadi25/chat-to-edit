import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FreezePanesControl } from "../FreezePanesControl";

describe("FreezePanesControl", () => {
  it("should render freeze panes button", () => {
    const onFreeze = vi.fn();
    render(<FreezePanesControl frozenRows={0} frozenColumns={0} onFreeze={onFreeze} />);

    expect(screen.getByRole("button", { name: /freeze panes/i })).toBeInTheDocument();
  });

  it("should show frozen state when panes are frozen", () => {
    const onFreeze = vi.fn();
    render(<FreezePanesControl frozenRows={2} frozenColumns={1} onFreeze={onFreeze} />);

    expect(screen.getByRole("button", { name: /frozen: 2r, 1c/i })).toBeInTheDocument();
  });

  it("should render with different frozen row values", () => {
    const onFreeze = vi.fn();
    const { rerender } = render(<FreezePanesControl frozenRows={0} frozenColumns={0} onFreeze={onFreeze} />);

    expect(screen.getByRole("button", { name: /freeze panes/i })).toBeInTheDocument();

    rerender(<FreezePanesControl frozenRows={1} frozenColumns={0} onFreeze={onFreeze} />);
    expect(screen.getByRole("button", { name: /frozen: 1r, 0c/i })).toBeInTheDocument();

    rerender(<FreezePanesControl frozenRows={3} frozenColumns={0} onFreeze={onFreeze} />);
    expect(screen.getByRole("button", { name: /frozen: 3r, 0c/i })).toBeInTheDocument();
  });

  it("should render with different frozen column values", () => {
    const onFreeze = vi.fn();
    const { rerender } = render(<FreezePanesControl frozenRows={0} frozenColumns={0} onFreeze={onFreeze} />);

    expect(screen.getByRole("button", { name: /freeze panes/i })).toBeInTheDocument();

    rerender(<FreezePanesControl frozenRows={0} frozenColumns={1} onFreeze={onFreeze} />);
    expect(screen.getByRole("button", { name: /frozen: 0r, 1c/i })).toBeInTheDocument();

    rerender(<FreezePanesControl frozenRows={0} frozenColumns={2} onFreeze={onFreeze} />);
    expect(screen.getByRole("button", { name: /frozen: 0r, 2c/i })).toBeInTheDocument();
  });

  it("should render with both frozen rows and columns", () => {
    const onFreeze = vi.fn();
    render(<FreezePanesControl frozenRows={2} frozenColumns={3} onFreeze={onFreeze} />);

    expect(screen.getByRole("button", { name: /frozen: 2r, 3c/i })).toBeInTheDocument();
  });

  it("should use default variant when no panes are frozen", () => {
    const onFreeze = vi.fn();
    const { container } = render(<FreezePanesControl frozenRows={0} frozenColumns={0} onFreeze={onFreeze} />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('border'); // outline variant has border class
  });

  it("should use primary variant when panes are frozen", () => {
    const onFreeze = vi.fn();
    const { container } = render(<FreezePanesControl frozenRows={1} frozenColumns={1} onFreeze={onFreeze} />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-primary'); // default variant has bg-primary class
  });

  it("should accept maxRows and maxColumns props", () => {
    const onFreeze = vi.fn();
    render(<FreezePanesControl frozenRows={0} frozenColumns={0} onFreeze={onFreeze} maxRows={20} maxColumns={10} />);

    // Component should render without errors
    expect(screen.getByRole("button", { name: /freeze panes/i })).toBeInTheDocument();
  });
});

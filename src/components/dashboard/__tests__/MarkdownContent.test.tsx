import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MarkdownContent from "../MarkdownContent";

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("MarkdownContent", () => {
  const mockWriteText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockClear();
  });

  describe("Syntax Highlighting", () => {
    it("should render code blocks with syntax highlighting", () => {
      const content = "```javascript\nconst x = 10;\n```";
      const { container } = render(<MarkdownContent content={content} />);
      
      // Check that code is rendered with syntax highlighting
      const codeElement = container.querySelector('code.language-javascript');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toContain("const");
      expect(codeElement?.textContent).toContain("10");
    });

    it("should support multiple programming languages", () => {
      const content = "```python\ndef hello():\n    print('Hello')\n```";
      const { container } = render(<MarkdownContent content={content} />);
      
      const codeElement = container.querySelector('code.language-python');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toContain("def");
      expect(codeElement?.textContent).toContain("hello");
    });

    it("should render inline code without syntax highlighting", () => {
      const content = "Use `const x = 10` in your code";
      render(<MarkdownContent content={content} />);
      
      const codeElement = screen.getByText("const x = 10");
      expect(codeElement.tagName).toBe("CODE");
    });
  });

  describe("Copy Button", () => {
    it("should show copy button on hover for code blocks", async () => {
      const content = "```javascript\nconst x = 10;\n```";
      const { container } = render(<MarkdownContent content={content} />);
      
      // Find the copy button (it has opacity-0 initially)
      const copyButton = container.querySelector('button[class*="opacity-0"]');
      expect(copyButton).toBeInTheDocument();
    });

    it("should copy code to clipboard when copy button is clicked", async () => {
      const user = userEvent.setup();
      const content = "```javascript\nconst x = 10;\n```";
      const { container } = render(<MarkdownContent content={content} />);
      
      const copyButton = container.querySelector('button[class*="opacity-0"]') as HTMLElement;
      await user.click(copyButton);
      
      // Verify the check icon appears (indicating copy was successful)
      await waitFor(() => {
        const checkIcon = container.querySelector('svg.text-green-500');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("should show check icon after successful copy", async () => {
      const user = userEvent.setup();
      const content = "```javascript\nconst x = 10;\n```";
      const { container } = render(<MarkdownContent content={content} />);
      
      const copyButton = container.querySelector('button[class*="opacity-0"]') as HTMLElement;
      await user.click(copyButton);
      
      // Check icon should appear
      await waitFor(() => {
        const checkIcon = container.querySelector('svg.text-green-500');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("should not show copy button for inline code", () => {
      const content = "Use `const x = 10` in your code";
      const { container } = render(<MarkdownContent content={content} />);
      
      const copyButton = container.querySelector('button');
      expect(copyButton).not.toBeInTheDocument();
    });
  });

  describe("Collapsible Sections", () => {
    it("should not show collapse button for short content", () => {
      const content = "This is a short message.";
      render(<MarkdownContent content={content} />);
      
      expect(screen.queryByText("Show more")).not.toBeInTheDocument();
      expect(screen.queryByText("Show less")).not.toBeInTheDocument();
    });

    it("should show collapse button for long content (>500 chars)", () => {
      const longContent = "a".repeat(600);
      render(<MarkdownContent content={longContent} />);
      
      expect(screen.getByText("Show more")).toBeInTheDocument();
    });

    it("should initially collapse long content", () => {
      const longContent = "a".repeat(600);
      const { container } = render(<MarkdownContent content={longContent} />);
      
      // Content should be truncated
      const text = container.textContent || "";
      expect(text).toContain("...");
    });

    it("should expand content when Show more is clicked", async () => {
      const user = userEvent.setup();
      const longContent = "a".repeat(600);
      render(<MarkdownContent content={longContent} />);
      
      const showMoreButton = screen.getByText("Show more");
      await user.click(showMoreButton);
      
      await waitFor(() => {
        expect(screen.getByText("Show less")).toBeInTheDocument();
      });
    });

    it("should collapse content when Show less is clicked", async () => {
      const user = userEvent.setup();
      const longContent = "a".repeat(600);
      render(<MarkdownContent content={longContent} />);
      
      // First expand
      const showMoreButton = screen.getByText("Show more");
      await user.click(showMoreButton);
      
      // Then collapse
      await waitFor(async () => {
        const showLessButton = screen.getByText("Show less");
        await user.click(showLessButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText("Show more")).toBeInTheDocument();
      });
    });
  });

  describe("Markdown Rendering", () => {
    it("should render basic markdown elements", () => {
      const content = "# Heading\n\n**Bold text**\n\n*Italic text*";
      render(<MarkdownContent content={content} />);
      
      expect(screen.getByText("Heading")).toBeInTheDocument();
      expect(screen.getByText("Bold text")).toBeInTheDocument();
      expect(screen.getByText("Italic text")).toBeInTheDocument();
    });

    it("should render lists", () => {
      const content = "- Item 1\n- Item 2\n- Item 3";
      render(<MarkdownContent content={content} />);
      
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });

    it("should render links", () => {
      const content = "[Click here](https://example.com)";
      render(<MarkdownContent content={content} />);
      
      const link = screen.getByText("Click here");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "https://example.com");
    });

    it("should render tables with remark-gfm", () => {
      const content = "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |";
      render(<MarkdownContent content={content} />);
      
      expect(screen.getByText("Header 1")).toBeInTheDocument();
      expect(screen.getByText("Header 2")).toBeInTheDocument();
      expect(screen.getByText("Cell 1")).toBeInTheDocument();
      expect(screen.getByText("Cell 2")).toBeInTheDocument();
    });
  });

  describe("Requirements Validation", () => {
    it("should satisfy requirement 4.2.1: Syntax highlighting for code blocks", () => {
      const content = "```typescript\ninterface User { name: string; }\n```";
      const { container } = render(<MarkdownContent content={content} />);
      
      // Verify code is rendered with syntax highlighting
      const codeElement = container.querySelector('code.language-typescript');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toContain("interface");
    });

    it("should satisfy requirement 4.2.2: Copy button for code snippets", async () => {
      const user = userEvent.setup();
      const content = "```javascript\nconsole.log('test');\n```";
      const { container } = render(<MarkdownContent content={content} />);
      
      const copyButton = container.querySelector('button') as HTMLElement;
      expect(copyButton).toBeInTheDocument();
      
      // Click and verify check icon appears
      await user.click(copyButton);
      await waitFor(() => {
        const checkIcon = container.querySelector('svg.text-green-500');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("should satisfy requirement 4.2.3: Collapsible sections for long responses", async () => {
      const user = userEvent.setup();
      const longContent = "x".repeat(600);
      render(<MarkdownContent content={longContent} />);
      
      // Should have collapsible UI
      const showMoreButton = screen.getByText("Show more");
      expect(showMoreButton).toBeInTheDocument();
      
      // Should be able to expand/collapse
      await user.click(showMoreButton);
      await waitFor(() => {
        expect(screen.getByText("Show less")).toBeInTheDocument();
      });
    });
  });
});

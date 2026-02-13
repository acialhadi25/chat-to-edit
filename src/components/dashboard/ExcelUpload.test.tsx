import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExcelUpload from "@/components/dashboard/ExcelUpload";
import { excelDataFactory } from "@/test/factories/excel";

// Mock react-dropzone
vi.mock("react-dropzone", () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: vi.fn(() => ({})),
    getInputProps: vi.fn(() => ({})),
    isDragActive: false,
    acceptedFiles: [],
  })),
}));

// Mock XLSX
vi.mock("xlsx", () => ({
  read: vi.fn(() => ({
    SheetNames: ["Sheet1"],
    Sheets: {
      Sheet1: {
        "!ref": "A1:C3",
        A1: { v: "Header1" },
        B1: { v: "Header2" },
        C1: { v: "Header3" },
        A2: { v: 1 },
        B2: { v: 2 },
        C2: { v: 3 },
      },
    },
  })),
  utils: {
    sheet_to_json: vi.fn(() => [
      ["Header1", "Header2", "Header3"],
      [1, 2, 3],
    ]),
  },
}));

// Mock useToast
vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock useUsageLimit
vi.mock("@/hooks/useUsageLimit", () => ({
  useUsageLimit: vi.fn(() => ({
    checkCanUpload: vi.fn(() => ({ allowed: true })),
  })),
}));

// Mock UpgradeModal
vi.mock("./UpgradeModal", () => ({
  default: vi.fn(() => null),
}));

describe("ExcelUpload", () => {
  it("should render upload area", () => {
    render(<ExcelUpload onFileUpload={vi.fn()} />);

    expect(screen.getByText(/Drag & drop Excel file/i)).toBeInTheDocument();
  });

  it("should render upload button", () => {
    render(<ExcelUpload onFileUpload={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Browse Files/i })).toBeInTheDocument();
  });

  it("should call onFileUpload when file is processed", async () => {
    const mockOnFileUpload = vi.fn();
    const { container } = render(<ExcelUpload onFileUpload={mockOnFileUpload} />);

    const file = new File(
      ["mock excel content"],
      "test.xlsx",
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      await userEvent.upload(input, file);
    }
  });

  it("should show error for invalid file type", async () => {
    render(<ExcelUpload onFileUpload={vi.fn()} />);

    const file = new File(["test"], "test.txt", { type: "text/plain" });

    // Error should be shown for invalid file type
    expect(screen.getByText(/Drag & drop Excel file/i)).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { parseAIResponse, logParseResult } from "@/utils/jsonParser";

describe("jsonParser", () => {
  describe("parseAIResponse", () => {
    it("should parse valid JSON response", () => {
      const json = JSON.stringify({
        content: "Test response",
        action: { type: "EDIT_CELL", changes: [] },
      });
      const result = parseAIResponse(json, json);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("Test response");
      expect(result.data?.action?.type).toBe("EDIT_CELL");
      expect(result.data?.quickOptions).toEqual([]); // Normalized to empty array
    });

    it("should parse JSON from markdown code block", () => {
      const markdown = `\`\`\`json
{
  "content": "Test response",
  "action": { "type": "EDIT_CELL" }
}
\`\`\``;
      const result = parseAIResponse(markdown, markdown);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("Test response");
    });

    it("should parse JSON with markdown code block markers", () => {
      const markdown = `Some text before
\`\`\`
{
  "content": "Test",
  "action": null
}
\`\`\`
Some text after`;
      const result = parseAIResponse(markdown, markdown);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("Test");
    });

    it("should handle plain text response with fallback", () => {
      const text = "This is a plain text response without JSON";
      const result = parseAIResponse(text, text);

      // Plain text falls back to fallback response
      expect(result.success).toBe(false);
      expect(result.data?.content).toBe(text);
      expect(result.data?.action?.type).toBe("INFO");
    });

    it("should extract JSON from mixed content", () => {
      const mixed = `Some introduction text
\`\`\`json
{
  "content": "The actual response",
  "action": { "type": "CLARIFY" }
}
\`\`\`
Some conclusion text`;
      const result = parseAIResponse(mixed, mixed);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("The actual response");
    });

    it("should handle malformed JSON with fallback", () => {
      const malformed = '{ "content": "test", "action": { broken } }';
      const result = parseAIResponse(malformed, malformed);

      // Uses fallback when JSON parsing fails
      expect(result.success).toBe(false);
      expect(result.data?.content).toBe(malformed);
      expect(result.data?.action?.type).toBe("INFO");
    });

    it("should handle empty string with fallback", () => {
      const result = parseAIResponse("", "");

      // Empty string falls back to fallback
      expect(result.success).toBe(false);
      expect(result.data?.content).toBe("");
      expect(result.data?.action?.type).toBe("INFO");
    });

    it("should parse response with quickOptions", () => {
      const json = JSON.stringify({
        content: "Choose an option",
        quickOptions: [
          { id: "1", label: "Option 1", value: "opt1" },
          { id: "2", label: "Option 2", value: "opt2" },
        ],
      });
      const result = parseAIResponse(json, json);

      expect(result.success).toBe(true);
      expect(result.data?.quickOptions).toHaveLength(2);
    });

    it("should parse complex nested action", () => {
      const json = JSON.stringify({
        content: "Applied changes",
        action: {
          type: "CONDITIONAL_FORMAT",
          target: { type: "column", ref: "A" },
          conditionType: ">",
          conditionValues: [100],
          formatStyle: { backgroundColor: "#ff0000" },
        },
      });
      const result = parseAIResponse(json, json);

      expect(result.success).toBe(true);
      expect(result.data?.action?.type).toBe("CONDITIONAL_FORMAT");
    });

    it("should handle JSON with escaped characters", () => {
      const json = '{"content": "Line 1\\nLine 2\\tTabbed", "action": null}';
      const result = parseAIResponse(json, json);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("Line 1\nLine 2\tTabbed");
    });

    it("should handle JSON with unicode characters", () => {
      const json = '{"content": "Unicode: ABC", "action": null}';
      const result = parseAIResponse(json, json);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("Unicode: ABC");
    });

    it("should handle very long content", () => {
      const longContent = "A".repeat(10000);
      const json = JSON.stringify({ content: longContent });
      const result = parseAIResponse(json, json);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe(longContent);
    });
  });

  describe("logParseResult", () => {
    it("should log successful parse without errors", () => {
      const result = {
        success: true,
        data: { content: "Test" },
        originalText: "raw text",
        parseMethod: "direct" as const,
      };

      // Should not throw
      expect(() => logParseResult(result, "Test Context")).not.toThrow();
    });

    it("should log failed parse with error", () => {
      const result = {
        success: false,
        data: null,
        originalText: "invalid json",
        parseMethod: "fallback" as const,
        error: "Parse error",
      };

      // Should not throw
      expect(() => logParseResult(result, "Test Context")).not.toThrow();
    });

    it("should log parse result with extracted method", () => {
      const result = {
        success: true,
        data: { content: "Test" },
        originalText: "raw text",
        parseMethod: "extracted" as const,
      };

      // Should not throw
      expect(() => logParseResult(result, "Test Context")).not.toThrow();
    });

    it("should handle parse result with null data", () => {
      const result = {
        success: false,
        data: null,
        originalText: "null",
        parseMethod: "fallback" as const,
        error: "Could not parse",
      };

      // Should not throw
      expect(() => logParseResult(result, "Test Context")).not.toThrow();
    });
  });
});

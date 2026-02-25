# Integration Tests

This directory contains comprehensive integration tests for the Univer Sheet integration. These tests validate end-to-end workflows across multiple services and components.

## Test Suites

### 1. User Workflows (`user-workflows.integration.test.ts`)

Tests complete user journeys from creation to persistence:

- **Create → Edit → Save → Load**: Full CRUD workflow
- **Formula Editing**: Formula persistence and calculation
- **Formatting Preservation**: Style and format round-trips
- **Multi-sheet Operations**: Working with multiple worksheets
- **Auto-save Integration**: Automatic persistence
- **Version History**: Creating and restoring versions
- **Import → Edit → Export**: File format conversions
- **Error Recovery**: Graceful failure handling

**Key Validations:**
- Data integrity across save/load cycles
- Formula preservation and recalculation
- Formatting attributes persistence
- Version history completeness
- Import/export accuracy

### 2. AI Command Workflows (`ai-workflows.integration.test.ts`)

Tests AI integration from command parsing to execution:

- **Parse → Validate → Execute → Verify**: Complete AI workflow
- **Read Operations**: Cell and range reading
- **Write Operations**: Cell and range writing
- **Formula Commands**: AI-driven formula creation
- **Formatting Commands**: AI-driven styling
- **Complex Commands**: Sort, filter, charts, find/replace
- **Context Awareness**: Selection-based operations
- **Confirmation Flow**: Destructive operation handling
- **Error Handling**: Invalid command recovery
- **Batch Operations**: Multiple sequential commands
- **Command Suggestions**: Autocomplete functionality
- **MCP Integration**: Model Context Protocol usage

**Key Validations:**
- Command parsing accuracy
- Operation execution correctness
- Context preservation
- Error message clarity
- Confirmation requirements
- MCP connectivity

### 3. Import/Export Workflows (`import-export-workflows.integration.test.ts`)

Tests data interchange across different formats:

- **Excel Round-trip**: Import → Export → Import
- **CSV Round-trip**: Data preservation in CSV format
- **JSON Round-trip**: Complete metadata preservation
- **Formula Preservation**: Formula handling in Excel
- **Formatting Preservation**: Style attributes in Excel
- **Multi-format Conversion**: Excel → JSON → CSV
- **Large File Handling**: Performance with 1000+ rows
- **Special Characters**: CSV escaping and encoding
- **Empty Cells**: Sparse data handling
- **Error Handling**: Invalid file recovery
- **Format Detection**: Automatic format recognition
- **Batch Operations**: Multiple file processing

**Key Validations:**
- Data integrity across formats
- Formula preservation (Excel/JSON)
- Formatting preservation (Excel)
- Special character handling
- Large dataset performance
- Error recovery

### 4. Collaboration Workflows (`collaboration-workflows.integration.test.ts`)

Tests multi-user collaboration features:

- **Comments Lifecycle**: Add → Read → Update → Delete
- **Threaded Comments**: Parent-child relationships
- **Comment Mentions**: User notifications
- **Change Tracking**: Cell, formatting, and structural changes
- **Change Filtering**: By user and date range
- **Permission Management**: Owner, editor, viewer roles
- **Permission Enforcement**: Access control validation
- **Real-time Sync**: Concurrent edit simulation
- **Conflict Detection**: Identifying conflicting changes
- **Conflict Resolution**: Last-write-wins strategy
- **User Presence**: Active user tracking
- **Cursor Position**: Real-time cursor updates
- **Complete Session**: Full collaboration workflow
- **Storage Integration**: Metadata persistence

**Key Validations:**
- Comment persistence and threading
- Change tracking completeness
- Permission enforcement
- Conflict detection accuracy
- Presence tracking
- Metadata preservation

## Running Integration Tests

### Run All Integration Tests
```bash
npm test -- src/__tests__/integration
```

### Run Specific Test Suite
```bash
# User workflows
npm test -- src/__tests__/integration/user-workflows.integration.test.ts

# AI workflows
npm test -- src/__tests__/integration/ai-workflows.integration.test.ts

# Import/export workflows
npm test -- src/__tests__/integration/import-export-workflows.integration.test.ts

# Collaboration workflows
npm test -- src/__tests__/integration/collaboration-workflows.integration.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage src/__tests__/integration
```

### Run in Watch Mode
```bash
npm test -- --watch src/__tests__/integration
```

## Test Structure

Each integration test follows this pattern:

```typescript
describe('Integration: [Workflow Name]', () => {
  beforeEach(() => {
    // Setup test data and mocks
  });

  describe('Workflow: [Specific Workflow]', () => {
    it('should complete [workflow description]', async () => {
      // Step 1: Initial action
      // Step 2: Intermediate action
      // Step 3: Final action
      // Step 4: Verify results
    });
  });
});
```

## Key Principles

1. **End-to-End Testing**: Tests span multiple services and components
2. **Real Workflows**: Tests mirror actual user journeys
3. **Data Integrity**: Validates data preservation across operations
4. **Error Scenarios**: Tests both success and failure paths
5. **Performance**: Includes tests for large datasets
6. **Isolation**: Each test is independent and can run in any order

## Mocking Strategy

Integration tests use minimal mocking:

- **Mocked**: External services (Supabase, OpenAI API)
- **Real**: All internal services and business logic
- **Reason**: Validate integration between internal components

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 85%
- **Integration Coverage**: All critical user workflows

## Continuous Integration

These tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment checks

## Troubleshooting

### Tests Timing Out
- Increase timeout in test configuration
- Check for unresolved promises
- Verify mock implementations

### Flaky Tests
- Check for race conditions
- Ensure proper cleanup in afterEach
- Use waitFor for async operations

### Memory Issues
- Clear large test data in afterEach
- Use vi.clearAllMocks() consistently
- Avoid creating too many test instances

## Related Documentation

- [Property Tests](../services/__tests__/README.md)
- [Unit Tests](../components/univer/__tests__/README.md)
- [Testing Strategy](../../../docs/testing/PROPERTY_TEST_COVERAGE.md)
- [Requirements](../../../.kiro/specs/univer-integration/requirements.md)
- [Design](../../../.kiro/specs/univer-integration/design.md)

## Contributing

When adding new integration tests:

1. Follow the existing workflow pattern
2. Test complete user journeys, not isolated functions
3. Include both success and error scenarios
4. Add clear comments for each workflow step
5. Update this README with new test descriptions
6. Ensure tests are deterministic and isolated

## Success Metrics

Integration tests validate:
- ✅ Complete user workflows work end-to-end
- ✅ AI commands execute correctly
- ✅ Data persists accurately across formats
- ✅ Collaboration features work in multi-user scenarios
- ✅ Error handling is graceful and informative
- ✅ Performance meets requirements for large datasets

# Workflow Patterns

## Sequential Workflows

For complex tasks, divide operations into clear, sequential steps:

```markdown
1. Analyze input
2. Generate mapping schema
3. Validate schema
4. Execute main process
5. Verify output
```

## Conditional Workflows

For branched logic, guide agents through decision points:

```markdown
1. Determine modification type:
   - Creating new content → Follow "Creation Workflow"
   - Editing existing content → Follow "Edit Workflow"
```

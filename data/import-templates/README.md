# Import Templates

These CSV headers define the PR 5 staging contract for AI Economy Ledger imports. They are not a production import API yet.

Rules:

- Template files are header-only contracts.
- Demo rows live under `data/sample/demo-import/`.
- Sample rows must use `is_sample=true`.
- Rows with `is_sample=true` must also use `review_state=sample` when the sheet has a review state.
- Verified totals must ignore every sample row.
- Spreadsheet-formula-like text is rejected during local validation.

The sample workbook at `data/sample/ai_economy_ledger_sample_import.xlsx` mirrors these same sheets for contributor-friendly editing.

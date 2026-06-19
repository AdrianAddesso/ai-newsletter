# User guide generation

The Spanish end-user guide is generated with ReportLab and published at a stable frontend URL.

## Generate

Run from the repository root using the bundled or system Python runtime:

```powershell
python scripts/generate_user_guide.py
```

The command writes:

- QA artifact: `output/pdf/guia-de-usuario-ai-newsletter.pdf`
- Frontend asset: `frontend/public/guia-de-usuario-ai-newsletter.pdf`

The equivalent Markdown guide is maintained at:

- `docs/user-guide/guia-de-usuario-ai-newsletter.md`

Optional sanitized application screenshots belong in `docs/user-guide/screenshots/` using the filenames referenced by the generator. Never include real emails, IDs, credentials, prompts, tokens, or confidential newsletter content.

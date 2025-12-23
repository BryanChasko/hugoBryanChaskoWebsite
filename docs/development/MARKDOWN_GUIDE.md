# Markdown Style Guide & Linting

This guide covers the basic Markdown syntax, best practices, and how to autoformat and lint Markdown files in this project.

---

## Basic Syntax

### Headings
- Use `#` for headings. The number of `#` corresponds to the heading level.
- Always put a space after the `#` and before the heading text.
- Put blank lines before and after headings.

Example:
```
# Heading 1

## Heading 2

### Heading 3
```

### Paragraphs
- Separate paragraphs with a blank line.
- Do not indent paragraphs with spaces or tabs.

### Line Breaks
- End a line with two spaces or use `<br>` for a line break.

### Emphasis
- Use `*italic*` or `_italic_` for italics.
- Use `**bold**` or `__bold__` for bold.
- Use `***bold and italic***` for both.
- Prefer asterisks for emphasis inside words.

### Blockquotes
- Start a line with `>` for blockquotes.
- Use blank lines before and after blockquotes.

### Lists
- Ordered: `1. Item` (use periods, not parentheses)
- Unordered: `- Item`, `* Item`, or `+ Item` (do not mix in the same list)
- Indent four spaces for sublists or paragraphs inside lists.

### Code
- Inline: Use backticks \`code\`.
- Block: Indent by four spaces or use triple backticks (```).

### Horizontal Rules
- Use three or more `---`, `***`, or `___` on a line by themselves, with blank lines before and after.

### Links
- `[text](url)` for inline links.
- Reference-style links are supported.
- URL-encode spaces and parentheses in URLs.

### Images
- `![alt text](url "title")`
- To link an image, wrap the image markdown in brackets: `[![alt](url)](link)`

### Escaping
- Use a backslash `\` before special characters to escape them.

### HTML
- HTML tags are allowed, but not all Markdown processors support all HTML.
- Use blank lines before and after block-level HTML.

---

## Autoformatting & Linting

### Autoformatting
- Use [Prettier](https://prettier.io/) for consistent Markdown formatting.
- To autoformat all Markdown files:
  ```bash
  npx prettier --write "**/*.md"
  ```
- Prettier will enforce consistent spacing, heading style, and list formatting.

### Linting
- Use [markdownlint](https://github.com/DavidAnson/markdownlint) to catch style issues.
- To lint all Markdown files:
  ```bash
  npx markdownlint "**/*.md"
  ```
- Common rules enforced:
  - Headings must have a space after `#`
  - No trailing spaces (except for line breaks)
  - Lists must be consistent
  - No multiple consecutive blank lines
  - Fenced code blocks should use backticks

#### VS Code Integration
- Install the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) extensions for real-time feedback.

---

## Best Practices
- Use blank lines before/after block elements (headings, blockquotes, lists, code blocks).
- Prefer asterisks for emphasis and lists for compatibility.
- Do not mix list markers in the same list.
- Use reference-style links for long URLs.
- Use fenced code blocks (```) for code snippets.
- Avoid HTML unless necessary.

---

## Resources
- [Markdown Guide](https://www.markdownguide.org/basic-syntax/)
- [Prettier Docs](https://prettier.io/docs/en/options.html)
- [markdownlint Rules](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md)

---

For questions or to suggest changes, open an issue or PR.

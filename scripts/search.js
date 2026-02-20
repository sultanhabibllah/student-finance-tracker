/**
 * Safely compile a regex from user input.
 * Returns null if empty, 'invalid' if bad pattern.
 */
export function compileRegex(input, caseSensitive = false) {
  if (!input || !input.trim()) return null;
  try {
    const flags = caseSensitive ? '' : 'i';
    return new RegExp(input, flags);
  } catch {
    return 'invalid';
  }
}

/**
 * Highlight regex matches in text using <mark> tags.
 */
export function highlight(text, re) {
  if (!re || re === 'invalid') return escapeHtml(text);
  return escapeHtml(text).replace(
    new RegExp(re.source, re.flags),
    m => `<mark>${m}</mark>`
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Filter records by regex against description and category.
 */
export function filterRecords(records, re) {
  if (!re || re === 'invalid') return records;
  return records.filter(r =>
    re.test(r.description) || re.test(r.category)
  );
}
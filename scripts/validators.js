// Rule 1: No leading/trailing spaces
const RE_DESCRIPTION = /^\S(?:.*\S)?$/;
const RE_DOUBLE_SPACE = /  +/;

// Rule 2: Valid amount
const RE_AMOUNT = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

// Rule 3: Date YYYY-MM-DD
const RE_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Rule 4: Category letters, spaces, hyphens
const RE_CATEGORY = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

// Advanced Rule 5: Back-reference to catch duplicate words e.g. "the the"
export const RE_DUPLICATE_WORD = /\b(\w+)\s+\1\b/i;

export function validateDescription(value) {
  if (!value) return 'Description is required.';
  if (!RE_DESCRIPTION.test(value)) return 'No leading or trailing spaces allowed.';
  if (RE_DOUBLE_SPACE.test(value)) return 'No double spaces allowed.';
  if (RE_DUPLICATE_WORD.test(value)) return 'Duplicate word detected (e.g. "the the").';
  if (value.length < 2) return 'Description must be at least 2 characters.';
  if (value.length > 120) return 'Description must be 120 characters or fewer.';
  return null;
}

export function validateAmount(value) {
  if (!value) return 'Amount is required.';
  if (!RE_AMOUNT.test(value)) return 'Enter a valid amount (e.g. 12.50).';
  const num = parseFloat(value);
  if (num <= 0) return 'Amount must be greater than 0.';
  if (num > 99999) return 'Amount seems too large.';
  return null;
}

export function validateDate(value) {
  if (!value) return 'Date is required.';
  if (!RE_DATE.test(value)) return 'Date must be in YYYY-MM-DD format.';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Invalid date.';
  return null;
}

export function validateCategory(value) {
  if (!value) return 'Please select a category.';
  return null;
}

export function validateCustomCategory(value) {
  if (!value) return 'Category name is required.';
  if (!RE_CATEGORY.test(value)) return 'Only letters, spaces, and hyphens allowed.';
  return null;
}

export function validateBudgetCap(value) {
  if (!value) return null;
  if (!RE_AMOUNT.test(value)) return 'Enter a valid number (e.g. 500).';
  return null;
}

export function validateCurrencyRate(value) {
  if (!value) return null;
  if (!RE_AMOUNT.test(value)) return 'Enter a valid rate (e.g. 1.27).';
  return null;
}
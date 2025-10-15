// Simple Spectral helper: compare two JSONPath-extracted numeric values
module.exports = (targetVal, opts, paths) => {
  try {
    const { op, left, right, allowMissingRight } = opts || {};
    const jp = require('jsonpath');
    const doc = paths?.documentInventory?.resolved || {};
    const l = jp.value(doc, left);
    const r = jp.value(doc, right);
    if (r === undefined && allowMissingRight) return [];
    if (typeof l !== 'number' || typeof r !== 'number') return [];
    const ok =
      (op === '>=' && l >= r) ||
      (op === '>'  && l >  r) ||
      (op === '<=' && l <= r) ||
      (op === '<'  && l <  r) ||
      (op === '==' && l == r);
    return ok ? [] : [{ message: `Rule failed: ${left} ${op} ${right}` }];
  } catch (e) { return [{ message: `equalsPath error: ${e.message}` }]; }
};
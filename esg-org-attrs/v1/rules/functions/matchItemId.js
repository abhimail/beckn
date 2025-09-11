// Spectral custom function to compare two paths within a document.
module.exports = (targetVal, opts) => {
  const get = (obj, path) => path.split('.').reduce((o,k)=> (o && o[k] !== undefined ? o[k] : undefined), obj);
  const itemId   = get(targetVal, opts.itemIdPath);
  const metricId = get(targetVal, opts.metricIdPath);
  if (itemId === undefined || metricId === undefined) return [];
  return itemId === metricId ? [] : [{
    message: `metricId ('${metricId}') must equal Item beckn:id ('${itemId}').`
  }];
};

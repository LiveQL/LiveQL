/**
 * This function returns a flatten string ("hash") of the query. It removes
 * white space and line breaks. It also replaces variables in the query.
 * @param {String} str - A GraphQL query string to hash.
 * @param {Object} vars - The object of variables send with the GraphQL query string.
 */
module.exports = (str, vars = {}) => {
  let hash = str.slice(str.indexOf('{')).replace(/ /g, '').replace(/\r?\n|\r/g, '');
  let variables = [];
  if (vars) variables = Object.keys(vars);
  for (let i = 0; i < variables.length; i += 1) {
    const reg = new RegExp('\\$' + variables[i], 'g');
    hash = hash.replace(reg, vars[variables[i]]);
  }
  return hash;
};

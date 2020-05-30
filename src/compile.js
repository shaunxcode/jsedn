/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = string => `return require('jsedn').parse(\"${string.replace(/"/g, '\\"').replace(/\n/g, " ").trim()}\")`;
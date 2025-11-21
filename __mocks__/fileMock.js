// __mocks__/fileMock.js

// This is a generic mock for any file asset or problematic module.
// For any import, it returns a string for default, and a no-op function for named exports.
module.exports = new Proxy({}, {
  get: function(target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return 'mocked-file';
    return () => null;
  }
});

// __mocks__/fileMock.js
import React from 'react';

// This is a generic mock for any file asset or problematic module.
// For components, it returns a simple div.
// For other assets, it exports a default string.
module.exports = new Proxy({}, {
  get: function(target, prop, receiver) {
    if (prop === '__esModule') {
      return false;
    }
    // Mock any named export as a simple React component
    return (props) => React.createElement('div', props);
  }
});

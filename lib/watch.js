'use strict';

const mem = require('mem');
const memOptions = { cacheKey: ([collection]) => collection.collectionName };

const watch = function(collection) {
  const watchers = mem((operationType) => {
    return collection.watch([{ $match: { operationType } }]);
  });

  const self = {
    on: (operationType, callback) => {
      watchers(operationType).on('change', callback);
      return self; // to make chaining .on functions possible (fluent api)
    }
  };
  return self;
};

module.exports = mem(watch, memOptions);

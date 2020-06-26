'use strict';

const getenv = require('getenv');

const tlscert = require('seal-tlscert');

const setTlsOptions = function(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }

  const tlsUnprotected = getenv('TLS_UNPROTECTED', 'loopback');

  if (tlsUnprotected !== 'none' && tlsUnprotected !== 'loopback') {
    return options;
  }

  const keystore = tlscert.get();

  options.ssl = true;

  if (keystore.ca) {
    options.sslCA = [keystore.ca];
    options.sslCert = keystore.cert;
    options.sslKey = keystore.key;
    options.sslValidate = true;
  }

  return options;
};

module.exports = setTlsOptions;

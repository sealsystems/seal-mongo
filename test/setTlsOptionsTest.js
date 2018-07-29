'use strict';

const assert = require('assertthat');
const nodeenv = require('nodeenv');
const proxyquire = require('proxyquire');

let keystore;

const setTlsOptions = proxyquire('../lib/setTlsOptions', {
  '@sealsystems/tlscert': {
    async get () {
      return keystore;
    }
  }
});

suite('setTlsOptions', () => {
  setup(() => {
    keystore = { ca: 'ca', cert: 'cert', key: 'key' };
  });

  test('is a function', async () => {
    assert.that(setTlsOptions).is.ofType('function');
  });

  test('throws an error if options are missing.', async () => {
    await assert.that(async () => {
      await setTlsOptions();
    }).is.throwingAsync('Options are missing.');
  });

  test('does not set TLS options if TLS_UNPROTECTED is set to \'world\'.', async () => {
    const options = { foo: 'bar' };
    const restore = nodeenv('TLS_UNPROTECTED', 'world');

    await setTlsOptions(options);
    assert.that(options).is.equalTo({ foo: 'bar' });

    restore();
  });

  test('does not set TLS options if TLS_UNPROTECTED is set to \'dc\'.', async () => {
    const options = { foo: 'bar' };
    const restore = nodeenv('TLS_UNPROTECTED', 'dc');

    await setTlsOptions(options);
    assert.that(options).is.equalTo({ foo: 'bar' });

    restore();
  });

  test('enforces SSL encryption.', async () => {
    const options = { foo: 'bar' };
    const restore = nodeenv('TLS_UNPROTECTED', null);

    await setTlsOptions(options);

    assert.that(options.ssl).is.true();

    restore();
  });

  test('returns CA certificate, client certificate and key.', async () => {
    const options = {};
    const restore = nodeenv('TLS_UNPROTECTED', null);

    await setTlsOptions(options);

    assert.that(options.sslCA).is.equalTo(['ca']);
    assert.that(options.sslCert).is.equalTo('cert');
    assert.that(options.sslKey).is.equalTo('key');

    restore();
  });

  test('enforces validation if CA certificate is given.', async () => {
    const options = {};
    const restore = nodeenv('TLS_UNPROTECTED', null);

    await setTlsOptions(options);

    assert.that(options.sslValidate).is.true();

    restore();
  });

  test('does not provide certificates for client authentication if CA certificate is missing.', async () => {
    const options = {};
    const restore = nodeenv('TLS_UNPROTECTED', null);

    keystore = { cert: 'cert', key: 'key' };

    await setTlsOptions(options);

    assert.that(options).is.equalTo({ ssl: true });

    restore();
  });
});

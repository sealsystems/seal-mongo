'use strict';

const assert = require('assertthat');
const nodeenv = require('nodeenv');
const proxyquire = require('proxyquire');

let keystore;
const setTlsOptions = proxyquire('../lib/setTlsOptions', {
  'seal-tlscert': {
    get () {
      return keystore;
    }
  }
});

suite('setTlsOptions', () => {
  setup(() => {
    keystore = {
      ca: 'ca',
      cert: 'cert',
      key: 'key'
    };
  });

  test('is a function', (done) => {
    assert.that(setTlsOptions).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', (done) => {
    assert.that(() => {
      setTlsOptions();
    }).is.throwing('Options are missing.');
    done();
  });

  test('does not set TLS options if TLS_UNPROTECTED is set to \'world\'.', (done) => {
    const options = {
      foo: 'bar'
    };

    nodeenv('TLS_UNPROTECTED', 'world', (restore) => {
      setTlsOptions(options);
      assert.that(options).is.equalTo({
        foo: 'bar'
      });
      restore();
      done();
    });
  });

  test('does not set TLS options if TLS_UNPROTECTED is set to \'dc\'.', (done) => {
    const options = {
      foo: 'bar'
    };

    nodeenv('TLS_UNPROTECTED', 'dc', (restore) => {
      setTlsOptions(options);
      assert.that(options).is.equalTo({
        foo: 'bar'
      });
      restore();
      done();
    });
  });

  test('enforces SSL encryption.', (done) => {
    const options = {
      foo: 'bar'
    };

    setTlsOptions(options);
    assert.that(options.ssl).is.true();
    done();
  });

  test('returns CA certificate, client certificate and key.', (done) => {
    const options = {};

    setTlsOptions(options);
    assert.that(options.sslCA).is.equalTo(['ca']);
    assert.that(options.sslCert).is.equalTo('cert');
    assert.that(options.sslKey).is.equalTo('key');
    done();
  });

  test('enforces validation if CA certificate is given.', (done) => {
    const options = {};

    setTlsOptions(options);
    assert.that(options.sslValidate).is.true();
    done();
  });

  test('does not provide certificates for client authentication if CA certificate is missing.', (done) => {
    const options = {};

    keystore = {
      cert: 'cert',
      key: 'key'
    };

    setTlsOptions(options);
    assert.that(options).is.equalTo({
      ssl: true
    });
    done();
  });
});

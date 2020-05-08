/* eslint-disable no-async-promise-executor */
'use strict';

const assert = require('assertthat');
const { nodeenv } = require('nodeenv');
const proxyquire = require('proxyquire');
const { v4: uuid } = require('uuid');

const mongo = require('../lib/mongo');

const mongoMock = proxyquire('../lib/mongo', {
  async './setTlsOptions'(options) {
    options.sslCA = ['ca'];
    options.sslCert = 'cert';
    options.sslKey = 'key';
    options.sslValidate = true;

    return options;
  },

  mongodb: {
    MongoClient: {
      async connect(connectionString, options) {
        return {
          async db() {
            return options;
          }
        };
      }
    }
  }
});

const sleep = function(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const connectionStringFoo = `mongodb://localhost:27017/foo`;
const connectionStringBar = `mongodb://localhost:27017/bar`;
const connectionStringCursor = `mongodb://localhost:27017/cursor`;
let restore;

suite('mongo', () => {
  suiteSetup(async () => {
    restore = nodeenv('TLS_UNPROTECTED', 'world');
  });

  suiteTeardown(async () => {
    restore();
  });

  test('is an object.', async () => {
    assert.that(mongo).is.ofType('object');
  });

  suite('db', () => {
    test('is a function.', async () => {
      assert.that(mongo.db).is.ofType('function');
    });

    test('throws an exception if connection string is missing.', async () => {
      await assert
        .that(async () => {
          await mongo.db();
        })
        .is.throwingAsync('Connection string is missing.');
    });

    test('throws an error if the given MongoDB is not reachable.', async function() {
      this.timeout(10 * 1000);

      await assert
        .that(async () => {
          await mongo.db('mongodb://localhost:12345/foo', {
            connectionRetries: 1,
            waitTimeBetweenRetries: 1000
          });
        })
        .is.throwingAsync((ex) => ex.name === 'MongoNetworkError');
    });

    test('connectionRetries equals to 0 does try to connect only once.', async function() {
      this.timeout(10 * 1000);

      await assert
        .that(async () => {
          await mongo.db('mongodb://localhost:12345/foo', {
            connectionRetries: 0,
            waitTimeBetweenRetries: 1000
          });
        })
        .is.throwingAsync((ex) => ex.name === 'MongoNetworkError');
    });

    test('returns a reference to the database.', async function() {
      this.timeout(10 * 1000);
      const db = await mongo.db(connectionStringFoo);

      assert.that(db).is.ofType('object');
      assert.that(db.collection).is.ofType('function');
    });

    test('validates with given CA certificate.', async () => {
      const connectOptions = await mongoMock.db(connectionStringFoo);

      assert.that(connectOptions).is.ofType('object');
      assert.that(connectOptions.sslCA).is.equalTo(['ca']);
      assert.that(connectOptions.sslValidate).is.true();
    });

    test('returns the same reference if called twice with the same connection string.', async () => {
      const dbFirst = await mongo.db(connectionStringFoo);
      const dbSecond = await mongo.db(connectionStringFoo);

      assert.that(dbFirst).is.sameAs(dbSecond);
    });

    test('returns different references if called twice with different connection strings.', async () => {
      const dbFirst = await mongo.db(connectionStringFoo);
      const dbSecond = await mongo.db(connectionStringBar);

      assert.that(dbFirst).is.not.sameAs(dbSecond);
    });

    test('connects to database', async () => {
      const db = await mongo.db(connectionStringFoo);
      const coll = db.collection(uuid());

      await assert
        .that(async () => {
          await coll.insertOne({ foo: 'bar' });
        })
        .is.not.throwingAsync();
    });

    suite('gridfs', () => {
      test('is a function.', async () => {
        const db = await mongo.db(connectionStringFoo);

        assert.that(db.gridfs).is.ofType('function');
      });

      test('returns a reference to GridFS.', async () => {
        const db = await mongo.db(connectionStringFoo);

        const gridfs = db.gridfs();

        assert.that(gridfs).is.ofType('object');
        assert.that(gridfs.createReadStream).is.ofType('function');
      });

      suite('createReadStream', () => {
        test('throws an error if filename is missing', async () => {
          const db = await mongo.db(connectionStringFoo);

          await assert
            .that(async () => {
              await db.gridfs().createReadStream();
            })
            .is.throwingAsync('Filename is missing.');
        });

        test('returns an error if file could not be opened', async () => {
          const db = await mongo.db(connectionStringFoo);
          const gridfs = db.gridfs();

          const fileName = uuid();

          await assert
            .that(async () => {
              await gridfs.createReadStream(fileName);
            })
            .is.throwingAsync();
        });

        test('reads file', async function() {
          this.timeout(10 * 1000);

          const db = await mongo.db(connectionStringFoo);
          const gridfs = db.gridfs();

          const fileName = uuid();
          const content = 'hohoho';

          const writeStream = await gridfs.createWriteStream(fileName);

          writeStream.write(content);
          writeStream.end();

          await new Promise(async (resolve, reject) => {
            try {
              let result;

              for (let i = 0; i < 10; i++) {
                // Wait for a short amount of time to give MongoDB enough time to
                // actually save the file to GridFS.
                await sleep(0.1 * 1000);

                result = await gridfs.exist(fileName);
                if (result) {
                  // Write is complete. No need to re-check.
                  break;
                }
              }

              assert.that(result).is.true();

              const { stream } = await gridfs.createReadStream(fileName);

              stream.on('data', (chunk) => {
                try {
                  assert.that(chunk.toString()).is.equalTo(content);
                  // tests in data event, because cursor is created at first read
                  assert.that(stream.s.cursor.cmd.noCursorTimeout).is.falsy();
                } catch (ex) {
                  reject(ex);
                }
              });
              stream.once('end', resolve);
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('sets cursor timeout', async function() {
          this.timeout(10 * 1000);

          const db = await mongo.db(connectionStringCursor, { noCursorTimeout: true });
          const gridfs = db.gridfs();

          const fileName = uuid();
          const content = 'jojojo';

          const writeStream = await gridfs.createWriteStream(fileName);

          writeStream.write(content);
          writeStream.end();

          await new Promise(async (resolve, reject) => {
            try {
              let result;

              for (let i = 0; i < 10; i++) {
                // Wait for a short amount of time to give MongoDB enough time to
                // actually save the file to GridFS.
                await sleep(0.1 * 1000);

                result = await gridfs.exist(fileName);
                if (result) {
                  // Write is complete. No need to re-check.
                  break;
                }
              }

              assert.that(result).is.true();

              const { stream } = await gridfs.createReadStream(fileName);

              // test for mongo client version
              assert.that(stream.s).is.ofType('object');
              assert.that(stream.s.cursor).is.not.undefined();

              stream.on('data', (chunk) => {
                try {
                  assert.that(chunk.toString()).is.equalTo(content);
                  // tests in data event, because cursor is created at first read
                  assert.that(stream.s.cursor.cmd.noCursorTimeout).is.true();
                } catch (ex) {
                  reject(ex);
                }
              });
              stream.once('end', resolve);
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('reads file with metadata', async () => {
          const db = await mongo.db(connectionStringFoo);
          const gridfs = db.gridfs();

          const fileName = uuid();
          const content = 'hohoho';
          const writeMetadata = { foo: 'bar' };

          const writeStream = await gridfs.createWriteStream(fileName, writeMetadata);

          writeStream.write(content);
          writeStream.end();

          // Wait for a short amount of time to give MongoDB enough time to
          // actually save the file to GridFS.
          await sleep(0.1 * 1000);

          const result = await gridfs.exist(fileName);

          assert.that(result).is.true();

          await new Promise(async (resolve, reject) => {
            try {
              const { stream, metadata } = await gridfs.createReadStream(fileName);

              assert.that(metadata).is.equalTo({ foo: 'bar' });

              stream.on('data', (chunk) => {
                try {
                  assert.that(chunk.toString()).is.equalTo(content);
                } catch (ex) {
                  reject(ex);
                }
              });
              stream.once('end', resolve);
            } catch (ex) {
              reject(ex);
            }
          });
        });
      });

      suite('createWriteStream', () => {
        test('throws an error if filename is missing', async () => {
          const db = await mongo.db(connectionStringFoo);

          await assert
            .that(async () => {
              await db.gridfs().createWriteStream();
            })
            .is.throwingAsync('Filename is missing.');
        });

        test('writes file', async () => {
          const db = await mongo.db(connectionStringFoo);
          const gridfs = db.gridfs();

          const fileName = uuid();
          const content = 'hohoho';

          const writeStream = await gridfs.createWriteStream(fileName);

          writeStream.write(content);
          writeStream.end();

          // Wait for a short amount of time to give MongoDB enough time to
          // actually save the file to GridFS.
          await sleep(0.1 * 1000);

          const result = await gridfs.exist(fileName);

          assert.that(result).is.true();

          await new Promise(async (resolve, reject) => {
            try {
              const { stream } = await gridfs.createReadStream(fileName);

              stream.on('data', (chunk) => {
                try {
                  assert.that(chunk.toString()).is.equalTo(content);
                } catch (ex) {
                  reject(ex);
                }
              });

              stream.once('end', resolve);
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('writes file with metadata', async () => {
          const db = await mongo.db(connectionStringFoo);
          const gridfs = db.gridfs();

          const fileName = uuid();
          const content = 'hohoho';
          const writeMetadata = { foo: 'bar' };

          const writeStream = await gridfs.createWriteStream(fileName, writeMetadata);

          writeStream.write(content);
          writeStream.end();

          // Wait for a short amount of time to give MongoDB enough time to
          // actually save the file to GridFS.
          await sleep(0.1 * 1000);

          const result = await gridfs.exist(fileName);

          assert.that(result).is.true();

          await new Promise(async (resolve, reject) => {
            try {
              const { stream, metadata } = await gridfs.createReadStream(fileName);

              assert.that(metadata).is.equalTo({ foo: 'bar' });

              stream.on('data', (chunk) => {
                try {
                  assert.that(chunk.toString()).is.equalTo(content);
                } catch (ex) {
                  reject(ex);
                }
              });
              stream.once('end', resolve);
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('updates metadata', async () => {
          const db = await mongo.db(connectionStringFoo);
          const gridfs = db.gridfs();

          const fileName = uuid();
          const content = 'hohoho';
          const writeStream = await gridfs.createWriteStream(fileName);

          writeStream.write(content);
          writeStream.end();

          // Wait for a short amount of time to give MongoDB enough time to
          // actually save the file to GridFS.
          await sleep(0.1 * 1000);

          const metadata = ['1', '2', '3'];
          const result = await gridfs.setMetadata(fileName, metadata);

          assert.that(result.result.ok).is.equalTo(1);
          assert.that(result.result.n).is.equalTo(1);

          const fileData = await gridfs.findFile(fileName);

          assert.that(fileData.metadata).is.equalTo(metadata);
        });
      });

      suite('exist', () => {
        test('throws an error if filename is missing', async () => {
          const db = await mongo.db(connectionStringFoo);

          await assert
            .that(async () => {
              await db.gridfs().exist();
            })
            .is.throwingAsync('Filename is missing.');
        });

        test('returns false if file does not exist', async () => {
          const db = await mongo.db(connectionStringFoo);
          const fileName = uuid();

          const result = await db.gridfs().exist(fileName);

          assert.that(result).is.false();
        });

        test('returns true if file exists', async () => {
          const db = await mongo.db(connectionStringFoo);
          const gridfs = db.gridfs();

          const fileName = uuid();
          const content = 'hohoho';

          const stream = await gridfs.createWriteStream(fileName);

          stream.write(content);
          stream.end();

          // Wait for a short amount of time to give MongoDB enough time to
          // actually save the file to GridFS.
          await sleep(0.1 * 1000);

          const result = await gridfs.exist(fileName);

          assert.that(result).is.true();
        });
      });

      suite('unlink', () => {
        test('throws an error if filename is missing', async () => {
          const db = await mongo.db(connectionStringFoo);

          await assert
            .that(async () => {
              await db.gridfs().unlink();
            })
            .is.throwingAsync('Filename is missing.');
        });

        test('unlinks file', async () => {
          const db = await mongo.db(connectionStringFoo);
          const gridfs = db.gridfs();

          const fileName = uuid();
          const content = 'hohoho';

          const stream = await gridfs.createWriteStream(fileName);

          stream.write(content);
          stream.end();

          // Wait for a short amount of time to give MongoDB enough time to
          // actually save the file to GridFS.
          await sleep(0.1 * 1000);

          const result = await gridfs.exist(fileName);

          assert.that(result).is.true();

          await gridfs.unlink(fileName);

          const result2 = await gridfs.exist(fileName);

          assert.that(result2).is.false();
        });
      });
    });

    suite('watch', () => {
      test('playground', async () => {
        const db = await mongo.db(connectionStringFoo);
        const collection = db.collection('mycol', { slaveOk: true });
        await collection.insertOne({}); // to init db and collection
        const testDocument = { foo: 'bar' };
        const w = new Promise((resolve) => {
          db.watch(collection).on('insert', (doc) => {
            assert.that(doc.fullDocument).is.equalTo(testDocument);
            resolve();
          });
        });
        await new Promise((r) => setTimeout(r, 500));
        await collection.insertOne(testDocument);
        return w;
      });
    });
  });
});

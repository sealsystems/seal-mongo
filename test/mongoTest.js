'use strict';

const assert = require('assertthat');
const moment = require('moment');
const proxyquire = require('proxyquire');
const uuid = require('uuid');

const mongo = require('../lib/mongo');
const mongoMock = proxyquire('../lib/mongo', {
  './setTlsOptions'(options) {
    options.sslCA = ['ca'];
    options.sslCert = 'cert';
    options.sslKey = 'key';
    options.sslValidate = true;
    return options;
  },
  mongodb: {
    MongoClient: {
      connect(connectionString, options, callback) {
        callback(null, options);
      }
    }
  }
});
const connectionString = `mongodb://localhost:27017/foo`;
const connectionStringOther = `mongodb://localhost:27017/bar`;

suite('mongo', () => {
  test('is an object.', (done) => {
    assert.that(mongo).is.ofType('object');
    done();
  });

  suite('db', () => {
    test('is a function.', (done) => {
      assert.that(mongo.db).is.ofType('function');
      done();
    });

    test('throws an exception if connection string is missing.', (done) => {
      assert
        .that(() => {
          mongo.db();
        })
        .is.throwing('Connection string is missing.');
      done();
    });

    test('throws an exception if callback is missing.', (done) => {
      assert
        .that(() => {
          mongo.db(connectionString);
        })
        .is.throwing('Callback is missing.');
      done();
    });

    test('throws an exception if callback is missing even if options are given.', (done) => {
      assert
        .that(() => {
          mongo.db(connectionString, {});
        })
        .is.throwing('Callback is missing.');
      done();
    });

    test.skip('throws an error if the given MongoDB is not reachable.', function(done) {
      this.timeout(10 * 1000);

      mongo.db(
        'mongodb://localhost:12345/foo',
        {
          connectionRetries: 1,
          waitTimeBetweenRetries: 1000
        },
        (err) => {
          assert.that(err.name).is.equalTo('MongoNetworkError');
          done();
        }
      );
    });

    test.skip('connectionRetries equals to 0 does try to connect only once.', function(done) {
      this.timeout(2 * 1000);
      const start = moment();

      mongo.db(
        'mongodb://localhost:12345/foo',
        {
          connectionRetries: 0,
          waitTimeBetweenRetries: 1000
        },
        (err) => {
          const duration = moment.duration(moment().diff(start));

          assert.that(err.name).is.equalTo('MongoNetworkError');
          assert.that(duration.seconds()).is.between(0, 2);

          done();
        }
      );
    });

    test('returns a reference to the database.', function(done) {
      this.timeout(10 * 1000);
      mongo.db(connectionString, (err, db) => {
        assert.that(err).is.null();
        assert.that(db).is.ofType('object');
        assert.that(db.collection).is.ofType('function');
        done();
      });
    });

    test.skip('validates with given CA certificate.', (done) => {
      mongoMock.db(connectionString, (err, connectOptions) => {
        assert.that(err).is.null();
        assert.that(connectOptions).is.ofType('object');
        assert.that(connectOptions.sslCA).is.equalTo(['ca']);
        assert.that(connectOptions.sslValidate).is.true();
        done();
      });
    });

    test('returns the same reference if called twice with the same connection string.', (done) => {
      mongo.db(connectionString, (errFirst, dbFirst) => {
        assert.that(errFirst).is.null();
        mongo.db(connectionString, (errSecond, dbSecond) => {
          assert.that(errSecond).is.null();
          assert.that(dbFirst).is.sameAs(dbSecond);
          done();
        });
      });
    });

    test('returns different references if called twice with different connection strings.', (done) => {
      mongo.db(connectionString, (errFirst, dbFirst) => {
        assert.that(errFirst).is.null();
        mongo.db(connectionStringOther, (errSecond, dbSecond) => {
          assert.that(errSecond).is.null();
          assert.that(dbFirst).is.not.sameAs(dbSecond);
          done();
        });
      });
    });

    test('connects to database', (done) => {
      mongo.db(connectionString, (errFirst, db) => {
        assert.that(errFirst).is.null();
        const coll = db.collection(uuid.v4());

        coll.insert({ foo: 'bar' }, (errInsert) => {
          assert.that(errInsert).is.null();
          done();
        });
      });
    });

    suite('gridfs', () => {
      test('is a function.', (done) => {
        mongo.db(connectionString, (err, db) => {
          assert.that(err).is.null();
          assert.that(db.gridfs).is.ofType('function');
          done();
        });
      });

      test('returns a reference to GridFS.', (done) => {
        mongo.db(connectionString, (err, db) => {
          assert.that(err).is.null();

          const gridfs = db.gridfs();

          assert.that(gridfs).is.ofType('object');
          assert.that(gridfs.createReadStream).is.ofType('function');
          done();
        });
      });

      suite('createReadStream', () => {
        test('throws an error if filename is missing', (done) => {
          mongo.db(connectionString, (err, db) => {
            assert.that(err).is.null();

            assert
              .that(() => {
                db.gridfs().createReadStream();
              })
              .is.throwing('Filename is missing.');
            done();
          });
        });

        test('throws an error if callback is missing', (done) => {
          mongo.db(connectionString, (err, db) => {
            assert.that(err).is.null();

            assert
              .that(() => {
                db.gridfs().createReadStream(uuid.v4());
              })
              .is.throwing('Callback is missing.');
            done();
          });
        });

        test('returns an error if file could not be opened', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();

            assert.that(err).is.null();

            const gridfs = db.gridfs();

            gridfs.createReadStream(fileName, (errRead) => {
              assert.that(errRead).is.not.null();
              done();
            });
          });
        });

        test('reads file', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();
            const content = 'hohoho';

            assert.that(err).is.null();

            const gridfs = db.gridfs();

            gridfs.createWriteStream(fileName, (errCreate, stream) => {
              assert.that(errCreate).is.null();
              stream.on('close', () => {
                gridfs.exist(fileName, (errExist, result) => {
                  assert.that(errExist).is.null();
                  assert.that(result).is.true();

                  gridfs.createReadStream(fileName, (errRead, inStream) => {
                    assert.that(errRead).is.null();
                    inStream.on('data', (chunk) => {
                      assert.that(chunk.toString()).is.equalTo(content);
                    });
                    inStream.once('end', done);
                  });
                });
              });
              stream.write(content);
              stream.end();
            });
          });
        });

        test('reads file with metadata', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();
            const content = 'hohoho';
            const metadata = { foo: 'bar' };

            assert.that(err).is.null();

            const gridfs = db.gridfs();

            gridfs.createWriteStream(fileName, metadata, (errCreate, stream) => {
              assert.that(errCreate).is.null();
              stream.on('close', () => {
                gridfs.exist(fileName, (errExist, result) => {
                  assert.that(errExist).is.null();
                  assert.that(result).is.true();

                  gridfs.createReadStream(fileName, (errRead, inStream, inMetadata) => {
                    assert.that(errRead).is.null();
                    assert.that(inMetadata).is.equalTo({ foo: 'bar' });
                    inStream.on('data', (chunk) => {
                      assert.that(chunk.toString()).is.equalTo(content);
                    });
                    inStream.once('end', done);
                  });
                });
              });
              stream.write(content);
              stream.end();
            });
          });
        });
      });

      suite('createWriteStream', () => {
        test('throws an error if filename is missing', (done) => {
          mongo.db(connectionString, (err, db) => {
            assert.that(err).is.null();

            assert
              .that(() => {
                db.gridfs().createWriteStream();
              })
              .is.throwing('Filename is missing.');
            done();
          });
        });

        test('throws an error if callback is missing', (done) => {
          mongo.db(connectionString, (err, db) => {
            assert.that(err).is.null();

            assert
              .that(() => {
                db.gridfs().createWriteStream(uuid.v4());
              })
              .is.throwing('Callback is missing.');
            done();
          });
        });

        test('writes file', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();
            const content = 'hohoho';

            assert.that(err).is.null();

            const gridfs = db.gridfs();

            gridfs.createWriteStream(fileName, (errCreate, stream) => {
              assert.that(errCreate).is.null();
              stream.on('close', () => {
                gridfs.exist(fileName, (errExist, result) => {
                  assert.that(errExist).is.null();
                  assert.that(result).is.true();

                  gridfs.createReadStream(fileName, (errRead, inStream) => {
                    assert.that(errRead).is.null();
                    inStream.on('data', (chunk) => {
                      assert.that(chunk.toString()).is.equalTo(content);
                    });
                    inStream.once('end', done);
                  });
                });
              });
              stream.write(content);
              stream.end();
            });
          });
        });

        test('writes file with metadata', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();
            const content = 'hohoho';
            const metadata = { foo: 'bar' };

            assert.that(err).is.null();

            const gridfs = db.gridfs();

            gridfs.createWriteStream(fileName, metadata, (errCreate, stream) => {
              assert.that(errCreate).is.null();
              stream.on('close', () => {
                gridfs.exist(fileName, (errExist, result) => {
                  assert.that(errExist).is.null();
                  assert.that(result).is.true();

                  gridfs.createReadStream(fileName, (errRead, inStream, inMetadata) => {
                    assert.that(errRead).is.null();
                    assert.that(inMetadata).is.equalTo({ foo: 'bar' });
                    inStream.on('data', (chunk) => {
                      assert.that(chunk.toString()).is.equalTo(content);
                    });
                    inStream.once('end', done);
                  });
                });
              });
              stream.write(content);
              stream.end();
            });
          });
        });

        test('updates metadata', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();
            const content = 'hohoho';
            const metadata = ['1', '2', '3'];

            assert.that(err).is.null();

            const gridfs = db.gridfs();

            gridfs.createWriteStream(fileName, null, (errCreate, stream) => {
              assert.that(errCreate).is.null();
              stream.on('close', () => {
                gridfs.setMetadata(fileName, metadata, (errSet, result) => {
                  assert.that(errSet).is.null();
                  assert.that(result.result.ok).is.equalTo(1);
                  assert.that(result.result.n).is.equalTo(1);
                  gridfs.findFile(fileName, (errFind, fileData) => {
                    assert.that(errFind).is.null();
                    assert.that(fileData.metadata).is.equalTo(metadata);
                    done();
                  });
                });
              });
              stream.write(content);
              stream.end();
            });
          });
        });
      });

      suite('exist', () => {
        test('throws an error if filename is missing', (done) => {
          mongo.db(connectionString, (err, db) => {
            assert.that(err).is.null();

            assert
              .that(() => {
                db.gridfs().exist();
              })
              .is.throwing('Filename is missing.');
            done();
          });
        });

        test('throws an error if callback is missing', (done) => {
          mongo.db(connectionString, (err, db) => {
            assert.that(err).is.null();

            assert
              .that(() => {
                db.gridfs().exist(uuid.v4());
              })
              .is.throwing('Callback is missing.');
            done();
          });
        });

        test('returns false if file does not exist', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();

            assert.that(err).is.null();

            db.gridfs().exist(fileName, (errExist, result) => {
              assert.that(errExist).is.null();
              assert.that(result).is.false();
              done();
            });
          });
        });

        test('returns true if file exists', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();
            const content = 'hohoho';

            assert.that(err).is.null();

            const gridfs = db.gridfs();

            gridfs.createWriteStream(fileName, (errCreate, stream) => {
              assert.that(errCreate).is.null();
              stream.on('close', () => {
                gridfs.exist(fileName, (errExist, result) => {
                  assert.that(errExist).is.null();
                  assert.that(result).is.true();
                  done();
                });
              });
              stream.write(content);
              stream.end();
            });
          });
        });
      });

      suite('unlink', () => {
        test('throws an error if filename is missing', (done) => {
          mongo.db(connectionString, (err, db) => {
            assert.that(err).is.null();

            assert
              .that(() => {
                db.gridfs().unlink();
              })
              .is.throwing('Filename is missing.');
            done();
          });
        });

        test('throws an error if callback is missing', (done) => {
          mongo.db(connectionString, (err, db) => {
            assert.that(err).is.null();

            assert
              .that(() => {
                db.gridfs().unlink(uuid.v4());
              })
              .is.throwing('Callback is missing.');
            done();
          });
        });

        test('unlinks file', (done) => {
          mongo.db(connectionString, (err, db) => {
            const fileName = uuid.v4();
            const content = 'hohoho';

            assert.that(err).is.null();

            const gridfs = db.gridfs();

            gridfs.createWriteStream(fileName, (errCreate, stream) => {
              assert.that(errCreate).is.null();
              stream.on('close', () => {
                gridfs.exist(fileName, (errExist, result) => {
                  assert.that(errExist).is.null();
                  assert.that(result).is.true();

                  gridfs.unlink(fileName, (errUnlink) => {
                    assert.that(errUnlink).is.null();

                    gridfs.exist(fileName, (errExist2, result2) => {
                      assert.that(errExist2).is.null();
                      assert.that(result2).is.false();
                      done();
                    });
                  });
                });
              });
              stream.write(content);
              stream.end();
            });
          });
        });
      });
    });
  });
});

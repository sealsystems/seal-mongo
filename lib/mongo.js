'use strict';

const { GridFSBucket } = require('mongodb');
const { MongoClient } = require('mongodb');
const { parse } = require('mongodb-uri');
const retry = require('retry');

const setTlsOptions = require('./setTlsOptions');

const cachedConnections = {};
const mongo = {};

const assertMongoError = function(error) {
  if (error && error.name === 'MongoError') {
    throw error;
  }
};

const faultTolerantConnect = function(connectionString, options, callback) {
  const operation = retry.operation({
    retries: options.connectionRetries = options.connectionRetries >= 0 ? options.connectionRetries : 10,
    minTimeout: options.waitTimeBetweenRetries || 1 * 1000,
    maxTimeout: options.waitTimeBetweenRetries || 1 * 1000,
    factor: 1
  });

  setTlsOptions(options);

  operation.attempt(() => {
    const mongoOptions = Object.assign({}, options, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
    delete mongoOptions.connectionRetries;
    delete mongoOptions.waitTimeBetweenRetries;
    delete mongoOptions.noCursorTimeout;
    delete mongoOptions.collectionSize;

    MongoClient.connect(connectionString, mongoOptions, (err, client) => {
      if (operation.retry(err)) {
        return;
      }

      /* eslint-disable consistent-return */
      if (err) {
        return callback(operation.mainError());
      }
      /* eslint-enable consistent-return */

      const dbName = parse(connectionString).database;
      console.log('client', client);

      const db = client.db(dbName);

      callback(null, db);
    });
  });
};

mongo.db = function(connectionString, options, callback) {
  if (!connectionString) {
    throw new Error('Connection string is missing.');
  }

  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  if (cachedConnections[connectionString]) {
    return process.nextTick(() => {
      callback(null, cachedConnections[connectionString]);
    });
  }

  faultTolerantConnect(connectionString, options, (errConnect, db) => {
    assertMongoError(errConnect);
    if (errConnect) {
      return callback(errConnect);
    }

    if (db.gridfs) {
      return callback(new Error('Property gridfs already exists.'));
    }

    db.gridfs = function() {
      if (!db.gridfs.cachedfs) {
        db.gridfs.cachedfs = {
          bucket: new GridFSBucket(db),
          findFile(fileName, findFileCallback) {
            const cursor = db.gridfs.cachedfs.bucket.find(
              {
                filename: fileName
              },
              {
                sort: {
                  uploadedDate: -1
                }
              }
            );

            cursor.next((errNext, file) => {
              assertMongoError(errNext);
              cursor.close();
              findFileCallback(errNext, file);
            });
          },
          createReadStream(fileName, readCallback) {
            if (!fileName) {
              throw new Error('Filename is missing.');
            }
            if (!readCallback) {
              throw new Error('Callback is missing.');
            }

            db.gridfs.cachedfs.findFile(fileName, (errFind, file) => {
              if (errFind || !file) {
                return readCallback(new Error('File not found'));
              }

              const readStream = db.gridfs.cachedfs.bucket.openDownloadStreamByName(fileName);

              readStream.on('error', assertMongoError);
              readStream.once('end', () => {
                readStream.removeListener('error', assertMongoError);
              });

              readCallback(null, readStream, file.metadata);
            });
          },
          createWriteStream(fileName, metadata, writeCallback) {
            if (!writeCallback) {
              writeCallback = metadata;
              metadata = undefined;
            }

            if (!fileName) {
              throw new Error('Filename is missing.');
            }
            if (!writeCallback) {
              throw new Error('Callback is missing.');
            }

            const writeStream = db.gridfs.cachedfs.bucket.openUploadStream(fileName, {
              metadata
            });

            writeStream.on('error', assertMongoError);
            writeStream.once('finish', () => {
              writeStream.removeListener('error', assertMongoError);
              writeStream.emit('close');
            });

            writeCallback(null, writeStream);
          },
          setMetadata(fileName, metadata, setMetadataCallback) {
            db.gridfs.cachedfs.findFile(fileName, (errFind, file) => {
              if (errFind || !file) {
                return setMetadataCallback(new Error('File not found.'));
              }
              db.collection('fs.files').updateOne(
                {
                  /* eslint-disable no-underscore-dangle */
                  _id: file._id
                  /* eslint-enable no-underscore-dangle */
                },
                {
                  $set: {
                    metadata
                  }
                },
                {
                  upsert: true
                },
                setMetadataCallback
              );
            });
          },
          exist(fileName, existCallback) {
            if (!fileName) {
              throw new Error('Filename is missing.');
            }
            if (!existCallback) {
              throw new Error('Callback is missing.');
            }

            const cursor = db.gridfs.cachedfs.bucket.find({ filename: fileName });

            cursor.hasNext((errHasNext, resultHasNext) => {
              assertMongoError(errHasNext);
              cursor.close();
              existCallback(errHasNext, resultHasNext);
            });
          },
          unlink(fileName, unlinkCallback) {
            if (!fileName) {
              throw new Error('Filename is missing.');
            }
            if (!unlinkCallback) {
              throw new Error('Callback is missing.');
            }

            db.gridfs.cachedfs.findFile(fileName, (errFind, file) => {
              if (errFind || !file) {
                return unlinkCallback(new Error('File not found'));
              }
              /* eslint-disable no-underscore-dangle */
              db.gridfs.cachedfs.bucket.delete(file._id, (errDel) => {
                /* eslint-enable no-underscore-dangle */
                assertMongoError(errDel);
                unlinkCallback(errDel || null);
              });
            });
          }
        };
      }
      return db.gridfs.cachedfs;
    };

    cachedConnections[connectionString] = db;
    console.log('db', db);
    callback(null, db);
  });
};

module.exports = mongo;

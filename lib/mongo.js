'use strict';

const { GridFSBucket, MongoClient } = require('mongodb');
const { parse } = require('mongodb-uri');
const retry = require('async-retry');

const setTlsOptions = require('./setTlsOptions');

const cachedConnections = {};
const mongo = {};

const faultTolerantConnect = async function(connectionString, options) {
  await setTlsOptions(options);

  const database = await retry(
    async () => {
      const client = await MongoClient.connect(connectionString, options);
      const db = await client.db(parse(connectionString).database);

      return db;
    },
    {
      // eslint-disable-next-line require-atomic-updates
      retries: options.connectionRetries = options.connectionRetries >= 0 ? options.connectionRetries : 10,
      minTimeout: options.waitTimeBetweenRetries || 1 * 1000,
      maxTimeout: options.waitTimeBetweenRetries || 1 * 1000,
      factor: 1
    }
  );

  return database;
};

mongo.db = async function(connectionString, options = {}) {
  if (!connectionString) {
    throw new Error('Connection string is missing.');
  }

  if (cachedConnections[connectionString]) {
    return cachedConnections[connectionString];
  }

  const db = await faultTolerantConnect(connectionString, options);

  if (db.gridfs) {
    throw new Error('Property gridfs already exists.');
  }

  db.gridfs = function() {
    if (!db.gridfs.cachedfs) {
      db.gridfs.cachedfs = {
        bucket: new GridFSBucket(db),

        async findFile(fileName) {
          const cursor = db.gridfs.cachedfs.bucket.find({ filename: fileName });

          let file;

          try {
            file = await cursor.next();
          } finally {
            cursor.close();
          }

          return file;
        },

        async createReadStream(fileName) {
          if (!fileName) {
            throw new Error('Filename is missing.');
          }

          let file;

          try {
            file = await db.gridfs.cachedfs.findFile(fileName);
          } catch (ex) {
            throw new Error('File not found');
          }

          if (!file) {
            throw new Error('File not found');
          }

          const stream = db.gridfs.cachedfs.bucket.openDownloadStreamByName(fileName);

          return { stream, metadata: file.metadata };
        },

        async createWriteStream(fileName, metadata) {
          if (!fileName) {
            throw new Error('Filename is missing.');
          }

          const stream = db.gridfs.cachedfs.bucket.openUploadStream(fileName, {
            metadata
          });

          stream.once('finish', () => {
            stream.emit('close');
          });

          return stream;
        },

        async setMetadata(fileName, metadata) {
          let file;

          try {
            file = await db.gridfs.cachedfs.findFile(fileName);
          } catch (ex) {
            throw new Error('File not found.');
          }

          if (!file) {
            throw new Error('File not found.');
          }

          const result = await db
            .collection('fs.files')
            .updateOne({ _id: file._id }, { $set: { metadata } }, { upsert: true });

          return result;
        },

        async exist(fileName) {
          if (!fileName) {
            throw new Error('Filename is missing.');
          }

          const cursor = db.gridfs.cachedfs.bucket.find({ filename: fileName });

          let resultHasNext;

          try {
            resultHasNext = await cursor.hasNext();
          } finally {
            cursor.close();
          }

          return resultHasNext;
        },

        async unlink(fileName) {
          if (!fileName) {
            throw new Error('Filename is missing.');
          }

          let file;

          try {
            file = await db.gridfs.cachedfs.findFile(fileName);
          } catch (ex) {
            throw new Error('File not found');
          }

          if (!file) {
            throw new Error('File not found');
          }

          await db.gridfs.cachedfs.bucket.delete(file._id);
        }
      };
    }

    return db.gridfs.cachedfs;
  };

  // eslint-disable-next-line require-atomic-updates
  cachedConnections[connectionString] = db;

  return db;
};

module.exports = mongo;

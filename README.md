# seal-mongo

seal-mongo makes it easy to connect to MongoDB reliably.

## Installation

```bash
$ npm install seal-mongo
```

## Quick start

First you need to add a reference to seal-mongo to your application.

```javascript
const mongo = require('seal-mongo');
```

Then you can use its `db` function to connect to a MongoDB server. Provide the connection string and a callback as parameters.

```javascript
mongo.db('mongodb://localhost:27017/mydb', (err, db) => {
  // ...
});
```

If no connection can be established, seal-mongo retries to connect ten times, with a pause of 1 second between two connection attempts.

If you need to pass options to the MongoDB connection, e.g. for setting write concerns, provide an additional `options` object. For details see the [MongoClient.connect documentation](http://mongodb.github.io/node-mongodb-native/api-generated/mongoclient.html#mongoclient-connect).
Additionally the following options can be set:

- `connectionRetries` is the number of retries to connect to MongoDB server, a value of 0 tries to connect only once without retries, default is 10.
- `waitTimeBetweenRetries` is the time in milliseconds waiting between the retries, default is 1000 ms

```javascript
mongo.db('mongodb://localhost:27017/mydb', {
  connectionRetries: 1
  // ...
}, (err, db) => {
  // ...
});
```

Now you can use the `db` object to access the database. Please note that this is the very same object as the one that the [node-mongodb-native driver](http://mongodb.github.io/node-mongodb-native/) provides.

*Please note that if you call `db` twice with the same connection string, both calls will use the same underlying connection.*

## Accessing GridFS

If you need to access GridFS, simply call the `db` object's `gridfs` function.

```javascript
const gridfs = db.gridfs();
```

### gridfs.createReadStream

createReadStream(fileName, callback)

- fileName `String` Name of the file to read
- callback (err, stream, metadata) `Function` Called on error or when stream is ready

Opens the file `fileName` for reading and calls `callback` as soon the file is opened. The callback provides the data of the file as a `Readable` stream as well as its metadata.

```javascript
gridfs.createReadStream('My file.txt', (err, stream, metadata) => {
  if (err) {
    throw err;
  }

  const chunk = stream.read();
  // ...
});
```

### gridfs.createWriteStream

createWriteStream(fileName, metadata, callback)

- fileName `String` Name of the file to write
- metadata `Object` Optional metadata, can be left out
- callback (err, stream) `Function` Called on error or when stream is ready

Opens the file `fileName` for writing and calls `callback` as soon the file is opened. The content of the file can be written with the `Writable` stream provided by the callback. The stream emits a `close` event when all data is written and the file is closed.

**Please note:** The file content is not fully written when the `finish` event occurs. So, do not rely on it.

```javascript
gridfs.createWriteStream('My file.txt', { foo: 'bar' }, (err, stream) => {
  if (err) {
    throw err;
  }

  stream.on('close', (err) => {
    if (err) {
      // Handle error on file close
    }
  });

  stream.write('Hello World');
  stream.end();
});
```

### gridfs.exist

exists(fileName, callback)

- fileName `String` Name of the file to check
- callback (err, doExist) `Function` Called on error or when check finished

Checks if file `fileName` does exist. The callback provides an possible error and a boolean value. If `doExist` is false the file does not exist, otherwise it exists.

```javascript
gridfs.exist('My file.txt', (err, doExist) => {
  if (err) {
    throw err;
  }

  if (doExist) {
    // File does exist
  } else {
    // File does not exist
  }
});
```

### gridfs.unlink

unlink(fileName, callback)

- fileName `String` Name of the file to delete
- callback (err, fileFound) `Function` Called on error or delete finished

Deletes the file `fileName`. The callback provides an error object if the unlink operation fails. Otherwise the `fileFound` indicates whether the file did exist or not.

```javascript
gridfs.unlink('My file.txt', (err, fileFound) => {
  if (err) {
    throw err;
  }

  if (fileFound) {
    // File did exist and has been removed
  } else {
    // File does not exist
  }
});
```

## TLS

The module uses [plossys/seal-tlscert](https://github.com/plossys/seal-tlscert) to obtain certificates for an encrypted connection to the database. The connection will only be encrypted if `TLS_UNPROTECTED` is set to `none` or `loopback`. Otherwise it is assumed that an unencrypted connection is save. If `seal-tlscert` provides a CA certificate, the host's certificate will be transmitted to the database server in order to allow client verification.

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

'''bash
$ bot
'''

# @sealsystems/mongo

[![CircleCI](https://circleci.com/gh/sealsystems/node-mongo.svg?style=svg)](https://circleci.com/gh/sealsystems/node-mongo)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/d24pt7cyplw29xo6?svg=true)](https://ci.appveyor.com/project/Plossys/node-mongo)


@sealsystems/mongo makes it easy to connect to MongoDB reliably.

## Installation

```shell
$ npm install @sealsystems/mongo
```

## Quick start

First you need to add a reference to @sealsystems/mongo to your application:

```javascript
const mongo = require('@sealsystems/mongo');
```

Then you can use its `db` function to connect to a MongoDB server. Provide the connection string as parameter:

```javascript
const db = await mongo.db('mongodb://localhost:27017/mydb');
```

If no connection can be established, @sealsystems/mongo retries to connect ten times, with a pause of 1 second between two connection attempts.

If you need to pass options to the MongoDB connection, e.g. for setting write concerns, provide an additional `options` object. For details see the [MongoClient.connect documentation](http://mongodb.github.io/node-mongodb-native/api-generated/mongoclient.html#mongoclient-connect). Additionally the following options can be set:

- `connectionRetries` is the number of retries to connect to MongoDB server, a value of 0 tries to connect only once without retries, default is 10.
- `waitTimeBetweenRetries` is the time in milliseconds waiting between the retries, default is 1000 ms:

```javascript
const db = await mongo.db('mongodb://localhost:27017/mydb', {
  connectionRetries: 1
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

createReadStream(fileName)

- fileName `String` Name of the file to read

Opens the file `fileName` for reading and returns as soon the file is opened. The functions returns the data of the file as a `Readable` stream as well as its metadata:

```javascript
const { stream, metadata } = await gridfs.createReadStream('My file.txt');

const chunk = stream.read();
```

### gridfs.createWriteStream

createWriteStream(fileName, metadata)

- fileName `String` Name of the file to write
- metadata `Object` Optional metadata, can be left out

Opens the file `fileName` for writing and returns as soon as the file is opened. The content of the file can be written with the `Writable` stream that is returned. The stream emits a `close` event when all data is written and the file is closed.

**Please note:** The file content is not fully written when the `finish` event occurs. So, do not rely on it.

```javascript
const stream = await gridfs.createWriteStream('My file.txt', { foo: 'bar' });

stream.on('close', (err) => {
  if (err) {
    // Handle error on file close
  }
});

stream.write('Hello World');
stream.end();
```

### gridfs.exist

exist(fileName)

- fileName `String` Name of the file to check

Checks if file `fileName` does exist. If the function returns false the file does not exist, otherwise it exists.

```javascript
const doesExist = await gridfs.exist('My file.txt');

if (doesExist) {
  // File does exist
} else {
  // File does not exist
}
```

### gridfs.unlink

unlink(fileName)

- fileName `String` Name of the file to delete

Deletes the file `fileName`. The returned value indicates whether the file did exist or not.

```javascript
const fileFound = await gridfs.unlink('My file.txt');

if (fileFound) {
  // File did exist and has been removed
} else {
  // File does not exist
}
```

## TLS

The module uses [@sealsystems/tlscert](https://github.com/sealsystems/tlscert) to obtain certificates for an encrypted connection to the database. The connection will only be encrypted if `TLS_UNPROTECTED` is set to `none` or `loopback`. Otherwise it is assumed that an unencrypted connection is save. If `@sealsystems/tlscert` provides a CA certificate, the host's certificate will be transmitted to the database server in order to allow client verification.

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```shell
$ bot
```

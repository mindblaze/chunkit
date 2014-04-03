# Chunk It

[![Build Status](https://travis-ci.org/mindblaze/chunkit.png?branch=master)](https://travis-ci.org/mindblaze/chunkit)
[![Dependency Status](https://www.versioneye.com/user/projects/533d32527bae4be0c7000242/badge.png)](https://www.versioneye.com/user/projects/533d32527bae4be0c7000242)
[![NPM version](https://badge.fury.io/js/chunkit.png)](http://badge.fury.io/js/chunkit)

[![NPM stats](https://nodei.co/npm/chunkit.png?downloads=true)](https://www.npmjs.org/package/chunkit)

A simple and light-weight interface to chunk stream data.


## Benefits & Features
* Super fast and super easy to use
* Low memory usage
* Nothing hits the disk
* Tested with filesizes ranging from 256 bytes to 2GB.


## Installation

```
$ npm install chunkit
```


## Example Usage


### Example 1: Using callback for 1MB chunks

```js
var chunkit = require('chunkit'),
    fs = require('fs');

var fStream = fs.CreateReadStream(__dirname + '/video.mp4');
var chunkStream = new chunkit(fStream, {bytes: 1024*1024}, function (err, chunk) {
	if (err) return console.error('Error: ', err);
	
	// Do whatever you want with your 1MB chunk.
	console.log('Bytes: ', chunk.data.length);
	
});
```

### Example 2: Without callback (Evented)

```js
var chunkit = require('chunkit'),
    fs = require('fs');

var fStream = fs.CreateReadStream(__dirname + '/video.mp4');
var chunkStream = new chunkit(fStream, {bytes: 1024*1024});

chunkStream.on('error', function (err) {
	console.log('Error: ', err);
});

chunkStream.on('chunk', function (chunk) {
	console.log('Bytes: ', chunk.data.length);
});

chunkStream.on('end', function (stats) {
	console.log('Stats: ', stats);
});

// Important when no callback provided.
chunkStream.begin();
```

## Options

* **bytes (Integer)** - Parts that are uploaded simultaneously.
* **start (Integer)** (Default: 0) - start chunking stream from byte number.
* **end (Integer)** (Default: end of file) - chunk till byte number.


## Chunk Object

* **index (Integer)** - chunk index, starting from 1
* **data (Buffer)** - Underlying chunked buffer.
* **last (Boolean)** - True if its the last chunk.

## Stats Object

* **bytes (Integer)** - Total bytes chunked.
* **chunks (Integer)** - Total number of chunks.


## History

* v0.0.3 (2014-04-03) -- Fixed a critical issue.
* v0.0.2 (2014-04-03) -- Added new examples and features.
* v0.0.1 (2014-04-03) -- Initial release.


## License

The MIT License (MIT)

Copyright (c) 2014 Talha Asad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
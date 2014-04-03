var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    async = require('async');


function extendObj (a, b) {
  for (var x in b) a[x] = b[x]
  return a;
}
 
function ChunkIt(stream, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = {};
  }
  
  var self = this;
  
  // Lets hook our error event in the start so we can easily emit errors.
  this.on('error', function (e) {
    if (self.failed || self.finished) return;
    self.reading = false;
    self.failed = true;
    
    // Remove our event handlers if any.
    if (self.stream) {
      self.streamErrorHandler && self.stream.removeListener('error', self.streamErrorHandler);
      self.streamDataHandler && self.stream.removeListener('data', self.streamDataHandler);
      self.streamEndHandler && self.stream.removeListener('end', self.streamEndHandler);
    }
    
    self.cb && self.cb(e);
    // prevent any further callbacks
    self.cb = null;
  });
  
  var defaultOptions = {
     bytes: 1024,         // byte size of each chunk.
     start: 0,            // start chunking after this byte.
     end: -1              // stop chunking after this byte
  }
  
  options = extendObj(defaultOptions, options);
  this.options = options;
  
  this.stream = stream;
  
  // States
  this.initiated = false;
  this.failed = false;
  this.reading = false;
  this.finished = false;
  
  // Stats
  this.stats = {totalBytes: 0, chunks: 0};
   
  // Chunking and buffering
  this.buffer = new Buffer(0);
  this.chunks = [];
  
  this.cb = cb;
   
  // Pause the stream until we hook our events.
  if (stream) stream.pause();
  else this.emit('error', new Error('You must provide a readable stream.'));
  
  // if callback provided then begin, else wait for call to begin.
  cb && this.begin();
  return this;
}

util.inherits(ChunkIt, EventEmitter);

ChunkIt.prototype.begin = function() {
  if (this.initiated || this.finished) return;
  
  var self = this;
  
  this.streamErrorHandler = function (err) {
    self.emit('error', err);
  }
  
  this.streamDataHandler = function (chunk) {
    self.reading = true;
    if (typeof chunk === 'string') chunk = new Buffer(chunk, 'utf-8');
    self.stats.totalBytes += chunk.length;
    self.buffer = Buffer.concat([self.buffer, chunk]);
    if (self.buffer.length >= self.options.bytes) {
      self.stream.pause();
      self.flushChunk(function (e) {
        if (e) return self.emit('error', e);
        self.stream.resume();
      });
    }
  }
  
  this.streamEndHandler = function () {
    self.reading = false;
    self.flushChunk(true, function (e) {
      if (e) return self.emit('error', e);
      self.finished = true;
      self.cb && self.cb(null, self.stats);
      self.emit('end', self.stats);
    });
  }
  
  self.initiated = true;
  self.stream.on('error', self.streamErrorHandler);
  self.stream.on('data', self.streamDataHandler);
  self.stream.on('end', self.streamEndHandler);
  self.stream.resume();
}

ChunkIt.prototype.flushChunk = function(last, cb) {
  if (!this.initiated) return;
  if (typeof last == 'function') {
    cb = last;
    last = false;
  }
  
  var self = this;
  
  var newChunks = [],
      newChunk = null;
  while (this.buffer.length >= this.options.bytes) {
    if (this.buffer.length > this.options.bytes) {
      newChunk = this.buffer.slice(0, this.options.bytes);
      this.buffer = new Buffer(this.buffer.slice(this.options.bytes));
      newChunk.last = false;
    } else {
      newChunk = this.buffer.slice(0, this.options.bytes);
      this.buffer = this.buffer.slice(this.options.bytes);
      newChunk.last = last;
    }
    newChunk.index = ++this.stats.chunks;
    newChunks.push(newChunk);
  }
  
  // Last chunk
  if (last && this.buffer.length) {
    newChunk = this.buffer.slice(0, this.options.bytes);
    this.buffer = this.buffer.slice(this.options.bytes);
    newChunk.index = ++this.stats.chunks;
    newChunk.last = true;
    newChunks.push(newChunk);
  }
    
  async.eachSeries(newChunks, function (newChunk, next) {
    self.cb && self.cb(null, newChunk);
    self.emit('chunk', newChunk);
    next();
  }, function (e) {
    if (e) return self.emit('error', e);
    cb();
  });
}

module.exports = ChunkIt;
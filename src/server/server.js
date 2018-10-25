const debug = require('debug')('server');
const errors = require('debug')('server:error');
const express = require('express');
const SqliteTimekeeper = require('./sqliteTimekeeper');

module.exports = class Server {
  constructor(opts) {
    this.timekeeper = opts.timekeeper
      || new SqliteTimekeeper(opts.sqliteTimekeeper || {});
  }

  async setup() {
    return this.timekeeper.setup().
      then(timekeeper => this);
  }
};

'use strict';

const fs = require('fs')
const util = require('util');
const readFile = util.promisify(fs.readFile);

module.exports = class CurtainConfig {

  constructor(configFileName = 'curtain-server-conf.json') {
    this.configFileName = configFileName;
  }

  async load(configFileName = 'curtain-server-conf.json') {
    const data = await readFile(this.configFileName);
    this.data = JSON.parse(data);
  }

  get() {
    return this.data;
  }
}

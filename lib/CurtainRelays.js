'use strict';

const ewelink = require('ewelink-api');
const ZeroConf = require('ewelink-api/classes/Zeroconf');
const Limiter = require('async-limiter')

module.exports = class CurtainRelays {

  constructor(username, password, ip) {
    this.username = username;
    this.password = password;
    this.ip = ip;
  }

  async init(bootstrap = true, deviceIds) {
    if (bootstrap) {
      // save device cache
      const bootstrapConnection = new ewelink({
        email: this.username,
        password: this.password,
        region: 'us',
      });
      await bootstrapConnection.saveDevicesCache();
      // save ARP table
      await ZeroConf.saveArpTable({"ip": this.ip});
    }
    // create connection
    const devicesCache = await ZeroConf.loadCachedDevices();
    const arpTable = await ZeroConf.loadArpTable();
    const connection = new ewelink({devicesCache, arpTable});
    this.connection = connection;
    // create per-device subscriber
    const queue = new Limiter({concurrency: 1})
    this.queue = queue;
  }

  async set(deviceId, stateByChannel) {
    this.queue.push(async (cb) => {
        await this.connection.setMultiChannelDevicePowerState(
          deviceId, stateByChannel);
        cb();
    });
  }
}

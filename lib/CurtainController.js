'use strict';

const State = require('./CurtainState')

const delay = time => new Promise(res => setTimeout(res,time));

module.exports = class CurtainController {

  constructor(config, relays) {
    this.config = config.get();
    this.relays = relays;
    this.initialized = false;
  }

  async moveUp(curtain) {
    if (!this.initialized) throw "call init() first";
    await this.withCurtain(curtain, async (deviceId, sw1, sw2, tripTime) => {
      var state = {};
      state[sw1] = 'on';
      state[sw2] = 'off';
      await this.relays.set(deviceId, state);
    });
    this.states[curtain].moveUp();
  }

  async moveDown(curtain) {
    if (!this.initialized) throw "call init() first";
    await this.withCurtain(curtain, async (deviceId, sw1, sw2, tripTime) => {
      var state = {};
      state[sw1] = 'off';
      state[sw2] = 'on';
      await this.relays.set(deviceId, state);
    });
    this.states[curtain].moveDown();
  }

  async stop(curtain) {
    if (!this.initialized) throw "call init() first";
    await this.withCurtain(curtain, async (deviceId, sw1, sw2, tripTime) => {
      var state = {};
      state[sw1] = 'on';
      state[sw2] = 'on';
      await this.relays.set(deviceId, state);
    });
    this.states[curtain].stop();
  }

  async init() {
    const curtains = Object.keys(this.config.curtains)
    const resets = curtains
      .map(curtain => this.reset(curtain));
    await Promise.all(resets);
    this.states = {};
    for (const curtain in this.config.curtains) {
      const tripTime = this.config.curtains[curtain].tripTimeInMs;
      const state = new State(curtain, 0, tripTime)
      this.states[curtain] = state;
      this.states[curtain].startPolling();
    }
    this.initialized = true;
  }

  async reset(curtain) {
    await this.withCurtain(curtain, async (deviceId, sw1, sw2, tripTime) => {
      var state = {};
      state[sw1] = 'off';
      state[sw2] = 'on';
      await this.relays.set(deviceId, state);
      await delay(tripTime + 1000);
    });
  }

  async withCurtain(curtain, fn) {
    if (!(curtain in this.config.curtains)) {
      throw "cannot find config for curtain: " + curtain;
    }
    const sw1 = parseInt(this.config.curtains[curtain].channelForSw1);
    const sw2 = parseInt(this.config.curtains[curtain].channelForSw2);
    const deviceId = this.config.curtains[curtain].ewelinkDeviceId;
    const tripTime = this.config.curtains[curtain].tripTimeInMs;
    return await fn(deviceId, sw1, sw2, tripTime);
  };
};

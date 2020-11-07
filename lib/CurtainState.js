'use strict'

const pino = require('pino');
const logger = pino({
  prettyPrint: {
    colorize: true,
    translateTime: 'SYS:standard'
  }
});

module.exports = class CurtainState {

  constructor(name, initialState, tripTimeInMs) {
    this.name = name;
    this.state = initialState;
    this.tripTimeInMs = tripTimeInMs;
    logger.info(`curtain ${name} initialized with state ${initialState}`);
  }

  startPolling() {
    this.pollHandle = setInterval(() => {
      this.computeState();
    }, 100); // poll every 100 ms
  }

  stopPolling() {
    if (this.pollHandle != null) {
      this.pollHandle.clearTimeout();
    }
  }

  moveUp() {
    this.setAction('up');
  }

  moveDown() {
    this.setAction('down');
  }

  stop() {
    this.clearAction();
  }

  getState() {
    return this.state;
  }

  setAction(action) {
    if (this.pollHandle != null) {
      this.action = action;
      this.actionTimeInMs = this.getTimeInMs();
      this.prevState = this.state;
    }
  }

  clearAction() {
    this.action = null;
    this.actionTimeInMs = null;
    this.prevState = null;
  }

  getTimeInMs() {
    const ts = process.hrtime();
    return ts[0] * 1000 + ts[1] / 1000000;
  }

  computeState() {
    if (this.pollHandle != null && this.action != null) {
      const travelTimeInMs = this.getTimeInMs() - this.actionTimeInMs;
      const delta = Math.round(100 * (travelTimeInMs * 1.0 / this.tripTimeInMs));
      switch (this.action) {
        case 'up':
          this.state = Math.min(this.prevState + delta, 100);
          if (this.state === 100) this.clearAction();
          break;
        case 'down':
          this.state = Math.max(this.prevState - delta, 0);
          if (this.state === 0) this.clearAction();
          break;
      }
      logger.info(`state of curtain ${this.name} state updated to ${this.state}`);
    }
  }
}

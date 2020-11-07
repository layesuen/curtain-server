const http = require('http');
const Relays = require('./lib/CurtainRelays')
const Config = require('./lib/CurtainConfig')
const Controller = require('./lib/CurtainController')

const hostname = '127.0.0.1';
const port = 13000;

const pino = require('pino');
const logger = pino({
  prettyPrint: {
    colorize: true,
    translateTime: 'SYS:standard'
  }
});


(async function() {

  // load config
  const config = new Config();
  await config.load();

  // initialize relays
  const relays = new Relays(
    config.get().ewelinkUser,
    config.get().ewelinkPassword,
    config.get().networkInterface
  );
  const deviceIds = Object.values(config.get().curtains)
    .map(x => x.ewelinkDeviceId);
  await relays.init(true, Array.from(new Set(deviceIds)));

  // initialize controller
  const controller = new Controller(config, relays);
  await controller.init();

  // start HTTP server
  const server = http.createServer(async (req, res) => {
    try {
      const path = req.url.split(/\//);
      const curtain = path[1];
      const action = path[2];
      logger.info('receive request ' + curtain + ": " + action);
      // check action
      if (action !== 'up' && action !== 'down' && action !== 'stop') {
        throw 'invalid action on ' + curtain + ': ' + action;
      }
      // dispatch
      switch (action) {
        case 'up':
          controller.moveUp(curtain);
          break;
        case 'down':
          controller.moveDown(curtain);
          break;
        case 'stop':
          controller.stop(curtain);
          break;
      }
      res.statusCode = 200;
      res.end();
    }
    catch (exception) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end("error");
      logger.error(exception);
    }
  })

  server.listen(port, hostname, () => {
    logger.info(`Curtain server running at http://${hostname}:${port}/`);
  })
})()


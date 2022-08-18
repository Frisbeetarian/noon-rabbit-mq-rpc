const amqp = require('amqp-connection-manager');
const uuid = require('uuid');
class RPCEntity {
    constructor(options) {
        const { connectionObject, hostId } = options;
        this.connectionObject = connectionObject;
        this.hostId = hostId || uuid.v4();
        this.connected = false;
    }
    async start() {
        this.connection = amqp.connect(this.connectionObject);
        this.connection.on('connect', () => {
            console.log('Connected!');
            this.connected = true;
        });
        this.connection.on('disconnect', (err) => {
            console.log('Disconnected.', err.stack);
            this.connected = false;
        });
    }
}
module.exports = RPCEntity;
//# sourceMappingURL=RPCEntity.js.map
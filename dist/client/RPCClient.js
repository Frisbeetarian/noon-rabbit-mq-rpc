const RPCEntity = require('../lib/RPCEntity');
const uuid = require('uuid');
class RPCClient extends RPCEntity {
    constructor(options) {
        const { ...entityOptions } = options;
        super(entityOptions);
        this.channels = new Map();
        this.requests = new Map();
    }
    async start() {
        super.start();
    }
    async addChannel(channel) {
        if (!this.connection) {
            await this.start();
        }
        if (!this.channels.has(channel.name)) {
            const amqChannel = {
                name: channel.name,
                queue: channel.queue,
                responseQueue: `${channel.queue}.${this.hostId}`,
            };
            amqChannel.channel = await this.connection.createChannel({
                setup: async (chan) => {
                    await chan.assertQueue(channel.queue, { durable: false });
                    await chan.prefetch(1);
                    await chan.assertQueue(amqChannel.responseQueue, { exclusive: true });
                    await chan.consume(amqChannel.responseQueue, this.maybeAnswer.bind(this, chan));
                },
            });
            this.channels.set(channel.name, amqChannel);
        }
        return this.channels.get(channel.name);
    }
    async rpcRequest(channel, task, params) {
        if (!this.channels.has(channel)) {
            throw new Error('Invalid Channel, add it first');
        }
        const { channel: ch, queue, responseQueue } = this.channels.get(channel);
        return new Promise((resolve, reject) => {
            const corrId = uuid.v4();
            this.requests.set(corrId, {
                resolve,
                reject,
            });
            ch.sendToQueue(queue, Buffer.from(JSON.stringify([task, params])), {
                correlationId: corrId,
                replyTo: responseQueue,
            });
        });
    }
    maybeAnswer(ch, msg) {
        const req = this.requests.get(msg.properties.correlationId);
        if (req) {
            ch.ack(msg);
            const response = JSON.parse(msg.content);
            console.log('maybe answer in client : ' + JSON.stringify(response));
            if (response.error) {
                req.reject(response.error);
            }
            else {
                req.resolve(response[0]);
            }
        }
    }
}
module.exports = RPCClient;
//# sourceMappingURL=RPCClient.js.map
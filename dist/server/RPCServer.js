const RPCEntity = require("../lib/RPCEntity");
class RPCServer extends RPCEntity {
    constructor(options) {
        const { handleMessage, queue, ...entityOptions } = options;
        super(entityOptions);
        this.handleMessage = handleMessage;
        this.queue = queue;
    }
    async start() {
        super.start();
        await this.startChannel();
        await this.channel.waitForConnect();
    }
    async startChannel() {
        if (this.channel) {
            return this.channel;
        }
        this.channel = await this.connection.createChannel({
            setup: async (ch) => {
                await ch.assertQueue(this.queue, { durable: false });
                await ch.prefetch(1);
                await ch.consume(this.queue, RPCServer.reply.bind(this, ch, this.handleMessage));
            },
        });
    }
    static async reply(ch, handleMessage, msg) {
        const [task, params] = JSON.parse(msg.content);
        try {
            const response = await handleMessage(task, params);
            ch.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify([response])), { correlationId: msg.properties.correlationId });
        }
        catch (err) {
            ch.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify({ error: err.message })), { correlationId: msg.properties.correlationId });
        }
        ch.ack(msg);
    }
}
module.exports = RPCServer;
//# sourceMappingURL=RPCServer.js.map
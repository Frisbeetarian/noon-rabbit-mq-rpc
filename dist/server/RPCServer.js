"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RPCEntity_1 = __importDefault(require("../lib/RPCEntity"));
class RPCServer extends RPCEntity_1.default {
    constructor(options) {
        const { handleMessage, queue, ...entityOptions } = options;
        super(entityOptions);
        this.handleMessage = handleMessage;
        this.queue = queue;
    }
    async start() {
        await super.start();
        await this.startChannel();
        await this.channel.waitForConnect();
    }
    async startChannel() {
        if (this.channel) {
            return this.channel;
        }
        this.channel = this.connection.createChannel({
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
exports.default = RPCServer;
//# sourceMappingURL=RPCServer.js.map
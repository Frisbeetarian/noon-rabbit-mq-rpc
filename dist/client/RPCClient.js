"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RPCEntity_1 = __importDefault(require("../lib/RPCEntity"));
const uuid = __importStar(require("uuid"));
class RPCClient extends RPCEntity_1.default {
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
                channel: channel,
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
            throw new Error("Invalid channel");
        }
        const { channel: ch, queue, responseQueue } = this.channels.get(channel);
        return new Promise((resolve, reject) => {
            const corrId = uuid.v4();
            this.requests.set(corrId, {
                resolve,
                reject,
            });
            console.log("QUEUE NAME IN RPC:", queue);
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
            if (response.error) {
                req.reject(response.error);
            }
            else {
                req.resolve(response[0]);
            }
        }
    }
}
exports.default = RPCClient;
//# sourceMappingURL=RPCClient.js.map
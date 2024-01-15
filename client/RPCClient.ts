import RPCEntityInClient from "../lib/RPCEntity";

import * as uuid from "uuid";
// import { ChannelWrapper } from "amqp-connection-manager";

class RPCClient extends RPCEntityInClient {
  private channels: Map<any, any>;
  private requests: Map<any, any>;
  constructor(options: { [x: string]: any }) {
    const { ...entityOptions } = options;

    super(entityOptions);
    this.channels = new Map();
    this.requests = new Map();
  }

  async start() {
    super.start();
  }

  async addChannel(channel: { name: any; queue: any }) {
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
        setup: async (chan: {
          assertQueue: (
            arg0: string,
            arg1: { durable?: boolean; exclusive?: boolean },
          ) => any;
          prefetch: (arg0: number) => any;
          consume: (arg0: string, arg1: any) => any;
        }) => {
          await chan.assertQueue(channel.queue, { durable: false });
          await chan.prefetch(1);
          await chan.assertQueue(amqChannel.responseQueue, { exclusive: true });
          await chan.consume(
            amqChannel.responseQueue,
            this.maybeAnswer.bind(this, chan),
          );
        },
      });
      this.channels.set(channel.name, amqChannel);
    }
    return this.channels.get(channel.name);
  }

  async rpcRequest(channel: any, task: any, params: any) {
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

  maybeAnswer(
    ch: { ack: (arg0: any) => void },
    msg: { properties: { correlationId: any }; content: string },
  ) {
    const req = this.requests.get(msg.properties.correlationId);
    if (req) {
      ch.ack(msg);
      const response = JSON.parse(msg.content);
      // console.log("maybe answer in client : " + JSON.stringify(response));
      if (response.error) {
        req.reject(response.error);
      } else {
        req.resolve(response[0]);
      }
    }
  }
}

export default RPCClient;

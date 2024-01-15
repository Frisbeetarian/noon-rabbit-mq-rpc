import RPCEntityInServer from "../lib/RPCEntity";

class RPCServer extends RPCEntityInServer {
  private handleMessage: any;
  private queue: any;
  private channel: any;

  constructor(options: { [x: string]: any; handleMessage: any; queue: any }) {
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
      setup: async (ch: {
        assertQueue: (arg0: any, arg1: { durable: boolean }) => any;
        prefetch: (arg0: number) => any;
        consume: (arg0: any, arg1: any) => any;
      }) => {
        await ch.assertQueue(this.queue, { durable: false });
        await ch.prefetch(1);
        await ch.consume(
          this.queue,
          RPCServer.reply.bind(this, ch, this.handleMessage)
        );
      },
    });
  }

  static async reply(
    ch: {
      sendToQueue: (
        arg0: any,
        arg1: Buffer,
        arg2: { correlationId: any }
      ) => void;
      ack: (arg0: any) => void;
    },
    handleMessage: (arg0: any, arg1: any) => any,
    msg: { content: string; properties: { replyTo: any; correlationId: any } }
  ) {
    // console.log("maybe answer in server : " + JSON.parse(msg.content));

    const [task, params] = JSON.parse(msg.content);
    try {
      const response = await handleMessage(task, params);
      ch.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify([response])),
        { correlationId: msg.properties.correlationId }
      );
    } catch (err) {
      ch.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({ error: err.message })),
        { correlationId: msg.properties.correlationId }
      );
    }
    ch.ack(msg);
  }
}

export default RPCServer;

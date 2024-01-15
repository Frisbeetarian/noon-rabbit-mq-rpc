// @ts-ignore
import amqp from "amqp-connection-manager";

class RPCEntity {
  private connectionObject: any;
  // @ts-ignore
  protected hostId: any;
  // @ts-ignore
  private connected: boolean;
  protected connection: any;

  constructor(
    options: Omit<
      { [p: string]: any; handleMessage: any; queue: any },
      "queue" | "handleMessage"
    >,
  ) {
    const { connectionObject, hostId } = options;

    this.connectionObject = connectionObject;
    this.hostId = hostId || "localhost";
    this.connected = false;
  }
  async start() {
    this.connection = amqp.connect(this.connectionObject);
    this.connection.on("connect", () => {
      console.log("Connected!");
      this.connected = true;
    });
    this.connection.on("disconnect", (err: { stack: any }) => {
      console.log("Disconnected.", err.stack);
      this.connected = false;
    });
  }
}

export default RPCEntity;

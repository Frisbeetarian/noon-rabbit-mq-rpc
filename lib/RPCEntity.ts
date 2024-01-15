// @ts-ignore
import { IAmqpConnectionManager } from "amqp-connection-manager/dist/esm/AmqpConnectionManager";

import amqp from "amqp-connection-manager";
// import uuid from "uuid";/
import * as uuid from "uuid";

class RPCEntity {
  private connectionObject: any;
  // @ts-ignore
  protected hostId: any;
  // @ts-ignore
  private connected: boolean;
  protected connection: IAmqpConnectionManager;

  constructor(
    options: Omit<
      { [p: string]: any; handleMessage: any; queue: any },
      "queue" | "handleMessage"
    >,
  ) {
    const { connectionObject, hostId } = options;

    this.connectionObject = connectionObject;
    this.hostId = hostId || uuid.v4();
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

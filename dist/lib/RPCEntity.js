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
const amqp_connection_manager_1 = __importDefault(require("amqp-connection-manager"));
const uuid = __importStar(require("uuid"));
class RPCEntity {
    constructor(options) {
        const { connectionObject, hostId } = options;
        this.connectionObject = connectionObject;
        this.hostId = hostId || uuid.v4();
        this.connected = false;
    }
    async start() {
        this.connection = amqp_connection_manager_1.default.connect(this.connectionObject);
        this.connection.on("connect", () => {
            console.log("Connected!");
            this.connected = true;
        });
        this.connection.on("disconnect", (err) => {
            console.log("Disconnected.", err.stack);
            this.connected = false;
        });
    }
}
exports.default = RPCEntity;
//# sourceMappingURL=RPCEntity.js.map
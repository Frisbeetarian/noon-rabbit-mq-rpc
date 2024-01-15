"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCServer = exports.RPCClient = void 0;
const RPCClient_1 = __importDefault(require("./client/RPCClient"));
exports.RPCClient = RPCClient_1.default;
const RPCServer_1 = __importDefault(require("./server/RPCServer"));
exports.RPCServer = RPCServer_1.default;
//# sourceMappingURL=index.js.map
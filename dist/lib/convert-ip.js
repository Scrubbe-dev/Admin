"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ip_address_1 = require("ip-address");
var address = new ip_address_1.Address6('2001:0:ce49:7601:e866:efff:62c3:fffe');
var teredo = address.inspectTeredo();
teredo.client4; // '157.60.0.1'

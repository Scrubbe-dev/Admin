"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthProviders = void 0;
var OAuthProviders;
(function (OAuthProviders) {
    OAuthProviders[OAuthProviders["GOOGLE"] = 0] = "GOOGLE";
    OAuthProviders[OAuthProviders["AWS"] = 1] = "AWS";
    OAuthProviders[OAuthProviders["GITHUB"] = 2] = "GITHUB";
    // FIREFOX,
    OAuthProviders[OAuthProviders["GITLAB"] = 3] = "GITLAB";
    OAuthProviders[OAuthProviders["AZURE"] = 4] = "AZURE";
})(OAuthProviders || (exports.OAuthProviders = OAuthProviders = {}));

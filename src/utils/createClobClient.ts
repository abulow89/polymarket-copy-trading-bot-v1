"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { ethers } = require("ethers");
const { ClobClient } = require("@polymarket/clob-client");
const { SignatureType } = require("@polymarket/order-utils");
const { ENV } = require("../config/env");

const PROXY_WALLET = ENV.PROXY_WALLET;
const PRIVATE_KEY = ENV.PRIVATE_KEY;
const CLOB_HTTP_URL = ENV.CLOB_HTTP_URL;

const createClobClient = async () => {
    const chainId = 137;
    const host = CLOB_HTTP_URL;

    const wallet = new ethers.Wallet(PRIVATE_KEY);

    // Create client WITHOUT creds first (needed to derive API key)
    let clobClient = new ClobClient(
        host,
        chainId,
        wallet,
        undefined,
        SignatureType.POLY_GNOSIS_SAFE,
        PROXY_WALLET
    );

    // Silence noisy SDK errors during key creation
    const originalConsoleError = console.error;
    console.error = () => {};

    let creds = await clobClient.createApiKey().catch(() => null);

    console.error = originalConsoleError;

    if (!creds || !creds.key) {
        creds = await clobClient.deriveApiKey();
    }

    // Mask secrets in console
    const mask = (str) =>
        str ? str.slice(0, 4) + "*".repeat(Math.max(0, str.length - 8)) + str.slice(-4) : undefined;

    console.log("API Key derived", {
        key: mask(creds.key),
        secret: mask(creds.secret),
        passphrase: mask(creds.passphrase),
    });

    // Recreate client WITH creds
    clobClient = new ClobClient(
        host,
        chainId,
        wallet,
        creds,
        SignatureType.POLY_GNOSIS_SAFE,
        PROXY_WALLET
    );

    return clobClient;
};

exports.default = createClobClient;

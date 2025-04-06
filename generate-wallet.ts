const { Wallet } = require("ethers");

const wallet = Wallet.createRandom();

console.log("New Wallet Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
# ethereumdevio-dex-tutorial

Tutorial to build upon Ethereum DEXes

Summary: 
* [Part 1: Get the rates with a DEX aggregator](https://ethereumdev.io/trading-and-arbitrage-on-ethereum-dex-get-the-rates-part-1/)

Quick and dirty build:

You'll need node.js installed and a way to access the blockchain in order to make web3 RPC calls.  I set up a free Infura account for this purpose: (https://mainnet.infura.io/v3/b173657a332241d192ae1d1588efde68)

To compile: From the head of the repo, cd to part1, type "npm install".  When the installation is completed, cd to part2, type "npm install".  Voila!

[04/08/2021]  I've added trader.js in place of index.js.  The new file is better annotated and also uses environment variables to specify wallet address and private key:

export MY_ACCT_ADDR=0x....
export MY_PRIV_KEY=0x....

node trader.js

So far, I've been able to verify that we can access our wallet, get approval for onesplit contract to buy DAI token on our behalf, get a quote on 1inch with getExpectedReturn to swap Eth to DAI, but the actual transaction with the swap call didn't go through.  I suspect that my arguments to onesplitContract.methods.swap(...) are not kosher, and the transaction gets reverted.  I'll take another look at it when the effect of my COVID vaccine wears off.

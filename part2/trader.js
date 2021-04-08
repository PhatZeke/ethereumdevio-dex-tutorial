/* @file trader.js
 * @author C. Yeh
 * @note Created 04/04/2021
 * A simple trading function for 1inch dex
 */

// Needed for Ethereum 
var Tx = require('ethereumjs-tx');
var Web3 = require('web3');
const BigNumber = require('bignumber.js');

// Needed for 1inch
const oneSplitABI = require('./abis/onesplit.json');
const onesplitAddress = "0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E";

// Needed for ERC20 and DAI
const erc20ABI = require('./abis/erc20.json');
const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
const ethAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// User's wallet address
const myAddress = process.env.MY_ACCT_ADDR;
const myPrivKey = process.env.MY_PRIV_KEY;
console.log(myAddress);
console.log(myPrivKey);


// Using DAI to Eth as example, can be replaced by other ERC20 tokens
const fromToken = ethAddress;
const fromTokenDecimals = 18;

// Ethereum address
const toToken = daiAddress;
const toTokenDecimals = 18;

// Trading Eth for 10 DAI
const amountToExchange = new BigNumber(0.001);

// Initializing web3
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/b173657a332241d192ae1d1588efde68', { timeout: 20000000 }));
web3.eth.accounts.wallet.add({privateKey: myPrivKey, address: myAddress});

const onesplitContract = new web3.eth.Contract(oneSplitABI, onesplitAddress);
const daiToken = new web3.eth.Contract(erc20ABI, daiAddress);

web3.eth.defaultAccount = myAddress;

const oneSplitDexes = [
  "Uniswap",
  "Kyber",
  "Bancor",
  "Oasis",
  "Curve Compound",
  "Curve USDT",
  "Curve Y",
  "Curve Binance",
  "Curve Synthetix",
  "Uniswap Compound",
  "Uniswap CHAI",
  "Uniswap Aave",
  "Mooniswap",
  "Uniswap V2",
  "Uniswap V2 ETH",
  "Uniswap V2 DAI",
  "Uniswap V2 USDC",
  "Curve Pax",
  "Curve renBTC",
  "Curve tBTC",
  "Dforce XSwap",
  "Shell",
  "mStable mUSD"
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitTransaction(txHash) {
    let tx = null;
    while (tx == null) {
        tx = await web3.eth.getTransactionReceipt(txHash);
        await sleep(2000);
    }
    console.log("Transaction " + txHash + " was mined.");
    return (tx.status);
}

function approveToken(tokenInstance, receiver, amount, callback) {
    tokenInstance.methods.approve(receiver, amount).send({ from: myAddress, gas: 100000 }, async function(error, txHash) {
        if (error) {
            console.log("ERC20 could not be approved", error);
            return;
        }
        console.log("ERC20 token approved to " + receiver);
        const status = await waitTransaction(txHash);
        if (!status) {
            console.log("Approval transaction failed.");
            return;
        }
        callback();
    })
}

async function getQuote(fromToken, toToken, amount, callback) {
    let quote = null;
    try {
        quote = await onesplitContract.methods.getExpectedReturn(fromToken, toToken, amount, 100, 0).call();
    } catch (error) {
        console.log('Impossible to get the quote', error);
    }
    console.log("Trade From: " + fromToken);
    console.log("Trade To: " + toToken);
    console.log("Trade Amount: " + amountToExchange);
    console.log(new BigNumber(quote.returnAmount).shiftedBy(-fromTokenDecimals).toString());
    console.log("Using Dexes:");
    for (let index = 0; index < quote.distribution.length; index++) {
        console.log(oneSplitDexes[index] + ": " + quote.distribution[index] + "%");
    }
    callback(quote);
}

let amountWithDecimals = new BigNumber(amountToExchange).shiftedBy(fromTokenDecimals).toFixed()

getQuote(fromToken, toToken, amountWithDecimals, function(quote) {
    approveToken(daiToken, onesplitAddress, amountWithDecimals, async function() {
        // We get the balance before the swap just for logging purpose
        let ethBalanceBefore = await web3.eth.getBalance(myAddress);
        let daiBalanceBefore = await daiToken.methods.balanceOf(myAddress).call();
        onesplitContract.methods.swap(fromToken, toToken, amountWithDecimals, quote.returnAmount, quote.distribution, 0).send({ from: myAddress, gas: 100000 }, async function(error, txHash) {
            if (error) {
                console.log("Could not complete the swap", error);
                return;
            }
            const status = await waitTransaction(txHash);
            // We check the final balances after the swap for logging purpose
            let ethBalanceAfter = await web3.eth.getBalance(myAddress);
            let daiBalanceAfter = await daiToken.methods.balanceOf(myAddress).call();
            console.log("Final balances:")
            console.log("Change in ETH balance", new BigNumber(ethBalanceAfter).minus(ethBalanceBefore).shiftedBy(-fromTokenDecimals).toFixed(2));
            console.log("Change in DAI balance", new BigNumber(daiBalanceAfter).minus(daiBalanceBefore).shiftedBy(-fromTokenDecimals).toFixed(2));
        });
    });
});

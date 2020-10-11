const Accountability = require('../../services/Accountability');
const accountability = new Accountability();

/* GET acounts listing. */
module.exports = async function(req, res) {
    const transactionRes = req.blockchainRes;

    let newTransactionSet = [];
    if (transactionRes.transactions && transactionRes.transactions.length > 0) {
        const transactionSet = transactionRes.transactions.map(val => val.lifecycle);
        // newTransactionSet = transactionSet.filter(trx => trx.transaction_status === "executed" && trx.pub_keys);
        newTransactionSet = transactionSet;

        await Promise.all(newTransactionSet.map(getAuth));
    }

    const retObj = req.addBlockchainRes(newTransactionSet);
    res.send(retObj);
};

// adds 'auth' property to the tx based on the signing key
async function getAuth(trx, index, transactionArray) {
    // TODO should check ALL public keys, not only first one
    const pubKey = trx.pub_keys[0];
    const blockNum = trx.execution_trace.action_traces[0].block_num;

    if (!pubKey) throw new Error("No public key found on trx" + trx.id);

    try {
        const keyRes = await accountability.dfuseClient.stateKeyAccounts(pubKey, { block_num: blockNum });
        if (!keyRes || !keyRes.account_names) throw new Error(`Accounts for public key ${pubKey} could not be found at block height ${blockNum}`)
        trx.account_authorizers = keyRes.account_names;

        // Get the common name as well
    } catch (err) {
        console.error(err)
    }
}
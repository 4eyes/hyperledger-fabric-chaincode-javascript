/*
# Copyright 4eyes GmbH All Rights Reserved.
#
# Based on the fabcar example
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const shim = require('fabric-shim');

let Example = class {

    // The Init method is called when the Smart Contract 'example' is instantiated by the blockchain network
    // Best practice is to have any Ledger initialization in separate function -- see initLedger()
    async Init(stub) {
        console.info('=========== Instantiated example chaincode ===========');
        return shim.success();
    }

    // The Invoke method is called as a result of an application request to run the Smart Contract
    // 'example'. The calling application program has also specified the particular smart contract
    // function to be called, with arguments
    async Invoke(stub) {
        let ret = stub.getFunctionAndParameters();
        console.info(ret);
        console.info(this);
        console.info(ret.fcn);
        let method = this[ret.fcn];
        if (!method) {
            console.error('no function of name:' + ret.fcn + ' found');
            throw new Error('Received unknown function ' + ret.fcn + ' invocation');
        }
        try {
            let payload = await method(stub, ret.params);
            return shim.success(payload);
        } catch (err) {
            console.log(err);
            return shim.error(err);
        }
    }

    async initLedger(stub, args) {
        console.info('============= START : Initialize Ledger ===========');
        let examples = [];
        examples.push({
            name: 'Example 0',
            value: '100'
        });
        examples.push({
            name: 'Example 1',
            value: '200'
        });

        for (let i = 0; i < examples.length; i++) {
            examples[i].docType = 'example';
            await stub.putState('EXAMPLE' + i, Buffer.from(JSON.stringify(examples[i])));
            console.info('Added <--> ', examples[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryAll(stub, args) {

        let startKey = 'EXAMPLE0';
        let endKey = 'EXAMPLE9';

        let iterator = await stub.getStateByRange(startKey, endKey);

        let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));

                jsonRes.Key = res.value.key;
                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return Buffer.from(JSON.stringify(allResults));
            }
        }
    }

    async queryExample(stub, args) {
        if (args.length != 1) {
            throw new Error('Incorrect number of arguments. Expecting ExampleNumber ex: EXAMPLE1');
        }
        let exampleNumber = args[0];

        let exampleAsBytes = await stub.getState(exampleNumber); //get the example from chaincode state
        if (!exampleAsBytes || exampleAsBytes.toString().length <= 0) {
            throw new Error(exampleNumber + ' does not exist: ');
        }
        console.log(exampleAsBytes.toString());
        return exampleAsBytes;
    }
};

shim.start(new Example());

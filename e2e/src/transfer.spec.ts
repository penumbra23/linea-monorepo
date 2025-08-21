import { Transaction } from "ethers";
import { describe, it } from "@jest/globals";
import { config } from "./config/tests-config";
import { LineaEstimateGasClient, etherToWei } from "./common/utils";

const l2AccountManager = config.getL2AccountManager();

describe("Transfers", () => {
  const lineaEstimateGasClient = new LineaEstimateGasClient(config.getL2BesuNodeEndpoint()!);

  it.concurrent("Should successfully send a legacy transaction", async () => {
    const account = await l2AccountManager.generateAccount();

    const { gasPrice } = await config.getL2Provider().getFeeData();
    logger.debug(`Fetched gasPrice=${gasPrice}`);

    let nonce = await account.getNonce();

    for (let i = 0; i < 100; i++) {
      const tx = await account.sendTransaction({
        type: 0,
        to: "0x8D97689C9818892B700e27F316cc3E41e17fBeb9",
        gasPrice,
        value: etherToWei("0.01"),
        gasLimit: "0x466124",
        chainId: config.getL2ChainId(),
        nonce,
      });

      nonce += 1;
      logger.debug(`Legacy transaction sent. transactionHash=${tx.hash}`);
    }

    // const receipt = await tx.wait();
    // logger.debug(`Legacy transaction receipt received. transactionHash=${tx.hash} status=${receipt?.status}`);

    // expect(receipt).not.toBeNull();
  });

  it.concurrent("Should successfully send an EIP1559 transaction", async () => {
    const account = await l2AccountManager.generateAccount();
    let nonce = await account.getNonce();

    for (let i = 0; i < 100; i++) {
      const transaction = Transaction.from({
        type: 2,
        to: "0x8D97689C9818892B700e27F316cc3E41e17fBeb9",
        value: etherToWei("0.01"),
        chainId: config.getL2ChainId(),
        nonce,
      });

      const { maxPriorityFeePerGas, maxFeePerGas, gasLimit } = await lineaEstimateGasClient.lineaEstimateGas(
        account.address,
        "0x8D97689C9818892B700e27F316cc3E41e17fBeb9",
        transaction.unsignedSerialized,
      );

      logger.debug(`Fetched fee data. maxPriorityFeePerGas=${maxPriorityFeePerGas} maxFeePerGas=${maxFeePerGas}`);

      const tx = await account.sendTransaction({
        ...transaction.toJSON(),
        gasLimit,
        maxPriorityFeePerGas,
        maxFeePerGas,
      });

      nonce += 1;
      logger.debug(`EIP1559 transaction sent. transactionHash=${tx.hash}`);
    }

    // const receipt = await tx.wait();
    // logger.debug(`EIP1559 transaction receipt received. transactionHash=${tx.hash} status=${receipt?.status}`);

    // expect(receipt).not.toBeNull();
  });
});

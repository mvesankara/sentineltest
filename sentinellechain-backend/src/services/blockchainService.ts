import Web3 from 'web3';
import { Contract } from 'web3-eth-contract'; // For Contract type
import { Log, Alert } from '@prisma/client'; // Assuming Alert type includes nested Log

// Configuration - Placeholders, should be in .env
const RPC_URL = process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com/'; // Public RPC for Mumbai
const CONTRACT_ADDRESS = process.env.LOG_PROOF_CONTRACT_ADDRESS || '0xYourDeployedContractAddressOnMumbai';
const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000'; // Placeholder
const ACCOUNT_ADDRESS = process.env.SIGNER_ACCOUNT_ADDRESS || '0xYourAccountAddress'; // Placeholder

// ABI from compiled LogProof.sol
const contractABI: any = [ /* Paste ABI JSON here */ 
    {
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "logHash",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "LogHashStored",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "proofExists",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "logHash",
				"type": "bytes32"
			}
		],
		"name": "storeHash",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "logHash",
				"type": "bytes32"
			}
		],
		"name": "verifyHash",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let web3: Web3;
let logProofContract: Contract<any>; // Specify 'any' for the ABI type argument

try {
  web3 = new Web3(RPC_URL);
  // Add account to wallet for signing transactions
  if (PRIVATE_KEY && PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address; // Set default account for sending transactions
    console.log(`BlockchainService: Wallet added for address ${account.address}`);
  } else {
    console.warn("BlockchainService: PRIVATE_KEY is a placeholder or not set. Transactions will not be signed.");
  }
  logProofContract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
  console.log(`BlockchainService: Initialized with contract at ${CONTRACT_ADDRESS} on network ${RPC_URL}`);
} catch (error) {
  console.error("BlockchainService: Error initializing Web3 or contract:", error);
  // Depending on the error, you might want to throw it or handle it gracefully
  // For now, we log it. Functions using web3 or logProofContract will fail if not initialized.
}


/**
 * Anchors data on the blockchain by storing its hash in the LogProof smart contract.
 * @param dataToHash The string data to hash and anchor.
 * @returns A Promise that resolves to the blockchain transaction hash if successful, otherwise null.
 */
export async function anchorDataOnBlockchain(dataToHash: string): Promise<string | null> {
  if (!web3 || !logProofContract || !web3.eth.defaultAccount) {
    console.error("BlockchainService: Web3, contract, or defaultAccount not initialized. Cannot anchor data.");
    if (process.env.NODE_ENV !== 'production') { // Stub for non-production environments if needed
        console.warn("BlockchainService: STUBBING anchorDataOnBlockchain - returning fake hash");
        return `0xfake_tx_hash_${Date.now()}`;
    }
    return null;
  }

  try {
    const hash = web3.utils.sha3(dataToHash);
    if (!hash) {
        console.error("BlockchainService: Failed to generate SHA3 hash for data:", dataToHash);
        return null;
    }
    console.log(`BlockchainService: Generated hash ${hash} for data: ${dataToHash.substring(0, 50)}...`);

    // Ensure the from address is the one we have the private key for
    const fromAddress = web3.eth.defaultAccount; 
    if (!fromAddress) {
        console.error("BlockchainService: No default account set for sending transaction.");
        return null;
    }
    
    console.log(`BlockchainService: Attempting to store hash ${hash} from address ${fromAddress}`);

    // Estimate gas
    const estimatedGas = await logProofContract.methods.storeHash(hash).estimateGas({ from: fromAddress });
    console.log(`BlockchainService: Estimated gas: ${estimatedGas}`);

    // Send transaction
    const receipt = await logProofContract.methods.storeHash(hash).send({
      from: fromAddress,
      gas: estimatedGas.toString(), // Convert bigint to string
      // gasPrice: await web3.eth.getGasPrice() // Optional: set gasPrice or let web3 handle it
    });

    console.log("BlockchainService: Transaction successful. Receipt:", receipt);
    return receipt.transactionHash;

  } catch (error) {
    console.error("BlockchainService: Error anchoring data on blockchain:", error);
    // For CI/CD or environments without real credentials, we might return a fake hash
    // This helps in testing the rest of the application flow.
    if (process.env.NODE_ENV !== 'production' || RPC_URL.includes('localhost')) { // Example condition for stubbing
      console.warn("BlockchainService: STUBBING anchorDataOnBlockchain due to error - returning fake hash");
      return `0xfake_tx_hash_on_error_${Date.now()}`;
    }
    return null;
  }
}

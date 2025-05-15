import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  BLOCKCHAIN_IDS,
  createPostResponse,
} from "@solana/actions";

import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

import * as splToken from '@solana/spl-token';

import axios from 'axios';

const SOLANA_DEVNET_USDC_PUBKEY =
  'EKLbfTVy38gobhwWF18Kcosiwz4JViWwmA2fYrEKwaoj';

// CAIP-2 format for Solana
const blockchain = BLOCKCHAIN_IDS.devnet;

// Create a connection to the Solana blockchain
const connection = new Connection("https://api.devnet.solana.com");

// Create headers with CAIP blockchain ID
const headers = {
  ...ACTIONS_CORS_HEADERS,
  "x-blockchain-ids": blockchain,
  "x-action-version": "2.4",
};

// OPTIONS endpoint is required for CORS preflight requests
// Your Blink won't render if you don't add this
export const OPTIONS = async () => {
  return new Response(null, { headers });
};

// GET endpoint returns the Blink metadata (JSON) and UI configuration
export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { toPubkey, repo, avatarUrl, description } = await validatedQueryParams(requestUrl);

    const baseHref = new URL(
      `/api/actions/donate?to=${toPubkey.toBase58()}&repo=${repo}`,
      requestUrl.origin,
    ).toString();

    const payload: ActionGetResponse = {
      type: 'action',
      title: `Donate OSSBLINKS to ${repo}`,
      icon: avatarUrl,
      description: description ? `Repo description: ${description}` : '',
      label: 'Donate', // this value will be ignored since `links.actions` exists
      links: {
        actions: [
          {
            label: 'Send 10 OSSBLINKS', // button text
            href: `${baseHref}&amount=${'10'}`,
            type: "transaction"
          },
          {
            label: 'Send 50 OSSBLINKS', // button text
            href: `${baseHref}&amount=${'50'}`,
            type: "transaction"
          },
          {
            label: 'Send 100 OSSBLINKS', // button text
            href: `${baseHref}&amount=${'100'}`,
            type: "transaction"
          },
          {
            label: 'Send OSSBLINKS', // button text
            href: `${baseHref}&amount={amount}`, // this href will have a text input
            parameters: [
              {
                name: 'amount', // parameter name in the `href` above
                label: 'Enter the amount of OSSBLINKS to send', // placeholder of the text input
                required: true,
              },
            ],
            type: "transaction"
          },
        ],
      },
    };

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let message = 'An unknown error occurred';
    if (typeof err == 'string') message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

// POST endpoint handles the actual transaction creation
export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { amount, toPubkey } = await validatedQueryParams(requestUrl);

    const body: ActionPostRequest = await req.json();

    // validate the client provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers,
      });
    }

    const decimals = 9;
    const mintAddress = new PublicKey(SOLANA_DEVNET_USDC_PUBKEY); // replace this with any SPL token mint address

    // converting value to fractional units

    let transferAmount: any = parseFloat(amount.toString());
    transferAmount = transferAmount.toFixed(decimals);
    transferAmount = transferAmount * Math.pow(10, decimals);

    const fromTokenAccount = await splToken.getAssociatedTokenAddress(
      mintAddress,
      account,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    let toTokenAccount = await splToken.getAssociatedTokenAddress(
      mintAddress,
      toPubkey,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const ifexists = await connection.getAccountInfo(toTokenAccount);

    let instructions = [];

    if (!ifexists || !ifexists.data) {
      let createATAiX = splToken.createAssociatedTokenAccountInstruction(
        account,
        toTokenAccount,
        toPubkey,
        mintAddress,
        splToken.TOKEN_PROGRAM_ID,
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      instructions.push(createATAiX);
    }

    let transferInstruction = splToken.createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      account,
      transferAmount,
    );
    instructions.push(transferInstruction);

    const transaction = new Transaction();
    transaction.feePayer = account;

    transaction.add(...instructions);

    // set the end user as the fee payer
    transaction.feePayer = account;

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Donated ${amount} USDC to ${toPubkey.toBase58()}`,
        type: 'transaction'
      },
      // note: no additional signers are needed
      // signers: [],
    });

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let message = 'An unknown error occurred';
    if (typeof err == 'string') message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

const extractRepoDetails = async (repoUrl: string) => {
  try {
    const trimmedUrl = repoUrl.trim();
    if (!trimmedUrl.startsWith('https://github.com/')) {
      throw new Error('Invalid GitHub URL. Must start with https://github.com/');
    }

    const urlParts = new URL(trimmedUrl).pathname.split('/').filter(Boolean);
    if (urlParts.length < 2) {
      throw new Error('Invalid GitHub URL.  Must be a repo URL.');
    }
    const owner = urlParts[0];
    const repoName = urlParts[0] + '/' + urlParts[1];

    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${urlParts[1]}`);
    const avatarUrl = repoResponse.data.owner.avatar_url;
    const description = repoResponse.data.description;

    return {
      avatarUrl,
      repoName,
      description,
    };
  } catch (e: any) {
    return {
      avatarUrl: '',
      repoName: '',
      description: '',
    }; // Return empty string on error to avoid further issues.
  }
}

const validatedQueryParams = async (requestUrl: URL) => {
  let toPubkey: PublicKey = new PublicKey(
    '2grKcZPjxKbNKkc8S6nmrSXtXTXJih4utVMa7jBwRcFf',
  );
  let amount: number = 10;
  let repo: string = 'https://github.com/0xnetero/oss-blinks';
  let avatarUrl: string = 'https://avatars.githubusercontent.com/u/203130627?v=4';
  let description: string = '';

  try {
    if (requestUrl.searchParams.get('to')) {
      toPubkey = new PublicKey(requestUrl.searchParams.get('to')!);
    }
  } catch (err) {
    throw 'Invalid input query parameter: to';
  }

  try {
    if (requestUrl.searchParams.get('amount')) {
      amount = parseFloat(requestUrl.searchParams.get('amount')!);
    }

    if (amount <= 0) throw 'amount is too small';
  } catch (err) {
    throw 'Invalid input query parameter: amount';
  }

  try {
    if (requestUrl.searchParams.get('repo')) {
      repo = requestUrl.searchParams.get('repo')!;
      const extractedData = await extractRepoDetails(repo);
      avatarUrl = extractedData.avatarUrl;
      description = extractedData.description;
    }

  } catch (err) {
    throw 'Invalid input query parameter: amount';
  }

  return {
    amount,
    toPubkey,
    repo,
    description,
    avatarUrl,
  };
}

/**
* Checks if the input is a valid EVM (Ethereum) address.
* Valid EVM addresses:
* - Start with "0x"
* - Are 42 characters long (including "0x")
* - Contain only hexadecimal characters after "0x" prefix
* 
* @param address - The wallet address string to check
* @returns boolean - True if it's a valid EVM address
*/
function isEVMAddress(address: string): boolean {
  // Check if address starts with "0x" and is 42 characters long
  if (!address.startsWith("0x") || address.length !== 42) {
    return false;
  }

  // Check if all characters after "0x" are valid hex characters
  const hexPart = address.slice(2);
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(hexPart);
}

/**
* Checks if the input is a valid Solana address.
* Valid Solana addresses:
* - Are 32-44 characters long
* - Contain only Base58 characters (A-Z, a-z, 0-9, excluding 0, O, I, l)
* 
* @param address - The wallet address string to check
* @returns boolean - True if it's a valid Solana address
*/
function isSolanaAddress(address: string): boolean {
  // Typical Solana addresses are 32-44 characters long
  if (address.length < 32 || address.length > 44) {
    return false;
  }

  // Base58 character set (excludes characters: 0, O, I, l)
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  return base58Regex.test(address);
}
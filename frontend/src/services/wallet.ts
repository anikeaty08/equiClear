import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { WalletAdapterNetwork, DecryptPermission } from '@demox-labs/aleo-wallet-adapter-base';
import {
  connect as puzzleConnect,
  disconnect as puzzleDisconnect,
  requestCreateEvent,
  requestSignature,
  getAccount,
  Network,
} from '@puzzlehq/sdk-core';
import { CONTRACTS } from './aleo';

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
  network: 'testnet' | 'mainnet';
}

export interface TransactionResult {
  success: boolean;
  txId?: string;
  error?: string;
}

type WalletProvider = 'leo' | 'puzzle' | null;

class AleoWallet {
  private leoAdapter: LeoWalletAdapter | null = null;
  private connected = false;
  private address: string | null = null;
  private provider: WalletProvider = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initLeoAdapter();
    }
  }

  private initLeoAdapter() {
    try {
      this.leoAdapter = new LeoWalletAdapter({
        appName: 'EquiClear',
        network: WalletAdapterNetwork.TestnetBeta,
      });
    } catch {
      this.leoAdapter = null;
    }
  }

  private detectWallet(): WalletProvider {
    if (typeof window === 'undefined') return null;
    const w: any = window as any;
    if (w.puzzle || w.puzzleWallet) return 'puzzle';
    if (w.leoWallet || w.aleo) return 'leo';
    return null;
  }

  async connect(): Promise<WalletState> {
    if (typeof window === 'undefined') {
      throw new Error('Wallet can only be connected in browser');
    }

    const preferred = this.detectWallet();

    if (preferred === 'puzzle' || !preferred) {
      try {
        const response = await puzzleConnect({
          dAppInfo: {
            name: 'EquiClear',
            description: 'Decentralized Dutch Auction Platform on Aleo',
            iconUrl: `${window.location.origin}/logo.svg`,
          },
          permissions: {
            programIds: {
              [Network.AleoTestnet]: [
                CONTRACTS.BALANCE,
                CONTRACTS.AUCTION,
                CONTRACTS.BID,
                CONTRACTS.CLAIM,
              ],
            },
          },
        } as any);

        const address = (response as any)?.connection?.address;

        if (address) {
          this.provider = 'puzzle';
          this.address = address;
          this.connected = true;

          return {
            connected: true,
            address,
            balance: 0,
            network: 'testnet',
          };
        }

        const accountInfo = await getAccount();
        const fallbackAddress = (accountInfo as any)?.address || (accountInfo as any)?.account;

        if (fallbackAddress) {
          this.provider = 'puzzle';
          this.address = fallbackAddress;
          this.connected = true;

          return {
            connected: true,
            address: fallbackAddress,
            balance: 0,
            network: 'testnet',
          };
        }
      } catch {
      }
    }

    if (!this.leoAdapter) {
      this.initLeoAdapter();
    }

    if (this.leoAdapter) {
      try {
        await this.leoAdapter.connect(
          DecryptPermission.UponRequest,
          WalletAdapterNetwork.TestnetBeta,
        );

        const publicKey = this.leoAdapter.publicKey;

        if (publicKey) {
          this.provider = 'leo';
          this.address = publicKey;
          this.connected = true;

          return {
            connected: true,
            address: publicKey,
            balance: 0,
            network: 'testnet',
          };
        }
      } catch (error: any) {
        if (error?.message?.includes('reject') || error?.name === 'WalletConnectionError') {
          throw new Error('Connection rejected by user');
        }
      }
    }

    throw new Error('No compatible Aleo wallet found. Please install Puzzle or Leo wallet.');
  }

  async disconnect(): Promise<void> {
    try {
      if (this.provider === 'puzzle') {
        await puzzleDisconnect();
      } else if (this.provider === 'leo' && this.leoAdapter) {
        await this.leoAdapter.disconnect();
      }
    } catch {
    }

    this.connected = false;
    this.address = null;
    this.provider = null;
  }

  setAccount(address: string | null, provider: WalletProvider = 'puzzle') {
    this.address = address;
    this.connected = !!address;
    this.provider = address ? provider : null;
  }

  getAddress(): string | null {
    return this.address;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getProvider(): WalletProvider {
    return this.provider;
  }

  private async submitTransaction(
    programId: string,
    functionId: string,
    inputs: Array<string | any>,
    fee: number = 100000,
  ): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    if (this.provider === 'puzzle') {
      try {
        await requestSignature({
          message: `EquiClear transaction approval\nProgram: ${programId}\nFunction: ${functionId}\nTime: ${new Date().toISOString()}`,
          address: this.address!,
          network: Network.AleoTestnet,
        });

        console.log('Requesting transaction signature from Puzzle Wallet...', {
          programId,
          functionId,
          inputs: inputs.length,
          fee: fee / 1000000
        });
        
        // requestCreateEvent will show signature popup in Puzzle Wallet
        const result = await requestCreateEvent({
          type: 'Execute',
          programId,
          functionId,
          inputs,
          fee: fee / 1000000,
        } as any);

        console.log('Transaction result:', result);

        const txId =
          (result as any)?.eventId ||
          (result as any)?.transactionId ||
          (result as any)?.id;

        if (!txId) {
          const errorMsg = (result as any)?.error || 'Transaction not signed or rejected. Please approve the transaction in Puzzle Wallet.';
          console.error('Transaction failed:', errorMsg);
          return { success: false, error: errorMsg };
        }

        console.log('✅ Transaction signed and submitted:', txId);
        return { success: true, txId };
      } catch (error: any) {
        console.error('Transaction error:', error);
        const errorMsg = error?.message || error?.toString() || 'Transaction failed. Please check Puzzle Wallet and try again.';
        return { success: false, error: errorMsg };
      }
    }

    if (this.provider === 'leo' && this.leoAdapter) {
      const normalizedInputs = inputs.map((input) => {
        if (typeof input === 'string') return input;
        if (input?.plaintext) return JSON.stringify(input.plaintext);
        return JSON.stringify(input);
      });
      const result = await this.leoAdapter.requestExecution({
        programId,
        functionName: functionId,
        inputs: normalizedInputs,
        fee,
      } as any);

      const txId =
        (result as any)?.transactionId ||
        (result as any)?.id;

      if (!txId) {
        return { success: false, error: 'Transaction not signed or rejected.' };
      }

      return { success: true, txId };
    }

    throw new Error('Unsupported wallet provider');
  }

  async deposit(tokenId: string, amount: number, creditsRecord?: any): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    const tid = tokenId.includes('field') ? tokenId : `${tokenId}field`;
    const microcredits = amount * 1000000; // Convert credits to microcredits

    // For Puzzle wallet: Execute deposit with a real credits record
    if (this.provider === 'puzzle') {
      try {
        if (!creditsRecord) {
          throw new Error('No credits record selected. Please select a credits record from your wallet.');
        }
        const credits = creditsRecord;
        
        return this.submitTransaction(CONTRACTS.BALANCE, 'deposit', [
          this.address!,
          credits,
          tid,
          `${Date.now()}u64`,
        ], 100000); // Fee in microcredits
      } catch (error: any) {
        throw new Error(`Deposit failed: ${error.message || 'Failed to deposit Aleo testnet credits'}`);
      }
    }

    // For Leo wallet
    if (this.provider === 'leo' && this.leoAdapter) {
      // Leo wallet handles credits transfer through the adapter
      if (!creditsRecord) {
        throw new Error('No credits record selected. Please select a credits record from your wallet.');
      }
      const credits = creditsRecord;

    return this.submitTransaction(CONTRACTS.BALANCE, 'deposit', [
      this.address!,
      credits,
      tid,
      `${Date.now()}u64`,
    ], 100000);
    }

    throw new Error('Unsupported wallet provider for deposits');
  }

  async createPrivateCredits(amount: number): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    const microcredits = amount * 1000000;
    if (!Number.isFinite(microcredits) || microcredits <= 0) {
      throw new Error('Invalid amount for creating private credits record');
    }

    // Convert public credits to a private credits record for the user
    // credits.aleo/transfer_public_to_private(recipient: address.private, amount: u64.public)
    return this.submitTransaction('credits.aleo', 'transfer_public_to_private', [
      this.address!,
      `${microcredits}u64`,
    ], 100000);
  }

  async withdraw(tokenId: string, amount: number, balanceRecord?: string): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    const tid = tokenId.includes('field') ? tokenId : `${tokenId}field`;

    // Withdraw requires a balance record - should be fetched from user's records
    // In production, this would query the user's Balance records from the blockchain
    const balance = balanceRecord || `{ owner: ${this.address}, token_id: ${tid}, amount: ${amount}u64 }`;

    // Call withdraw - updates balance (credits transfer happens separately via credits.aleo)
    return this.submitTransaction(CONTRACTS.BALANCE, 'withdraw', [
      this.address!,
      balance,
      `${amount}u64`,
      `${Date.now()}u64`,
    ], 100000);
  }

  async createAuction(
    itemName: string,
    supply: number,
    startPrice: number,
    reservePrice: number,
    startTime: number,
    endTime: number,
  ): Promise<TransactionResult> {
    return this.submitTransaction(CONTRACTS.AUCTION, 'create_auction', [
      this.address!,
      itemName,
      `${supply}u64`,
      `${startPrice}u64`,
      `${reservePrice}u64`,
      `${startTime}u64`,
      `${endTime}u64`,
    ]);
  }

  async placeBid(auctionId: string, qty: number, price: number, balanceRecord?: string): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    const aid = auctionId.includes('field') ? auctionId : `${auctionId}field`;
    const balance = balanceRecord || '{}'; // Balance record - should be provided from user's records

    // Place bid requires a balance record to deduct from
    // The balance record should be fetched from user's records before calling this
    return this.submitTransaction(CONTRACTS.BID, 'place_bid', [
      this.address!,
      balance,
      aid,
      `${qty}u64`,
      `${price}u64`,
      `${Date.now()}u64`,
    ], 100000);
  }

  async claimItems(auctionId: string): Promise<TransactionResult> {
    const aid = auctionId.includes('field') ? auctionId : `${auctionId}field`;

    return this.submitTransaction(CONTRACTS.CLAIM, 'claim_items', [
      this.address!,
      '{}',
      aid,
      `${Date.now()}u64`,
    ]);
  }
}

export const aleoWallet = new AleoWallet();
export default aleoWallet;

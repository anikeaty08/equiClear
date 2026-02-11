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
  private initialized = false;

  constructor() {
    this.initialized = true;
    if (typeof window !== 'undefined') {
      this.initLeoAdapter();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private initLeoAdapter() {
    try {
      this.leoAdapter = new LeoWalletAdapter({
        appName: 'EquiClear',
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
                'credits.aleo',
                CONTRACTS.AUCTION,
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

        console.log('Transaction signed and submitted:', txId);
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

  // Create a new auction
  async createAuction(
    itemName: string,
    supply: number,
    startPrice: number,
    reservePrice: number,
    startTime: number,
    endTime: number,
  ): Promise<TransactionResult> {
    const nonce = `${Date.now()}field`;
    return this.submitTransaction(CONTRACTS.AUCTION, 'create_auction', [
      itemName,
      `${supply}u64`,
      `${startPrice}u64`,
      `${reservePrice}u64`,
      `${startTime}u64`,
      `${endTime}u64`,
      nonce,
    ]);
  }

  // Place a bid - no balance record needed, just auction_id + amount + quantity
  async placeBid(auctionId: string, amount: number, quantity: number): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    const aid = auctionId.includes('field') ? auctionId : `${auctionId}field`;
    const nonce = `${Date.now()}field`;

    return this.submitTransaction(CONTRACTS.AUCTION, 'place_bid', [
      aid,
      `${amount}u64`,
      `${quantity}u64`,
      nonce,
    ], 100000);
  }

  // Redeem a winning bid using public credits (atomic transfer to auctioneer)
  async redeemBidPublic(auctioneerAddress: string, bidReceipt: any): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    return this.submitTransaction(CONTRACTS.AUCTION, 'redeem_bid_public', [
      auctioneerAddress,
      bidReceipt,
    ], 200000);
  }

  // Redeem a winning bid using private credits record
  async redeemBidPrivate(auctioneerAddress: string, bidReceipt: any, creditsRecord: any): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    return this.submitTransaction(CONTRACTS.AUCTION, 'redeem_bid_private', [
      auctioneerAddress,
      bidReceipt,
      creditsRecord,
    ], 200000);
  }

  // Settle an auction (owner only, requires AuctionTicket record)
  async settleAuction(auctionTicket: any, clearingPrice: number): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    return this.submitTransaction(CONTRACTS.AUCTION, 'settle_auction', [
      auctionTicket,
      `${clearingPrice}u64`,
    ], 100000);
  }

  // Cancel an auction (owner only, requires AuctionTicket record)
  async cancelAuction(auctionTicket: any): Promise<TransactionResult> {
    if (!this.address || !this.connected) {
      throw new Error('Wallet not connected');
    }

    return this.submitTransaction(CONTRACTS.AUCTION, 'cancel_auction', [
      auctionTicket,
    ], 100000);
  }
}

export const aleoWallet = new AleoWallet();
export default aleoWallet;

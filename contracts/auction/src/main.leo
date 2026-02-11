import credits.aleo;

program equiclear_auction_4829.aleo {

    @noupgrade
    async constructor() {}

    struct AuctionHash {
        name: field,
        nonce: field,
    }

    struct BidHash {
        auction_id: field,
        nonce: field,
    }

    record AuctionTicket {
        owner: address,
        auction_id: field,
        item_name: field,
        total_supply: u64,
        start_price: u64,
        reserve_price: u64,
        start_time: u64,
        end_time: u64,
    }

    record BidReceipt {
        owner: address,
        auction_id: field,
        bid_id: field,
        amount: u64,
        quantity: u64,
    }

    mapping auctions: field => bool;
    mapping auction_start_price: field => u64;
    mapping auction_reserve_price: field => u64;
    mapping auction_supply: field => u64;
    mapping auction_start_time: field => u64;
    mapping auction_end_time: field => u64;
    mapping auction_status: field => u8;
    mapping auction_clearing_price: field => u64;
    mapping auction_owners: field => address;
    mapping bid_count: field => u64;
    mapping winning_bids: field => bool;
    mapping redemptions: field => bool;
    mapping auction_counter: u8 => u64;

    async transition create_auction(
        item_name: field,
        total_supply: u64,
        start_price: u64,
        reserve_price: u64,
        start_time: u64,
        end_time: u64,
        nonce: field,
    ) -> (AuctionTicket, Future) {
        assert(total_supply > 0u64);
        assert(start_price > reserve_price);
        assert(reserve_price > 0u64);
        assert(end_time > start_time);

        let auction_id: field = BHP256::hash_to_field(AuctionHash { name: item_name, nonce });

        let ticket: AuctionTicket = AuctionTicket {
            owner: self.signer,
            auction_id,
            item_name,
            total_supply,
            start_price,
            reserve_price,
            start_time,
            end_time,
        };

        let f: Future = finalize_create_auction(auction_id, self.signer, total_supply, start_price, reserve_price, start_time, end_time);
        return (ticket, f);
    }
    async function finalize_create_auction(auction_id: field, owner: address, total_supply: u64, start_price: u64, reserve_price: u64, start_time: u64, end_time: u64) {
        assert(!auctions.contains(auction_id));
        auctions.set(auction_id, true);
        auction_owners.set(auction_id, owner);
        auction_supply.set(auction_id, total_supply);
        auction_start_price.set(auction_id, start_price);
        auction_reserve_price.set(auction_id, reserve_price);
        auction_start_time.set(auction_id, start_time);
        auction_end_time.set(auction_id, end_time);
        auction_status.set(auction_id, 0u8);
        bid_count.set(auction_id, 0u64);
        let count: u64 = Mapping::get_or_use(auction_counter, 0u8, 0u64);
        auction_counter.set(0u8, count + 1u64);
    }

    async transition place_bid(
        auction_id: field,
        amount: u64,
        quantity: u64,
        nonce: field,
    ) -> (BidReceipt, Future) {
        assert(amount > 0u64);
        assert(quantity > 0u64);

        let bid_id: field = BHP256::hash_to_field(BidHash { auction_id, nonce });

        let receipt: BidReceipt = BidReceipt {
            owner: self.signer,
            auction_id,
            bid_id,
            amount,
            quantity,
        };

        let f: Future = finalize_place_bid(auction_id, amount);
        return (receipt, f);
    }
    async function finalize_place_bid(auction_id: field, amount: u64) {
        assert(auctions.get(auction_id));
        let status: u8 = auction_status.get(auction_id);
        assert(status <= 1u8);
        let reserve: u64 = auction_reserve_price.get(auction_id);
        assert(amount >= reserve);
        let count: u64 = bid_count.get(auction_id);
        bid_count.set(auction_id, count + 1u64);
    }

    async transition settle_auction(
        ticket: AuctionTicket,
        clearing_price: u64,
    ) -> (AuctionTicket, Future) {
        assert(clearing_price >= ticket.reserve_price);
        assert(clearing_price <= ticket.start_price);

        let updated_ticket: AuctionTicket = AuctionTicket {
            owner: ticket.owner,
            auction_id: ticket.auction_id,
            item_name: ticket.item_name,
            total_supply: ticket.total_supply,
            start_price: ticket.start_price,
            reserve_price: ticket.reserve_price,
            start_time: ticket.start_time,
            end_time: ticket.end_time,
        };

        let f: Future = finalize_settle_auction(ticket.auction_id, clearing_price);
        return (updated_ticket, f);
    }
    async function finalize_settle_auction(auction_id: field, clearing_price: u64) {
        assert(auctions.get(auction_id));
        let status: u8 = auction_status.get(auction_id);
        assert(status <= 1u8);
        auction_status.set(auction_id, 2u8);
        auction_clearing_price.set(auction_id, clearing_price);
    }

    async transition redeem_bid_public(
        auctioneer: address,
        bid_receipt: BidReceipt,
    ) -> Future {
        let transfer_public: Future = credits.aleo/transfer_public_as_signer(auctioneer, bid_receipt.amount);
        return finalize_redeem_bid_public(auctioneer, bid_receipt.auction_id, bid_receipt.bid_id, transfer_public);
    }
    async function finalize_redeem_bid_public(auctioneer: address, auction_id: field, bid_id: field, transfer: Future) {
        assert_eq(auction_owners.get(auction_id), auctioneer);
        assert_eq(auction_status.get(auction_id), 2u8);
        let clearing: u64 = auction_clearing_price.get(auction_id);
        assert(!redemptions.contains(bid_id));
        transfer.await();
        redemptions.set(bid_id, true);
        winning_bids.set(bid_id, true);
    }

    async transition redeem_bid_private(
        auctioneer: address,
        bid_receipt: BidReceipt,
        transfer_record: credits.aleo/credits,
    ) -> Future {
        assert(transfer_record.microcredits >= bid_receipt.amount);
        let transfer_private_to_public: (credits.aleo/credits, Future) = credits.aleo/transfer_private_to_public(transfer_record, auctioneer, bid_receipt.amount);
        return finalize_redeem_bid_private(auctioneer, bid_receipt.auction_id, bid_receipt.bid_id, transfer_private_to_public.1);
    }
    async function finalize_redeem_bid_private(auctioneer: address, auction_id: field, bid_id: field, transfer: Future) {
        assert_eq(auction_owners.get(auction_id), auctioneer);
        assert_eq(auction_status.get(auction_id), 2u8);
        let clearing: u64 = auction_clearing_price.get(auction_id);
        assert(!redemptions.contains(bid_id));
        transfer.await();
        redemptions.set(bid_id, true);
        winning_bids.set(bid_id, true);
    }

    async transition cancel_auction(
        ticket: AuctionTicket,
    ) -> Future {
        return finalize_cancel_auction(ticket.auction_id);
    }
    async function finalize_cancel_auction(auction_id: field) {
        assert(auctions.get(auction_id));
        let status: u8 = auction_status.get(auction_id);
        assert(status < 2u8);
        auction_status.set(auction_id, 3u8);
    }
}

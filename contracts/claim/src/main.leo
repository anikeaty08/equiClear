// EquiClear Claim Module
// Winner claims and refund processing

program equiclear_claim.aleo {
    // Claim record for won items
    record WinClaim {
        owner: address,
        auction_id: field,
        items_won: u64,
        amount_paid: u64,
        claimed: bool,
    }
    
    // Refund record
    record Refund {
        owner: address,
        auction_id: field,
        refund_amount: u64,
        processed: bool,
    }
    
    // Claim receipt
    record Receipt {
        owner: address,
        auction_id: field,
        items_claimed: u64,
        claim_time: u64,
    }
    
    // Balance record
    record Balance {
        owner: address,
        token_id: field,
        amount: u64,
    }
    
    // Settlement record from bid module
    record Settlement {
        owner: address,
        auction_id: field,
        quantity_won: u64,
        quantity_lost: u64,
        price_paid: u64,
        refund_amount: u64,
    }
    
    // Track claims per auction
    mapping claim_counts: field => u64;
    mapping total_claimed: field => u64;
    mapping refunds_processed: field => u64;
    
    // Constructor - required for deployment (non-upgradable)
    @noupgrade
    async constructor() {}
    
    // Create claim from settlement
    // claimant: explicit address that will own the claim and refund records
    transition create_claim(claimant: address, settlement: Settlement) -> (WinClaim, Refund) {
        assert_eq(settlement.owner, claimant);
        
        let claim: WinClaim = WinClaim {
            owner: claimant,
            auction_id: settlement.auction_id,
            items_won: settlement.quantity_won,
            amount_paid: settlement.price_paid,
            claimed: false,
        };
        
        let refund: Refund = Refund {
            owner: claimant,
            auction_id: settlement.auction_id,
            refund_amount: settlement.refund_amount,
            processed: false,
        };
        
        return (claim, refund);
    }
    
    // Claim won auction items
    // claimant: explicit address that will own the receipt
    async transition claim_items(
        claimant: address,
        claim: WinClaim,
        timestamp: u64
    ) -> (Receipt, Future) {
        assert_eq(claim.owner, claimant);
        assert(!claim.claimed);
        assert(claim.items_won > 0u64);
        
        let receipt: Receipt = Receipt {
            owner: claimant,
            auction_id: claim.auction_id,
            items_claimed: claim.items_won,
            claim_time: timestamp,
        };
        
        let f: Future = finalize_claim_items(claim.auction_id, claim.items_won);
        return (receipt, f);
    }
    
    async function finalize_claim_items(auction_id: field, items: u64) {
        let count: u64 = Mapping::get_or_use(claim_counts, auction_id, 0u64);
        Mapping::set(claim_counts, auction_id, count + 1u64);
        
        let total: u64 = Mapping::get_or_use(total_claimed, auction_id, 0u64);
        Mapping::set(total_claimed, auction_id, total + items);
    }
    
    // Process refund
    // recipient: explicit address that will own the balance record
    async transition process_refund(recipient: address, refund: Refund) -> (Balance, Future) {
        assert_eq(refund.owner, recipient);
        assert(!refund.processed);
        assert(refund.refund_amount > 0u64);
        
        let balance: Balance = Balance {
            owner: recipient,
            token_id: 1field,
            amount: refund.refund_amount,
        };
        
        let f: Future = finalize_process_refund(refund.auction_id, refund.refund_amount);
        return (balance, f);
    }
    
    async function finalize_process_refund(auction_id: field, amount: u64) {
        let total: u64 = Mapping::get_or_use(refunds_processed, auction_id, 0u64);
        Mapping::set(refunds_processed, auction_id, total + amount);
    }
    
    // Batch claim and refund
    // recipient: explicit address that will own the receipt and balance records
    async transition claim_and_refund(
        recipient: address,
        settlement: Settlement,
        timestamp: u64
    ) -> (Receipt, Balance, Future) {
        assert_eq(settlement.owner, recipient);
        
        let receipt: Receipt = Receipt {
            owner: recipient,
            auction_id: settlement.auction_id,
            items_claimed: settlement.quantity_won,
            claim_time: timestamp,
        };
        
        let balance: Balance = Balance {
            owner: recipient,
            token_id: 1field,
            amount: settlement.refund_amount,
        };
        
        let f: Future = finalize_claim_and_refund(
            settlement.auction_id,
            settlement.quantity_won,
            settlement.refund_amount
        );
        return (receipt, balance, f);
    }
    
    async function finalize_claim_and_refund(auction_id: field, items: u64, refund: u64) {
        let count: u64 = Mapping::get_or_use(claim_counts, auction_id, 0u64);
        Mapping::set(claim_counts, auction_id, count + 1u64);
        
        let total: u64 = Mapping::get_or_use(total_claimed, auction_id, 0u64);
        Mapping::set(total_claimed, auction_id, total + items);
        
        let refund_total: u64 = Mapping::get_or_use(refunds_processed, auction_id, 0u64);
        Mapping::set(refunds_processed, auction_id, refund_total + refund);
    }
}

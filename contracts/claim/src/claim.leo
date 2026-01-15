// EquiClear Claim Module
// Winner claims and refund processing

program equiclear_claim.aleo {
    // Claim record for won items
    record Claim {
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
    record ClaimReceipt {
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
    
    // Bid result record (from bid module)
    record BidResult {
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
    
    // Create claim from bid result
    transition create_claim(bid_result: BidResult) -> (Claim, Refund) {
        // Verify ownership
        assert_eq(bid_result.owner, self.caller);
        
        // Create claim for won items
        let claim: Claim = Claim {
            owner: self.caller,
            auction_id: bid_result.auction_id,
            items_won: bid_result.quantity_won,
            amount_paid: bid_result.price_paid,
            claimed: false,
        };
        
        // Create refund for excess/lost bids
        let refund: Refund = Refund {
            owner: self.caller,
            auction_id: bid_result.auction_id,
            refund_amount: bid_result.refund_amount,
            processed: false,
        };
        
        return (claim, refund);
    }
    
    // Claim won auction items
    transition claim_items(
        claim: Claim,
        timestamp: u64
    ) -> ClaimReceipt {
        // Verify ownership
        assert_eq(claim.owner, self.caller);
        
        // Must not be already claimed
        assert(!claim.claimed);
        
        // Must have items to claim
        assert(claim.items_won > 0u64);
        
        // Create claim receipt
        let receipt: ClaimReceipt = ClaimReceipt {
            owner: self.caller,
            auction_id: claim.auction_id,
            items_claimed: claim.items_won,
            claim_time: timestamp,
        };
        
        return receipt then finalize(claim.auction_id, claim.items_won);
    }
    
    finalize claim_items(auction_id: field, items: u64) {
        // Update claim counts
        let count: u64 = Mapping::get_or_use(claim_counts, auction_id, 0u64);
        Mapping::set(claim_counts, auction_id, count + 1u64);
        
        // Update total claimed
        let total: u64 = Mapping::get_or_use(total_claimed, auction_id, 0u64);
        Mapping::set(total_claimed, auction_id, total + items);
    }
    
    // Process refund - returns tokens to balance
    transition process_refund(refund: Refund) -> Balance {
        // Verify ownership
        assert_eq(refund.owner, self.caller);
        
        // Must not be already processed
        assert(!refund.processed);
        
        // Must have refund amount
        assert(refund.refund_amount > 0u64);
        
        // Create balance record with refunded tokens
        let balance: Balance = Balance {
            owner: self.caller,
            token_id: 1field, // Default token
            amount: refund.refund_amount,
        };
        
        return balance then finalize(refund.auction_id, refund.refund_amount);
    }
    
    finalize process_refund(auction_id: field, amount: u64) {
        // Update refunds processed
        let total: u64 = Mapping::get_or_use(refunds_processed, auction_id, 0u64);
        Mapping::set(refunds_processed, auction_id, total + amount);
    }
    
    // Batch claim and refund in one transaction
    transition claim_and_refund(
        bid_result: BidResult,
        timestamp: u64
    ) -> (ClaimReceipt, Balance) {
        // Verify ownership
        assert_eq(bid_result.owner, self.caller);
        
        // Create claim receipt
        let receipt: ClaimReceipt = ClaimReceipt {
            owner: self.caller,
            auction_id: bid_result.auction_id,
            items_claimed: bid_result.quantity_won,
            claim_time: timestamp,
        };
        
        // Create refund balance
        let balance: Balance = Balance {
            owner: self.caller,
            token_id: 1field,
            amount: bid_result.refund_amount,
        };
        
        return (receipt, balance) then finalize(
            bid_result.auction_id,
            bid_result.quantity_won,
            bid_result.refund_amount
        );
    }
    
    finalize claim_and_refund(auction_id: field, items: u64, refund: u64) {
        // Update claim counts
        let count: u64 = Mapping::get_or_use(claim_counts, auction_id, 0u64);
        Mapping::set(claim_counts, auction_id, count + 1u64);
        
        // Update total claimed
        let total: u64 = Mapping::get_or_use(total_claimed, auction_id, 0u64);
        Mapping::set(total_claimed, auction_id, total + items);
        
        // Update refunds
        let refund_total: u64 = Mapping::get_or_use(refunds_processed, auction_id, 0u64);
        Mapping::set(refunds_processed, auction_id, refund_total + refund);
    }
}

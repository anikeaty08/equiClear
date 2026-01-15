// EquiClear Claim Types

program equiclear_claim.aleo {
    // Claim record for won items
    record Claim {
        owner: address,
        auction_id: field,
        items_won: u64,
        amount_paid: u64,
        claimed: bool,
    }
    
    // Refund record for losing/partial bids
    record Refund {
        owner: address,
        auction_id: field,
        refund_amount: u64,
        processed: bool,
    }
    
    // Claimed item receipt
    record ClaimReceipt {
        owner: address,
        auction_id: field,
        items_claimed: u64,
        claim_time: u64,
    }
}

// Balance Service
// Helper functions to parse and calculate balance from Aleo records

export interface BalanceRecord {
    owner: string;
    token_id: string;
    amount: string | number;
}

/**
 * Parse a Balance record from Aleo format
 * @param record - The record string or object from Aleo
 * @returns Parsed balance record or null
 */
export function parseBalanceRecord(record: any): BalanceRecord | null {
    try {
        if (typeof record === 'string') {
            // Try to parse as JSON
            try {
                const parsed = JSON.parse(record);
                return {
                    owner: parsed.owner || '',
                    token_id: parsed.token_id || '',
                    amount: parsed.amount || '0',
                };
            } catch {
                // If not JSON, try to extract from Aleo record format
                // Format: "record { owner: aleo1..., token_id: 1field, amount: 100u64 }"
                const ownerMatch = record.match(/owner:\s*([a-z0-9]+)/i);
                const tokenIdMatch = record.match(/token_id:\s*([a-z0-9]+)/i);
                const amountMatch = record.match(/amount:\s*(\d+)u64/i);
                
                if (ownerMatch && amountMatch) {
                    return {
                        owner: ownerMatch[1],
                        token_id: tokenIdMatch ? tokenIdMatch[1] : '1field',
                        amount: amountMatch[1],
                    };
                }
            }
        } else if (typeof record === 'object' && record !== null) {
            if (record.plaintext && typeof record.plaintext === 'object') {
                return {
                    owner: record.plaintext.owner || '',
                    token_id: record.plaintext.token_id || '',
                    amount: record.plaintext.amount || '0',
                };
            }
            return {
                owner: record.owner || '',
                token_id: record.token_id || '',
                amount: record.amount || '0',
            };
        }
    } catch (error) {
        console.error('Failed to parse balance record:', error);
    }
    return null;
}

/**
 * Calculate total balance from multiple Balance records
 * @param records - Array of Balance records
 * @param tokenId - Optional token ID to filter by (default: '1field' for Aleo credits)
 * @returns Total balance amount
 */
export function calculateTotalBalance(records: any[], tokenId: string = '1field'): number {
    let total = 0;
    
    records.forEach((record) => {
        const parsed = parseBalanceRecord(record);
        if (parsed) {
            // Filter by token ID if specified
            const recordTokenId = parsed.token_id.toString().replace('field', '');
            const filterTokenId = tokenId.replace('field', '');
            
            if (!tokenId || recordTokenId === filterTokenId) {
                // Extract numeric value from amount (remove 'u64' suffix)
                const amountStr = parsed.amount.toString().replace('u64', '');
                const amount = parseInt(amountStr) || 0;
                total += amount;
            }
        }
    });
    
    return total;
}

/**
 * Find a specific Balance record by token ID
 * @param records - Array of Balance records
 * @param tokenId - Token ID to find
 * @returns Balance record or null
 */
export function findBalanceRecord(records: any[], tokenId: string = '1field'): BalanceRecord | null {
    for (const record of records) {
        const parsed = parseBalanceRecord(record);
        if (parsed) {
            const recordTokenId = parsed.token_id.toString().replace('field', '');
            const filterTokenId = tokenId.replace('field', '');
            
            if (recordTokenId === filterTokenId) {
                return parsed;
            }
        }
    }
    return null;
}

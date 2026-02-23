module suiloop::scallop_interface {
    use sui::coin::Coin;

    // A placeholder for Scallop's Market object
    public struct Market has key {
        id: UID,
        version: u64
    }

    // Receipt for the flash loan (Hot Potato)
    public struct FlashLoanReceipt {
        loan_amount: u64,
        to_repay: u64
    }

    // --- Core Scallop Functions (Matching Mainnet Signatures) ---

    public fun borrow_flash_loan<CoinType>(
        _market: &mut Market, 
        _amount: u64, 
        _ctx: &mut TxContext
    ): (Coin<CoinType>, FlashLoanReceipt) {
        // In reality, this calls Scallop's move module. 
        // For development/compilation, we mock the behavior.
        abort 0 // Cannot execute in local without mainnet fork
    }

    public fun repay_flash_loan<CoinType>(
        _market: &mut Market, 
        payment: Coin<CoinType>, 
        receipt: FlashLoanReceipt, 
        _ctx: &mut TxContext
    ) {
        // In reality, this calls Scallop's repay function.
        let FlashLoanReceipt { loan_amount: _, to_repay } = receipt;
        assert!(sui::coin::value(&payment) >= to_repay, 0);
        sui::coin::destroy_zero(payment); // Mock burn/return
    }

    public fun get_repay_amount(receipt: &FlashLoanReceipt): u64 {
        receipt.to_repay
    }
}

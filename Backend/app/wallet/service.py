"""
Business logic for wallet credits: initialization, crediting, debiting,
and transaction history.
"""
from flask import current_app
from app.wallet.repository import WalletRepository
from app.common.exceptions import InsufficientCreditsError, NotFoundError


class WalletService:
    def __init__(self):
        self.repo = WalletRepository()

    def initialize_wallet(self, user):
        starting_credits = current_app.config["DEFAULT_SIGNUP_CREDITS"]
        wallet = self.repo.create_wallet(user, balance=starting_credits)
        self.repo.add_transaction(
            user=user,
            amount=starting_credits,
            type_="credit",
            reason="signup_bonus",
            balance_after=wallet.balance,
        )
        return wallet

    def get_wallet(self, user):
        wallet = self.repo.get_by_user(user)
        if not wallet:
            wallet = self.repo.create_wallet(user, balance=0)
        return wallet

    def credit(self, user, amount, reason, related_booking_id=None):
        wallet = self.get_wallet(user)
        new_balance = wallet.balance + amount
        self.repo.update_balance(wallet, new_balance)
        self.repo.add_transaction(
            user=user,
            amount=amount,
            type_="credit",
            reason=reason,
            balance_after=new_balance,
            related_booking_id=related_booking_id,
        )
        return wallet

    def debit(self, user, amount, reason, related_booking_id=None):
        wallet = self.get_wallet(user)
        if wallet.balance < amount:
            raise InsufficientCreditsError(
                f"Insufficient credits. Required: {amount}, Available: {wallet.balance}"
            )
        new_balance = wallet.balance - amount
        self.repo.update_balance(wallet, new_balance)
        self.repo.add_transaction(
            user=user,
            amount=amount,
            type_="debit",
            reason=reason,
            balance_after=new_balance,
            related_booking_id=related_booking_id,
        )
        return wallet

    def get_transaction_history(self, user, page, per_page):
        items, total = self.repo.list_transactions(user, page, per_page)
        return [t.to_dict() for t in items], total

    def admin_adjust(self, user, amount, reason):
        """Positive amount credits, negative amount debits (admin override)."""
        wallet = self.get_wallet(user)
        new_balance = wallet.balance + amount
        if new_balance < 0:
            raise InsufficientCreditsError("Adjustment would result in negative balance")
        self.repo.update_balance(wallet, new_balance)
        self.repo.add_transaction(
            user=user,
            amount=abs(amount),
            type_="credit" if amount >= 0 else "debit",
            reason="admin_adjustment",
            balance_after=new_balance,
        )
        return wallet

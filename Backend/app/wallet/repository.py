"""
Data access layer for wallets and transactions.
"""
import datetime
from app.models.wallet import Wallet, Transaction


class WalletRepository:
    @staticmethod
    def get_by_user(user):
        return Wallet.objects(user=user).first()

    @staticmethod
    def create_wallet(user, balance=0):
        wallet = Wallet(user=user, balance=balance)
        wallet.save()
        return wallet

    @staticmethod
    def update_balance(wallet, new_balance):
        wallet.balance = new_balance
        wallet.updated_at = datetime.datetime.utcnow()
        wallet.save()
        return wallet

    @staticmethod
    def add_transaction(user, amount, type_, reason, balance_after, related_booking_id=None):
        txn = Transaction(
            user=user,
            amount=amount,
            type=type_,
            reason=reason,
            balance_after=balance_after,
            related_booking_id=related_booking_id,
        )
        txn.save()
        return txn

    @staticmethod
    def list_transactions(user, page, per_page):
        qs = Transaction.objects(user=user).order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

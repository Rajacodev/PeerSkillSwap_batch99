"""
Wallet document model (one per user) and Transaction document model
(ledger entries for credits earned/spent).
"""
import datetime
from mongoengine import (
    Document,
    ReferenceField,
    IntField,
    StringField,
    DateTimeField,
    CASCADE,
)
from app.models.user import User


class Wallet(Document):
    user = ReferenceField(User, required=True, unique=True, reverse_delete_rule=CASCADE)
    balance = IntField(default=0)
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {"collection": "wallets", "indexes": ["user"]}

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user.id) if self.user else None,
            "balance": self.balance,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Transaction(Document):
    TYPE_CHOICES = ("credit", "debit")
    REASON_CHOICES = (
        "signup_bonus",
        "session_taught",
        "session_learned",
        "admin_adjustment",
        "refund",
    )

    user = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    amount = IntField(required=True)
    type = StringField(choices=TYPE_CHOICES, required=True)
    reason = StringField(choices=REASON_CHOICES, required=True)
    related_booking_id = StringField(default=None)
    balance_after = IntField(default=0)
    created_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "transactions",
        "indexes": ["user", "-created_at"],
        "ordering": ["-created_at"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user.id) if self.user else None,
            "amount": self.amount,
            "type": self.type,
            "reason": self.reason,
            "related_booking_id": self.related_booking_id,
            "balance_after": self.balance_after,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

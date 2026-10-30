"""
Wallet routes: view balance, transaction history, admin credit adjustment.
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.wallet.service import WalletService
from app.wallet.schema import AdminAdjustCreditsSchema
from app.wallet.validator import validate_payload
from app.common.responses import success_response, paginated_meta
from app.common.decorators import roles_required, get_pagination_params
from app.common.exceptions import NotFoundError
from app.models.user import User

wallet_bp = Blueprint("wallet", __name__, url_prefix="/api/wallet")
service = WalletService()


@wallet_bp.route("", methods=["GET"])
@jwt_required()
def get_my_wallet():
    """
    Get the current user's wallet balance.
    ---
    tags: [Wallet]
    """
    user = User.objects(id=get_jwt_identity()).first()
    wallet = service.get_wallet(user)
    return success_response("Wallet fetched", data=wallet.to_dict())


@wallet_bp.route("/transactions", methods=["GET"])
@jwt_required()
def get_transactions():
    """
    Get the current user's transaction history (paginated).
    ---
    tags: [Wallet]
    """
    user = User.objects(id=get_jwt_identity()).first()
    params = get_pagination_params()
    items, total = service.get_transaction_history(user, params["page"], params["per_page"])
    return success_response(
        "Transactions fetched",
        data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@wallet_bp.route("/admin/adjust", methods=["POST"])
@roles_required("admin")
def admin_adjust_credits():
    """
    Admin: manually adjust a user's credit balance.
    ---
    tags: [Wallet, Admin]
    """
    data = validate_payload(AdminAdjustCreditsSchema(), request.get_json(force=True) or {})
    target_user = User.objects(id=data["user_id"]).first()
    if not target_user:
        raise NotFoundError("Target user not found")
    wallet = service.admin_adjust(target_user, data["amount"], data["reason"])
    return success_response("Wallet adjusted", data=wallet.to_dict())

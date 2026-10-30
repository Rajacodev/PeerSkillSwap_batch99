"""
REST endpoint for call configuration. It returns the STUN and optional TURN
servers the browser should use. Signalling itself runs over Socket.IO.
"""
from flask import Blueprint, current_app
from flask_jwt_extended import jwt_required

from app.common.responses import success_response

calls_bp = Blueprint("calls", __name__, url_prefix="/api/calls")


@calls_bp.route("/ice-servers", methods=["GET"])
@jwt_required()
def get_ice_servers():
    """
    List the STUN and optional TURN servers for WebRTC.
    A TURN server is needed on networks that block direct peer-to-peer traffic.
    ---
    tags: [Calls]
    """
    ice_servers = [{"urls": "stun:stun.l.google.com:19302"}]
    turn_url = current_app.config.get("TURN_SERVER_URL")
    if turn_url:
        ice_servers.append(
            {
                "urls": turn_url,
                "username": current_app.config.get("TURN_USERNAME", ""),
                "credential": current_app.config.get("TURN_CREDENTIAL", ""),
            }
        )
    return success_response("ICE servers fetched", data={"ice_servers": ice_servers})

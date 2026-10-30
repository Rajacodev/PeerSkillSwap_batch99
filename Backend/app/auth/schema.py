"""
Marshmallow schemas for authentication payloads.
"""
from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6, max=128))
    role = fields.Str(
        required=False, load_default="student", validate=validate.OneOf(["student", "mentor"])
    )


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class RefreshSchema(Schema):
    refresh_token = fields.Str(required=True)


class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)


class ResetPasswordSchema(Schema):
    email = fields.Email(required=True)
    reset_token = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=validate.Length(min=6, max=128))

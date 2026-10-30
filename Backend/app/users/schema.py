from marshmallow import Schema, fields, validate


class UpdateProfileSchema(Schema):
    name = fields.Str(required=False, validate=validate.Length(min=2, max=120))
    bio = fields.Str(required=False, validate=validate.Length(max=1000))
    skills_offered = fields.List(fields.Str(), required=False)
    skills_wanted = fields.List(fields.Str(), required=False)


class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=validate.Length(min=6, max=128))

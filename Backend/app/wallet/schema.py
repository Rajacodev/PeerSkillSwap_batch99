from marshmallow import Schema, fields, validate


class AdminAdjustCreditsSchema(Schema):
    user_id = fields.Str(required=True)
    amount = fields.Int(required=True)
    reason = fields.Str(required=False, load_default="Admin adjustment")

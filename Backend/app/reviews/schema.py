from marshmallow import Schema, fields, validate


class CreateReviewSchema(Schema):
    booking_id = fields.Str(required=True)
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.Str(required=False, load_default="", validate=validate.Length(max=1000))

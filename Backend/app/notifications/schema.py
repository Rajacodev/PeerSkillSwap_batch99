from marshmallow import Schema, fields


class MarkReadSchema(Schema):
    notification_id = fields.Str(required=True)

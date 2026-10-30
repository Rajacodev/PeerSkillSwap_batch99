from marshmallow import Schema, fields


class DateRangeSchema(Schema):
    start_date = fields.DateTime(required=False)
    end_date = fields.DateTime(required=False)

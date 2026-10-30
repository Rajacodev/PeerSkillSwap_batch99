from marshmallow import Schema, fields, validate


class SetActiveStatusSchema(Schema):
    is_active = fields.Bool(required=True)


class SetSkillActiveSchema(Schema):
    is_active = fields.Bool(required=True)

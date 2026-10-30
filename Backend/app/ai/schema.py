from marshmallow import Schema, fields, validate


class RecommendSkillsSchema(Schema):
    job_title = fields.Str(required=True, validate=validate.Length(min=2, max=150))

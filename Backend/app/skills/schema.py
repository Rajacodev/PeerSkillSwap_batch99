from marshmallow import Schema, fields, validate
from app.models.skill import Skill


class CreateSkillSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=3, max=150))
    description = fields.Str(required=True, validate=validate.Length(min=10, max=2000))
    category = fields.Str(
        required=False, load_default="Other", validate=validate.OneOf(Skill.CATEGORY_CHOICES)
    )
    tags = fields.List(fields.Str(), required=False, load_default=list)
    credits_per_session = fields.Int(required=False, load_default=1, validate=validate.Range(min=1))
    duration_minutes = fields.Int(required=False, load_default=60, validate=validate.Range(min=15))


class UpdateSkillSchema(Schema):
    title = fields.Str(required=False, validate=validate.Length(min=3, max=150))
    description = fields.Str(required=False, validate=validate.Length(min=10, max=2000))
    category = fields.Str(required=False, validate=validate.OneOf(Skill.CATEGORY_CHOICES))
    tags = fields.List(fields.Str(), required=False)
    credits_per_session = fields.Int(required=False, validate=validate.Range(min=1))
    duration_minutes = fields.Int(required=False, validate=validate.Range(min=15))
    is_active = fields.Bool(required=False)

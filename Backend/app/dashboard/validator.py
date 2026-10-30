from app.common.exceptions import ValidationError


def validate_payload(schema, payload, partial=False):
    errors = schema.validate(payload, partial=partial)
    if errors:
        raise ValidationError("Invalid input", errors=errors)
    return schema.load(payload, partial=partial)

from app.common.exceptions import ValidationError


def validate_payload(schema, payload):
    errors = schema.validate(payload)
    if errors:
        raise ValidationError("Invalid input", errors=errors)
    return schema.load(payload)

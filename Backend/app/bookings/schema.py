from marshmallow import Schema, fields, validate, ValidationError


def _validate_meeting_link(value):
    if value and not value.startswith(("http://", "https://")):
        raise ValidationError("Meeting link must start with http:// or https://")


class CreateBookingSchema(Schema):
    skill_id = fields.Str(required=True)
    scheduled_at = fields.DateTime(required=True)
    notes = fields.Str(required=False, load_default="", validate=validate.Length(max=1000))


class CancelBookingSchema(Schema):
    cancellation_reason = fields.Str(
        required=False, load_default="", validate=validate.Length(max=500)
    )


class AcceptBookingSchema(Schema):
    meeting_link = fields.Str(
        required=False,
        load_default="",
        validate=[validate.Length(max=500), _validate_meeting_link],
    )


class UpdateMeetingLinkSchema(Schema):
    meeting_link = fields.Str(
        required=True,
        validate=[validate.Length(max=500), _validate_meeting_link],
    )

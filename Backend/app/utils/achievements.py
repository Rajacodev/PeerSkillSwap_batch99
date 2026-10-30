"""
Shared achievement-unlocking logic. Kept outside any single module to avoid
circular imports between bookings, reviews, and skills services.
"""
from app.models.gamification import Achievement


def _award_if_missing(user, code, title, description, notification_service=None):
    exists = Achievement.objects(user=user, code=code).first()
    if exists:
        return None
    achievement = Achievement(user=user, code=code, title=title, description=description)
    achievement.save()
    if notification_service:
        notification_service.create_notification(
            user=user,
            type_="achievement_unlocked",
            title=f"Achievement Unlocked: {title}",
            message=description,
        )
    return achievement


def check_teaching_achievements(user, sessions_taught_count, notification_service=None):
    unlocked = []
    if sessions_taught_count >= 1:
        a = _award_if_missing(
            user, "FIRST_SESSION_TAUGHT", "First Session Taught",
            "You taught your first session on PeerSkillSwap!", notification_service,
        )
        if a:
            unlocked.append(a)
    if sessions_taught_count >= 5:
        a = _award_if_missing(
            user, "FIVE_SESSIONS_TAUGHT", "Dedicated Mentor",
            "You've taught 5 sessions!", notification_service,
        )
        if a:
            unlocked.append(a)
    if sessions_taught_count >= 10:
        a = _award_if_missing(
            user, "TEN_SESSIONS_TAUGHT", "Master Mentor",
            "You've taught 10 sessions!", notification_service,
        )
        if a:
            unlocked.append(a)
    return unlocked


def check_learning_achievements(user, sessions_learned_count, notification_service=None):
    unlocked = []
    if sessions_learned_count >= 1:
        a = _award_if_missing(
            user, "FIRST_SESSION_LEARNED", "First Session Learned",
            "You completed your first learning session!", notification_service,
        )
        if a:
            unlocked.append(a)
    return unlocked


def check_review_achievements(user, notification_service=None):
    return [
        a
        for a in [
            _award_if_missing(
                user, "FIRST_REVIEW", "First Review",
                "You received your first review!", notification_service,
            )
        ]
        if a
    ]


def check_skill_creator_achievement(user, notification_service=None):
    a = _award_if_missing(
        user, "SKILL_CREATOR", "Skill Creator",
        "You created your first skill listing!", notification_service,
    )
    return [a] if a else []


def check_top_rated_achievement(user, rating_average_x10, notification_service=None):
    if rating_average_x10 >= 45:  # 4.5+
        a = _award_if_missing(
            user, "TOP_RATED_MENTOR", "Top Rated Mentor",
            "You've maintained a 4.5+ star rating!", notification_service,
        )
        return [a] if a else []
    return []

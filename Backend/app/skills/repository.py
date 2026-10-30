"""
Data access layer for skills: CRUD, search, filter, sort, trending.
"""
import datetime
from app.models.skill import Skill


class SkillRepository:
    @staticmethod
    def create(mentor, data):
        skill = Skill(mentor=mentor, **data)
        skill.save()
        return skill

    @staticmethod
    def get_by_id(skill_id):
        return Skill.objects(id=skill_id).first()

    @staticmethod
    def update(skill, updates):
        for key, value in updates.items():
            setattr(skill, key, value)
        skill.updated_at = datetime.datetime.utcnow()
        skill.save()
        return skill

    @staticmethod
    def delete(skill):
        skill.delete()

    @staticmethod
    def search(page, per_page, search="", category=None, sort_by="created_at", order="desc"):
        qs = Skill.objects(is_active=True)
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search)

        sort_field_map = {
            "created_at": "created_at",
            "credits_per_session": "credits_per_session",
            "total_bookings": "total_bookings",
            "average_rating": "average_rating",
            "title": "title",
        }
        field = sort_field_map.get(sort_by, "created_at")
        prefix = "-" if order == "desc" else ""
        qs = qs.order_by(f"{prefix}{field}")

        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def list_by_mentor(mentor, page, per_page):
        qs = Skill.objects(mentor=mentor).order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def trending(limit=10):
        return Skill.objects(is_active=True).order_by("-total_bookings")[:limit]

    @staticmethod
    def recommended_for_user(user, limit=10):
        """Recommend skills matching the user's stated 'skills_wanted' list,
        falling back to trending skills if there's no overlap."""
        if user.skills_wanted:
            matches = Skill.objects(
                is_active=True, tags__in=user.skills_wanted
            ).order_by("-total_bookings")[:limit]
            if matches.count() > 0:
                return matches
        return Skill.objects(is_active=True).order_by("-total_bookings")[:limit]

    @staticmethod
    def increment_bookings(skill):
        skill.total_bookings += 1
        skill.save()

    @staticmethod
    def update_average_rating(skill, new_average_x10):
        skill.average_rating = new_average_x10
        skill.save()

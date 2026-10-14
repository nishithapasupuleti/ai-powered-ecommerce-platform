"""
Permissions for products and seller operations.
"""

from rest_framework import permissions


class IsSellerOrReadOnly(permissions.BasePermission):
    """
    Allow safe methods for anyone.
    Allow mutations only if the user is a seller or admin.
    For object-level, allow only the product owner (or admin) to modify.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated and
            (request.user.role in ['seller', 'admin'] or request.user.is_staff)
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_staff or request.user.role == 'admin':
            return True
        return hasattr(obj, 'seller') and obj.seller == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow safe methods for all, but admin only for modifying (e.g., categories).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_staff)
        )

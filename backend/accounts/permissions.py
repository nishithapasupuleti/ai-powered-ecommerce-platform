"""
Custom permission classes for role-based authorization.
"""

from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    """Allow access only to users with the 'customer' role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'customer'
        )


class IsSeller(BasePermission):
    """Allow access only to users with the 'seller' role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'seller'
        )


class IsAdmin(BasePermission):
    """Allow access only to users with the 'admin' role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )

"""
Serializers for coupons app.
"""

from decimal import Decimal
from rest_framework import serializers
from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    """Serializer for Coupon model."""
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id',
            'code',
            'discount_type',
            'discount_value',
            'min_order_amount',
            'max_discount_amount',
            'is_active',
            'usage_limit',
            'times_used',
            'valid_from',
            'valid_until',
            'is_valid',
            'created_at',
        ]
        read_only_fields = ['id', 'times_used', 'is_valid', 'created_at']


class ApplyCouponSerializer(serializers.Serializer):
    """Serializer for applying a coupon code against an order total."""
    code = serializers.CharField(max_length=50)
    order_total = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.00'))

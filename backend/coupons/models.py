"""
Models for coupon discounts.
"""

from decimal import Decimal
from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    """Promotional coupon discount model."""

    class DiscountType(models.TextChoices):
        PERCENTAGE = 'percentage', 'Percentage'
        FIXED = 'fixed', 'Fixed'

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.PERCENTAGE
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    times_used = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'coupons'
        verbose_name = 'Coupon'
        verbose_name_plural = 'Coupons'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} ({self.discount_type}: {self.discount_value})"

    def is_valid(self):
        """Check active, within date range, usage not exceeded."""
        now = timezone.now()
        if not self.is_active:
            return False
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.usage_limit is not None and self.times_used >= self.usage_limit:
            return False
        return True

    def validate_for_order(self, order_total=None):
        """Validate coupon with informative feedback message."""
        now = timezone.now()
        if not self.is_active:
            return False, 'Coupon is not active.'
        if self.valid_from and now < self.valid_from:
            return False, 'Coupon is not yet active.'
        if self.valid_until and now > self.valid_until:
            return False, 'Coupon has expired.'
        if self.usage_limit is not None and self.times_used >= self.usage_limit:
            return False, 'Coupon usage limit has been reached.'
        if order_total is not None:
            order_val = Decimal(str(order_total))
            if order_val < self.min_order_amount:
                return False, f'Minimum order amount of ₹{self.min_order_amount} is required.'
        return True, 'Coupon applied successfully!'

    def calculate_discount(self, order_total):
        """Calculate actual discount amount based on type and caps."""
        order_val = Decimal(str(order_total))
        if order_val < self.min_order_amount:
            return Decimal('0.00')

        if self.discount_type == self.DiscountType.PERCENTAGE:
            discount = (order_val * self.discount_value) / Decimal('100.00')
            if self.max_discount_amount is not None and discount > self.max_discount_amount:
                discount = self.max_discount_amount
        else:
            discount = self.discount_value

        if discount > order_val:
            discount = order_val

        return discount.quantize(Decimal('0.01'))

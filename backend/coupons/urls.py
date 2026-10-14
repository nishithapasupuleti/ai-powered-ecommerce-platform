"""
URL configuration for coupons app.
"""

from django.urls import path
from .views import ApplyCouponView, AvailableCouponsView

urlpatterns = [
    path('apply/', ApplyCouponView.as_view(), name='coupon-apply'),
    path('available/', AvailableCouponsView.as_view(), name='coupon-available'),
]

"""
URL configuration for orders app.
"""

from django.urls import path
from .views import (
    OrderCreateView,
    OrderListView,
    OrderDetailView,
    RazorpayVerifyPaymentView,
    SellerOrdersView
)

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('seller/', SellerOrdersView.as_view(), name='order-seller-list'),
    path('verify-payment/', RazorpayVerifyPaymentView.as_view(), name='order-verify-payment'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]

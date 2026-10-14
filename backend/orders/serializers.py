"""
Serializers for Order and OrderItem.
"""

from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'quantity', 'price', 'subtotal']
        read_only_fields = ['id', 'order']


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_name', 'user_email', 'total_amount',
            'coupon_code', 'coupon_discount', 'status',
            'shipping_address', 'city', 'state', 'pincode', 'phone',
            'payment_id', 'razorpay_order_id', 'payment_status', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'total_amount', 'coupon_code', 'coupon_discount',
            'status', 'payment_id', 'payment_status', 'created_at', 'updated_at'
        ]


class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(max_length=500)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=20)
    phone = serializers.CharField(max_length=20)
    coupon_code = serializers.CharField(required=False, allow_blank=True)


class RazorpayVerifySerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(max_length=100)
    razorpay_payment_id = serializers.CharField(max_length=100)
    razorpay_signature = serializers.CharField(max_length=255)

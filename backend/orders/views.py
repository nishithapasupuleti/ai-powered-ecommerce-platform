"""
Views for order creation, listing, detail, payment verification, and seller orders.
"""

import os
import hmac
import hashlib
from decimal import Decimal
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Order, OrderItem
from .serializers import (
    OrderDetailSerializer,
    OrderCreateSerializer,
    RazorpayVerifySerializer
)
from cart.models import Cart
from coupons.models import Coupon


class OrderCreateView(APIView):
    """
    POST /api/orders/create/
    Create an order from user's current cart.
    Generates Razorpay order details (mocked if razorpay keys not present or razorpay not installed).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.select_related('product').all()
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate stock for all items
        for item in cart_items:
            if item.product.stock < item.quantity:
                return Response(
                    {'error': f'Product "{item.product.title}" has insufficient stock ({item.product.stock} available).'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        validated = serializer.validated_data
        coupon_code = validated.get('coupon_code') or request.data.get('coupon_code')
        coupon = None
        coupon_discount = Decimal('0.00')

        if coupon_code:
            coupon_code = str(coupon_code).strip()
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code)
                is_valid, err_msg = coupon.validate_for_order(cart.total_amount)
                if not is_valid:
                    return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)
                coupon_discount = coupon.calculate_discount(cart.total_amount)
            except Coupon.DoesNotExist:
                return Response({'error': 'Invalid coupon code.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            cart_total = cart.total_amount
            final_total = max(Decimal('0.00'), cart_total - coupon_discount)

            order = Order.objects.create(
                user=request.user,
                total_amount=final_total,
                coupon_code=coupon.code if coupon else None,
                coupon_discount=coupon_discount,
                status=Order.Status.PENDING,
                shipping_address=validated['shipping_address'],
                city=validated['city'],
                state=validated['state'],
                pincode=validated['pincode'],
                phone=validated['phone'],
                payment_status=Order.PaymentStatus.PENDING,
            )

            # Create order items and decrement stock
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.price,
                )
                item.product.stock -= item.quantity
                item.product.save()

            if coupon:
                coupon.times_used += 1
                coupon.save()

            # Clear cart
            cart.items.all().delete()

        # Razorpay integration
        razorpay_key_id = os.getenv('RAZORPAY_KEY_ID', '')
        razorpay_key_secret = os.getenv('RAZORPAY_KEY_SECRET', '')
        razorpay_order = None

        if razorpay_key_id and razorpay_key_secret:
            try:
                import razorpay
                client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
                razorpay_order = client.order.create({
                    'amount': int(order.total_amount * 100),  # Amount in paise
                    'currency': 'INR',
                    'receipt': f'order_rcptid_{order.id}',
                    'payment_capture': 1
                })
                order.razorpay_order_id = razorpay_order['id']
                order.save()
            except Exception as e:
                # If Razorpay client fails (e.g. network/credentials), fallback to simulated order ID
                order.razorpay_order_id = f"order_mock_{order.id}"
                order.save()
        else:
            order.razorpay_order_id = f"order_mock_{order.id}"
            order.save()

        response_data = {
            'message': 'Order created successfully!',
            'order': OrderDetailSerializer(order).data,
            'razorpay': {
                'key_id': razorpay_key_id or 'rzp_test_mock_key',
                'order_id': order.razorpay_order_id,
                'amount': int(order.total_amount * 100),
                'currency': 'INR',
            }
        }
        return Response(response_data, status=status.HTTP_201_CREATED)


class OrderListView(APIView):
    """
    GET /api/orders/ - List all orders of authenticated user.
    POST /api/orders/ - Create an order (alias for /api/orders/create/).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related('items__product')
        serializer = OrderDetailSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        return OrderCreateView().post(request)


class OrderDetailView(APIView):
    """
    GET /api/orders/<id>/
    Retrieve detail of a specific order.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order.objects.prefetch_related('items__product'), id=pk)

        # Allow buyer or seller with products in this order or admin
        user = request.user
        is_buyer = (order.user == user)
        is_seller = order.items.filter(product__seller=user).exists()
        is_admin = (user.role == 'admin' or user.is_staff)

        if not (is_buyer or is_seller or is_admin):
            return Response({'error': 'You do not have permission to view this order.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RazorpayVerifyPaymentView(APIView):
    """
    POST /api/orders/verify-payment/
    Verify Razorpay payment signature and update order status.
    Payload: {"razorpay_order_id": ..., "razorpay_payment_id": ..., "razorpay_signature": ...}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RazorpayVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        razorpay_order_id = data['razorpay_order_id']
        razorpay_payment_id = data['razorpay_payment_id']
        razorpay_signature = data['razorpay_signature']

        order = get_object_or_404(Order, razorpay_order_id=razorpay_order_id)

        razorpay_key_secret = os.getenv('RAZORPAY_KEY_SECRET', '')

        # Check signature
        is_valid = False
        if razorpay_key_secret:
            try:
                import razorpay
                client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID', ''), razorpay_key_secret))
                client.utility.verify_payment_signature({
                    'razorpay_order_id': razorpay_order_id,
                    'razorpay_payment_id': razorpay_payment_id,
                    'razorpay_signature': razorpay_signature
                })
                is_valid = True
            except Exception:
                # Manual HMAC-SHA256 verification fallback
                msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
                generated_signature = hmac.new(
                    razorpay_key_secret.encode('utf-8'),
                    msg,
                    digestmod=hashlib.sha256
                ).hexdigest()
                is_valid = hmac.compare_digest(generated_signature, razorpay_signature)
        else:
            # Test/mock mode accepts mock payments
            is_valid = True

        if is_valid:
            order.payment_id = razorpay_payment_id
            order.razorpay_signature = razorpay_signature
            order.payment_status = Order.PaymentStatus.COMPLETED
            order.status = Order.Status.CONFIRMED
            order.save()

            return Response({
                'message': 'Payment verified successfully! Order confirmed.',
                'order': OrderDetailSerializer(order).data
            }, status=status.HTTP_200_OK)
        else:
            order.payment_status = Order.PaymentStatus.FAILED
            order.save()
            return Response({'error': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)


class SellerOrdersView(APIView):
    """
    GET /api/orders/seller/
    List orders containing products belonging to the seller.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['seller', 'admin'] and not request.user.is_staff:
            return Response(
                {'error': 'Only sellers can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )

        orders = Order.objects.filter(
            items__product__seller=request.user
        ).distinct().prefetch_related('items__product')

        serializer = OrderDetailSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

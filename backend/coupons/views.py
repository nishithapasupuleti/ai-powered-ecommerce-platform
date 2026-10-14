"""
Views for coupons app.
"""

from decimal import Decimal
from django.utils import timezone
from django.db.models import F, Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Coupon
from .serializers import CouponSerializer, ApplyCouponSerializer


class ApplyCouponView(APIView):
    """
    POST /api/coupons/apply/
    Validate coupon code and return discount amount.
    Accepts {code, order_total}.
    Returns {valid, discount_amount, coupon_details, message}
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ApplyCouponSerializer(data=request.data)
        if not serializer.is_valid():
            error_msg = 'Both code and order_total are required.'
            if 'code' in serializer.errors:
                error_msg = str(serializer.errors['code'][0])
            elif 'order_total' in serializer.errors:
                error_msg = str(serializer.errors['order_total'][0])

            return Response({
                'valid': False,
                'discount_amount': 0.0,
                'coupon_details': None,
                'message': error_msg
            }, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code'].strip()
        order_total = serializer.validated_data['order_total']

        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response({
                'valid': False,
                'discount_amount': 0.0,
                'coupon_details': None,
                'message': 'Invalid coupon code.'
            }, status=status.HTTP_200_OK)

        is_valid, msg = coupon.validate_for_order(order_total)
        coupon_details = CouponSerializer(coupon).data

        if not is_valid:
            return Response({
                'valid': False,
                'discount_amount': 0.0,
                'coupon_details': coupon_details,
                'message': msg
            }, status=status.HTTP_200_OK)

        discount_amount = coupon.calculate_discount(order_total)

        return Response({
            'valid': True,
            'discount_amount': float(discount_amount),
            'coupon_details': coupon_details,
            'message': 'Coupon applied successfully!'
        }, status=status.HTTP_200_OK)


class AvailableCouponsView(APIView):
    """
    GET /api/coupons/available/
    List currently active/valid coupons (public endpoint so users can see available coupons).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        coupons = Coupon.objects.filter(
            is_active=True,
            valid_from__lte=now,
            valid_until__gte=now
        ).filter(
            Q(usage_limit__isnull=True) | Q(times_used__lt=F('usage_limit'))
        ).order_by('min_order_amount')

        serializer = CouponSerializer(coupons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

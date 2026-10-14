"""
Views for cart management: get cart, add item, update quantity, remove item, clear cart.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product


def get_or_create_user_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartDetailView(APIView):
    """
    GET /api/cart/
    Get the authenticated user's cart with items and total.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_or_create_user_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CartAddItemView(APIView):
    """
    POST /api/cart/add/
    Add product to cart or increment quantity if already in cart.
    Payload: {"product_id": <id>, "quantity": <opt default 1>}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            return Response({'error': 'quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id, is_active=True)

        if product.stock < quantity:
            return Response(
                {'error': f'Only {product.stock} items available in stock'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = get_or_create_user_cart(request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            new_qty = cart_item.quantity + quantity
            if new_qty > product.stock:
                return Response(
                    {'error': f'Cannot add {quantity} more. Stock limit of {product.stock} reached.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = new_qty
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(
            {
                'message': f'"{product.title}" added to cart',
                'cart': serializer.data
            },
            status=status.HTTP_200_OK
        )


class CartUpdateItemView(APIView):
    """
    PUT /api/cart/update/<item_id>/
    Update item quantity.
    Payload: {"quantity": <int>}
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, item_id):
        cart = get_or_create_user_cart(request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'error': 'quantity is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            cart_item.delete()
            serializer = CartSerializer(cart)
            return Response(
                {
                    'message': 'Item removed from cart',
                    'cart': serializer.data
                },
                status=status.HTTP_200_OK
            )

        if quantity > cart_item.product.stock:
            return Response(
                {'error': f'Only {cart_item.product.stock} items available in stock'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()

        serializer = CartSerializer(cart)
        return Response(
            {
                'message': 'Cart updated successfully',
                'cart': serializer.data
            },
            status=status.HTTP_200_OK
        )


class CartRemoveItemView(APIView):
    """
    DELETE /api/cart/remove/<item_id>/
    Remove item from cart.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        cart = get_or_create_user_cart(request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()

        serializer = CartSerializer(cart)
        return Response(
            {
                'message': 'Item removed from cart',
                'cart': serializer.data
            },
            status=status.HTTP_200_OK
        )


class CartClearView(APIView):
    """
    DELETE /api/cart/clear/
    Clear all items in cart.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        cart = get_or_create_user_cart(request.user)
        cart.items.all().delete()

        serializer = CartSerializer(cart)
        return Response(
            {
                'message': 'Cart cleared successfully',
                'cart': serializer.data
            },
            status=status.HTTP_200_OK
        )

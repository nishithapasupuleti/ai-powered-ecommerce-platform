"""
AI Recommendation Engine and Search Views.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.db.models import Count, Q, Avg
from django.shortcuts import get_object_or_404

from products.models import Product, Category
from products.serializers import ProductListSerializer
from orders.models import Order, OrderItem


class PersonalizedRecommendationsView(APIView):
    """
    GET /api/recommendations/for-you/
    Personalized recommendations based on user's order history, cart, and high-rated items.
    Fallback to popular/top-rated products if user is anonymous or has no history.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        recommended_products = Product.objects.none()

        if user.is_authenticated:
            # 1. Get categories of products purchased by user
            ordered_category_ids = OrderItem.objects.filter(
                order__user=user
            ).values_list('product__category_id', flat=True).distinct()

            # 2. Get categories in user's cart
            if hasattr(user, 'cart'):
                cart_category_ids = user.cart.items.values_list('product__category_id', flat=True).distinct()
                target_category_ids = set(list(ordered_category_ids) + list(cart_category_ids))
            else:
                target_category_ids = set(ordered_category_ids)

            if target_category_ids:
                # Find active products in these categories not already ordered
                purchased_product_ids = OrderItem.objects.filter(
                    order__user=user
                ).values_list('product_id', flat=True)

                recommended_products = Product.objects.filter(
                    category_id__in=target_category_ids,
                    is_active=True
                ).exclude(id__in=purchased_product_ids).order_by('-created_at')[:10]

        # Fallback if empty or unauthenticated: highest rated or trending products
        if not recommended_products.exists():
            recommended_products = Product.objects.filter(is_active=True).order_by('-created_at')[:10]

        serializer = ProductListSerializer(recommended_products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SimilarProductsView(APIView):
    """
    GET /api/recommendations/similar/<product_id>/
    Find products in the same category and within ±40% price range.
    """
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)

        min_price = float(product.price) * 0.6
        max_price = float(product.price) * 1.4

        # Products in same category and price range, excluding the product itself
        similar = Product.objects.filter(
            category=product.category,
            is_active=True,
            price__gte=min_price,
            price__lte=max_price
        ).exclude(id=product.id)[:8]

        # If few found, loosen price filter within category
        if similar.count() < 4:
            similar = Product.objects.filter(
                category=product.category,
                is_active=True
            ).exclude(id=product.id)[:8]

        serializer = ProductListSerializer(similar, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FrequentlyBoughtTogetherView(APIView):
    """
    GET /api/recommendations/frequently-bought/<product_id>/
    Products frequently purchased in the same orders as the specified product.
    Fallback to popular products in the same category.
    """
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)

        # Find orders containing this product
        order_ids = OrderItem.objects.filter(product=product).values_list('order_id', flat=True)

        # Find other products in these orders, ordered by co-occurrence frequency
        co_products = Product.objects.filter(
            order_items__order_id__in=order_ids,
            is_active=True
        ).exclude(id=product.id).annotate(
            freq=Count('order_items')
        ).order_by('-freq')[:6]

        if not co_products.exists():
            # Fallback to other items in the same category
            co_products = Product.objects.filter(
                category=product.category,
                is_active=True
            ).exclude(id=product.id).order_by('-created_at')[:6]

        serializer = ProductListSerializer(co_products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TrendingProductsView(APIView):
    """
    GET /api/recommendations/trending/
    Products with the most order items or highest number of reviews/views.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        trending = Product.objects.filter(
            is_active=True
        ).annotate(
            order_count=Count('order_items')
        ).order_by('-order_count', '-created_at')[:10]

        serializer = ProductListSerializer(trending, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SearchSuggestionsView(APIView):
    """
    GET /api/search/suggestions/?q=<query>
    AI search suggestions: matching products, matching categories, and keyword suggestions.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if not query:
            return Response({
                'suggestions': [],
                'products': [],
                'categories': []
            }, status=status.HTTP_200_OK)

        # 1. Matching categories
        matching_categories = Category.objects.filter(
            name__icontains=query
        ).values('id', 'name', 'slug')[:5]

        # 2. Matching products
        matching_products = Product.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query),
            is_active=True
        )[:8]

        product_serializer = ProductListSerializer(matching_products, many=True)

        # 3. Dynamic search keywords
        suggestions = set()
        for p in matching_products:
            # Add full title
            suggestions.add(p.title)
            # Add matching words/phrases
            words = [w.strip() for w in p.title.split() if query.lower() in w.lower()]
            for w in words:
                suggestions.add(w)

        for c in matching_categories:
            suggestions.add(c['name'])

        return Response({
            'query': query,
            'suggestions': sorted(list(suggestions))[:10],
            'categories': list(matching_categories),
            'products': product_serializer.data
        }, status=status.HTTP_200_OK)

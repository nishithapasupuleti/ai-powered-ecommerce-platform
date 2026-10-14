"""
Views for Category, Product, ProductImage, and Review.
"""

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Category, Product, ProductImage, Review
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ReviewSerializer,
)
from .permissions import IsSellerOrReadOnly, IsAdminOrReadOnly


class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Categories.
    Anyone can list/retrieve; admins can create/update/delete.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Products.
    Supports filtering by category (id, slug, or name), price range (min_price, max_price),
    search query (q or search), and seller (seller_id).
    """
    queryset = Product.objects.select_related('category', 'seller').prefetch_related('reviews', 'images').all()
    permission_classes = [IsSellerOrReadOnly]
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return ProductDetailSerializer
        return ProductListSerializer

    def get_object(self):
        """Try slug lookup first, then fall back to pk lookup."""
        lookup_value = self.kwargs.get(self.lookup_field)
        queryset = self.filter_queryset(self.get_queryset())
        # Try slug first
        obj = queryset.filter(slug=lookup_value).first()
        if obj is None and lookup_value and lookup_value.isdigit():
            # Fall back to pk
            obj = queryset.filter(pk=int(lookup_value)).first()
        if obj is None:
            from django.http import Http404
            raise Http404
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        queryset = super().get_queryset()

        # If seller view action or filter by current seller
        seller_param = self.request.query_params.get('seller')
        if seller_param:
            queryset = queryset.filter(seller_id=seller_param)

        category_param = self.request.query_params.get('category')
        if category_param:
            if category_param.isdigit():
                queryset = queryset.filter(category_id=category_param)
            else:
                # Try slug first, then name (case-insensitive)
                queryset = queryset.filter(
                    Q(category__slug=category_param) |
                    Q(category__name__iexact=category_param)
                )

        min_price = self.request.query_params.get('min_price')
        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except ValueError:
                pass

        max_price = self.request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except ValueError:
                pass

        search_query = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query)
            )

        # In non-seller/admin contexts, show only active products
        if not (self.request.user.is_authenticated and (self.request.user.role in ['seller', 'admin'] or self.request.user.is_staff)):
            queryset = queryset.filter(is_active=True)

        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_products(self, request):
        """Endpoint for sellers to view their own products."""
        products = self.get_queryset().filter(seller=request.user)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


class ProductImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing additional product images."""
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsSellerOrReadOnly]

    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        if product_id:
            return self.queryset.filter(product_id=product_id)
        return self.queryset


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product Reviews.
    Any authenticated user can create/update their review.
    """
    queryset = Review.objects.select_related('user', 'product').all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

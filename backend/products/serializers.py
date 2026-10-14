"""
Serializers for Category, Product, ProductImage, and Review.
"""

from rest_framework import serializers
from .models import Category, Product, ProductImage, Review


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image_url', 'product_count', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image_url', 'is_primary']
        read_only_fields = ['id']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'user_name', 'user_email', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        product = validated_data['product']
        review, created = Review.objects.update_or_create(
            product=product,
            user=user,
            defaults={
                'rating': validated_data['rating'],
                'comment': validated_data['comment'],
            }
        )
        return review


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'price', 'discount_price',
            'effective_price', 'category', 'category_id', 'seller', 'seller_name',
            'stock', 'image_url', 'is_active', 'average_rating', 'review_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'seller', 'created_at', 'updated_at']


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'price', 'discount_price',
            'effective_price', 'category', 'category_id', 'seller', 'seller_name',
            'stock', 'image_url', 'is_active', 'images', 'reviews',
            'average_rating', 'review_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'seller', 'created_at', 'updated_at']

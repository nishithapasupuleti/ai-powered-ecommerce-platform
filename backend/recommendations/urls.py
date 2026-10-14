"""
URL patterns for recommendations app.
"""

from django.urls import path
from .views import (
    PersonalizedRecommendationsView,
    SimilarProductsView,
    FrequentlyBoughtTogetherView,
    TrendingProductsView,
    SearchSuggestionsView,
)

urlpatterns = [
    path('recommendations/for-you/', PersonalizedRecommendationsView.as_view(), name='recommendations-for-you'),
    path('recommendations/similar/<int:product_id>/', SimilarProductsView.as_view(), name='recommendations-similar'),
    path('recommendations/frequently-bought/<int:product_id>/', FrequentlyBoughtTogetherView.as_view(), name='recommendations-frequently-bought'),
    path('recommendations/trending/', TrendingProductsView.as_view(), name='recommendations-trending'),
    path('search/suggestions/', SearchSuggestionsView.as_view(), name='search-suggestions'),
]

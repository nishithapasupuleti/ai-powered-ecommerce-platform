"""
Management command to seed the database with realistic categories, products, sellers, and reviews.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from products.models import Category, Product, ProductImage, Review

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds database with categories, products, sample sellers, and reviews.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting database seed...'))

        # 1. Create or get admin & seller & customer users
        admin_user, _ = User.objects.get_or_create(
            email='admin@ecommerce.com',
            defaults={
                'username': 'admin',
                'full_name': 'Admin User',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if not admin_user.has_usable_password():
            admin_user.set_password('admin123')
            admin_user.save()

        seller_user, _ = User.objects.get_or_create(
            email='seller@ecommerce.com',
            defaults={
                'username': 'tech_seller',
                'full_name': 'Apex Retailers',
                'role': User.Role.SELLER,
            }
        )
        if not seller_user.has_usable_password():
            seller_user.set_password('seller123')
            seller_user.save()

        seller_user2, _ = User.objects.get_or_create(
            email='seller2@ecommerce.com',
            defaults={
                'username': 'global_store',
                'full_name': 'Global Emporium',
                'role': User.Role.SELLER,
            }
        )
        if not seller_user2.has_usable_password():
            seller_user2.set_password('seller123')
            seller_user2.save()

        customer_user, _ = User.objects.get_or_create(
            email='customer@ecommerce.com',
            defaults={
                'username': 'johndoe',
                'full_name': 'John Doe',
                'role': User.Role.CUSTOMER,
            }
        )
        if not customer_user.has_usable_password():
            customer_user.set_password('customer123')
            customer_user.save()

        customer_user2, _ = User.objects.get_or_create(
            email='alice@ecommerce.com',
            defaults={
                'username': 'alicesmith',
                'full_name': 'Alice Smith',
                'role': User.Role.CUSTOMER,
            }
        )
        if not customer_user2.has_usable_password():
            customer_user2.set_password('customer123')
            customer_user2.save()

        # 2. Categories
        categories_data = [
            {
                'name': 'Electronics',
                'description': 'Latest gadgets, smart devices, laptops, headphones, and home audio.',
                'image_url': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
            },
            {
                'name': 'Fashion',
                'description': 'Trendy clothing, apparel, footwear, and designer accessories.',
                'image_url': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
            },
            {
                'name': 'Home & Kitchen',
                'description': 'Modern furniture, cookware, interior decor, and smart appliances.',
                'image_url': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
            },
            {
                'name': 'Books',
                'description': 'Bestsellers, science fiction, educational, technical, and biography books.',
                'image_url': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&auto=format&fit=crop&q=80',
            },
            {
                'name': 'Sports',
                'description': 'High-performance athletic gear, outdoor equipment, and fitness accessories.',
                'image_url': 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
            },
            {
                'name': 'Beauty',
                'description': 'Skincare essentials, cosmetics, luxury fragrances, and hair care products.',
                'image_url': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
            },
            {
                'name': 'Toys',
                'description': 'Educational toys, board games, puzzles, and children collectibles.',
                'image_url': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&auto=format&fit=crop&q=80',
            },
            {
                'name': 'Groceries',
                'description': 'Fresh organic produce, gourmet snacks, beverages, and pantry staples.',
                'image_url': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
            },
        ]

        categories_map = {}
        for cat_info in categories_data:
            cat, _ = Category.objects.update_or_create(
                name=cat_info['name'],
                defaults={
                    'slug': slugify(cat_info['name']),
                    'description': cat_info['description'],
                    'image_url': cat_info['image_url'],
                }
            )
            categories_map[cat.name] = cat
        self.stdout.write(self.style.SUCCESS(f'Created {len(categories_map)} categories.'))

        # 3. 40+ Products (5+ per category)
        products_data = [
            # Electronics
            {
                'title': 'Wireless Noise-Canceling Headphones Pro',
                'category': 'Electronics',
                'price': 249.99,
                'discount_price': 199.99,
                'stock': 45,
                'description': 'Industry-leading active noise cancellation with 40-hour battery life and spatial audio support.',
                'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Ultra-Slim 4K OLED Smart Monitor 27"',
                'category': 'Electronics',
                'price': 599.99,
                'discount_price': 529.99,
                'stock': 20,
                'description': 'Stunning 4K OLED display with 144Hz refresh rate, USB-C 90W power delivery, and HDR 600.',
                'image_url': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Mechanical Gaming Keyboard RGB',
                'category': 'Electronics',
                'price': 129.99,
                'discount_price': 99.99,
                'stock': 60,
                'description': 'Hot-swappable mechanical switches with per-key RGB backlighting and aircraft-grade aluminum frame.',
                'image_url': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Smart Fitness Watch Series 7',
                'category': 'Electronics',
                'price': 299.99,
                'discount_price': None,
                'stock': 35,
                'description': 'Comprehensive health monitoring including ECG, SpO2, sleep tracking, and built-in GPS.',
                'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Portable Waterproof Bluetooth Speaker',
                'category': 'Electronics',
                'price': 79.99,
                'discount_price': 64.99,
                'stock': 80,
                'description': 'IPX7 waterproof rating with deep bass, 24-hour continuous playtime, and rugged design.',
                'image_url': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'High-Speed Wireless Charging Pad 3-in-1',
                'category': 'Electronics',
                'price': 49.99,
                'discount_price': 39.99,
                'stock': 100,
                'description': 'Simultaneous fast charging for phone, earbuds, and smartwatch with intelligent heat control.',
                'image_url': 'https://images.unsplash.com/photo-1622445268048-261543d2c884?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },

            # Fashion
            {
                'title': 'Classic Slim Fit Denim Jacket',
                'category': 'Fashion',
                'price': 89.99,
                'discount_price': 69.99,
                'stock': 50,
                'description': 'Timeless premium denim jacket crafted from 100% durable cotton with brass button closures.',
                'image_url': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Organic Cotton Crewneck T-Shirt (Pack of 3)',
                'category': 'Fashion',
                'price': 45.00,
                'discount_price': None,
                'stock': 120,
                'description': 'Ultra-soft, breathable combed organic cotton everyday essential t-shirts.',
                'image_url': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Genuine Leather Chelsea Boots',
                'category': 'Fashion',
                'price': 159.99,
                'discount_price': 139.99,
                'stock': 30,
                'description': 'Handcrafted full-grain leather boots with flexible elastic side gussets and rubber lug outsole.',
                'image_url': 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Minimalist Waterproof Trench Coat',
                'category': 'Fashion',
                'price': 199.99,
                'discount_price': 169.99,
                'stock': 25,
                'description': 'Double-breasted weather-resistant trench coat featuring a belted waist and storm flap.',
                'image_url': 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Polarized UV400 Aviator Sunglasses',
                'category': 'Fashion',
                'price': 59.99,
                'discount_price': 44.99,
                'stock': 75,
                'description': 'Premium metal alloy frames with scratch-resistant polarized TAC lenses for glare reduction.',
                'image_url': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },

            # Home & Kitchen
            {
                'title': 'Barista Touch Espresso Machine',
                'category': 'Home & Kitchen',
                'price': 699.99,
                'discount_price': 629.99,
                'stock': 15,
                'description': 'Automated touchscreen espresso machine with integrated conical burr grinder and micro-foam steam wand.',
                'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Cast Iron Dutch Oven 6-Quart',
                'category': 'Home & Kitchen',
                'price': 119.99,
                'discount_price': 89.99,
                'stock': 40,
                'description': 'Enameled cast iron delivers superior heat retention and uniform distribution for braising and baking.',
                'image_url': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Robotic Vacuum & Mop with LiDAR Navigation',
                'category': 'Home & Kitchen',
                'price': 349.99,
                'discount_price': 299.99,
                'stock': 22,
                'description': '4000Pa intense suction with smart room mapping, obstacle avoidance, and app scheduling.',
                'image_url': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Ergonomic Memory Foam Contour Pillow',
                'category': 'Home & Kitchen',
                'price': 49.99,
                'discount_price': None,
                'stock': 85,
                'description': 'Cervical neck support pillow with cooling gel layer and removable bamboo fiber cover.',
                'image_url': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Professional Japanese Damascus Chef Knife 8"',
                'category': 'Home & Kitchen',
                'price': 129.99,
                'discount_price': 109.99,
                'stock': 35,
                'description': '67-layer VG-10 high carbon stainless steel with Pakkawood ergonomic handle.',
                'image_url': 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },

            # Books
            {
                'title': 'Designing Data-Intensive Applications',
                'category': 'Books',
                'price': 48.00,
                'discount_price': 39.99,
                'stock': 90,
                'description': 'The definitive guide to the principles and architectures of scalable, reliable software systems.',
                'image_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Artificial Intelligence: A Modern Approach',
                'category': 'Books',
                'price': 85.00,
                'discount_price': None,
                'stock': 40,
                'description': 'Comprehensive textbook introducing core theories, algorithms, and practical applications in AI.',
                'image_url': 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'The Pragmatic Programmer: 20th Anniversary Edition',
                'category': 'Books',
                'price': 44.99,
                'discount_price': 36.99,
                'stock': 70,
                'description': 'Timeless advice and modern practices for professional software developers and architects.',
                'image_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Atomic Habits by James Clear',
                'category': 'Books',
                'price': 27.00,
                'discount_price': 19.99,
                'stock': 150,
                'description': 'An easy and proven way to build good habits and break bad ones through tiny incremental changes.',
                'image_url': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Clean Code: A Handbook of Agile Software Craftsmanship',
                'category': 'Books',
                'price': 42.50,
                'discount_price': None,
                'stock': 65,
                'description': 'Learn to write clean, maintainable, readable code and identify refactoring opportunities.',
                'image_url': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },

            # Sports
            {
                'title': 'Adjustable Dumbbells Set (5-52.5 lbs)',
                'category': 'Sports',
                'price': 349.99,
                'discount_price': 299.99,
                'stock': 25,
                'description': 'Rapid selector dial allows quick resistance transitions across 15 weight variations in one compact unit.',
                'image_url': 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Non-Slip Eco-Friendly Yoga Mat 6mm',
                'category': 'Sports',
                'price': 39.99,
                'discount_price': 29.99,
                'stock': 110,
                'description': 'High-density TPE dual-layer cushioning with alignment lines and carrying strap included.',
                'image_url': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Carbon Fiber Road Bike Helmet',
                'category': 'Sports',
                'price': 119.99,
                'discount_price': None,
                'stock': 45,
                'description': 'Aerodynamic lightweight shell with MIPS impact protection and 22 high-flow ventilation channels.',
                'image_url': 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Insulated Stainless Steel Water Bottle 32oz',
                'category': 'Sports',
                'price': 29.99,
                'discount_price': 22.99,
                'stock': 140,
                'description': 'Keeps drinks cold for 24 hours or piping hot for 12 hours with double-wall vacuum insulation.',
                'image_url': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Heavy-Duty Resistance Bands Set (5 Levels)',
                'category': 'Sports',
                'price': 24.99,
                'discount_price': 18.99,
                'stock': 95,
                'description': 'Natural latex resistance loops for strength training, physical therapy, and home workouts.',
                'image_url': 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },

            # Beauty
            {
                'title': 'Hydrating Hyaluronic Acid Serum 30ml',
                'category': 'Beauty',
                'price': 28.00,
                'discount_price': 22.50,
                'stock': 130,
                'description': 'Multi-molecular weight hyaluronic acid formula enriched with vitamin B5 for intense skin hydration.',
                'image_url': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Rosewater Revitalizing Facial Mist',
                'category': 'Beauty',
                'price': 19.99,
                'discount_price': None,
                'stock': 85,
                'description': 'Organic Damask rose floral water infused with aloe and witch hazel to tone and refresh complexion.',
                'image_url': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Mineral Sunscreen SPF 50 Broad Spectrum',
                'category': 'Beauty',
                'price': 34.00,
                'discount_price': 28.00,
                'stock': 90,
                'description': 'Non-nano zinc oxide protection with sheer matte finish, non-comedogenic and reef-safe.',
                'image_url': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Luxury Botanical Scented Eau De Parfum 50ml',
                'category': 'Beauty',
                'price': 89.99,
                'discount_price': 74.99,
                'stock': 40,
                'description': 'Artisan blend of bergamot, cedarwood, amber, and jasmine with lasting silage.',
                'image_url': 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Sonic Silicone Facial Cleansing Brush',
                'category': 'Beauty',
                'price': 49.99,
                'discount_price': 39.99,
                'stock': 55,
                'description': 'Ultra-hygienic pulsating silicone bristles with 8 intensity modes for deep pore purifying.',
                'image_url': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },

            # Toys
            {
                'title': 'Programmable Robotics STEM Building Kit',
                'category': 'Toys',
                'price': 79.99,
                'discount_price': 64.99,
                'stock': 60,
                'description': 'Over 400 snap-fit blocks with sensors and motors; learn coding via interactive visual app.',
                'image_url': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Classic Wooden Train Track Set (80 Pieces)',
                'category': 'Toys',
                'price': 54.99,
                'discount_price': 44.99,
                'stock': 70,
                'description': 'Sustainably sourced beechwood interlocking tracks with magnetic engine, bridges, and city scenery.',
                'image_url': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Magnetic 3D Building Tiles Deluxe (100 Pieces)',
                'category': 'Toys',
                'price': 49.99,
                'discount_price': None,
                'stock': 85,
                'description': 'Vibrant translucent geometric shapes with strong magnets for limitless creative architectural constructions.',
                'image_url': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Remote Control High-Speed Off-Road Buggy',
                'category': 'Toys',
                'price': 69.99,
                'discount_price': 58.99,
                'stock': 35,
                'description': '4WD RC monster truck capable of 35 km/h speeds on dirt, grass, and gravel with shock absorbers.',
                'image_url': 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },
            {
                'title': 'Strategic Strategy Board Game: Empire Builder',
                'category': 'Toys',
                'price': 44.99,
                'discount_price': 34.99,
                'stock': 50,
                'description': 'Award-winning tabletop strategy game for 2-4 players with detailed miniature figures and cards.',
                'image_url': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user,
            },

            # Groceries
            {
                'title': 'Organic Cold-Pressed Extra Virgin Olive Oil 750ml',
                'category': 'Groceries',
                'price': 22.99,
                'discount_price': 18.99,
                'stock': 120,
                'description': 'First cold-pressed from single-estate Mediterranean olives with low acidity and rich aroma.',
                'image_url': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Artisan Roasted Colombian Whole Bean Coffee 1kg',
                'category': 'Groceries',
                'price': 26.50,
                'discount_price': None,
                'stock': 140,
                'description': 'Single-origin 100% Arabica beans featuring notes of dark chocolate, caramel, and citrus.',
                'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Raw Organic Wildflower Honey 500g',
                'category': 'Groceries',
                'price': 16.99,
                'discount_price': 13.99,
                'stock': 110,
                'description': 'Unfiltered and unpasteurized raw honey harvested ethically from pristine wild meadow apiaries.',
                'image_url': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Matcha Green Tea Ceremonial Grade 100g',
                'category': 'Groceries',
                'price': 32.00,
                'discount_price': 26.00,
                'stock': 65,
                'description': 'First-harvest shade-grown stone-ground Uji matcha powder packed with antioxidants and L-theanine.',
                'image_url': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
            {
                'title': 'Gourmet Mixed Nuts & Dried Berries (750g Tub)',
                'category': 'Groceries',
                'price': 19.99,
                'discount_price': 16.50,
                'stock': 100,
                'description': 'Premium blend of almonds, walnuts, cashews, cranberries, and golden raisins lightly sea salted.',
                'image_url': 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80',
                'seller': seller_user2,
            },
        ]

        created_products = []
        for p_data in products_data:
            cat_obj = categories_map[p_data['category']]
            product, _ = Product.objects.update_or_create(
                title=p_data['title'],
                defaults={
                    'slug': slugify(p_data['title']),
                    'category': cat_obj,
                    'price': p_data['price'],
                    'discount_price': p_data['discount_price'],
                    'stock': p_data['stock'],
                    'description': p_data['description'],
                    'image_url': p_data['image_url'],
                    'seller': p_data['seller'],
                    'is_active': True,
                }
            )
            created_products.append(product)

            # Extra gallery images
            ProductImage.objects.get_or_create(
                product=product,
                image_url=p_data['image_url'],
                defaults={'is_primary': True}
            )

        self.stdout.write(self.style.SUCCESS(f'Created {len(created_products)} products.'))

        # 4. Sample Reviews
        sample_reviews = [
            (5, "Absolutely top tier! Exceeded my expectations in quality and build."),
            (4, "Very pleased with this purchase. Fast shipping and as described."),
            (5, "Best in its class! Would definitely recommend to anyone looking for this."),
            (4, "Solid product. Works great and good value for money."),
            (5, "Brilliant craftsmanship. Very happy with the product."),
        ]

        review_count = 0
        for i, prod in enumerate(created_products[:20]):
            reviewer = customer_user if i % 2 == 0 else customer_user2
            rating, comment = sample_reviews[i % len(sample_reviews)]
            Review.objects.update_or_create(
                product=prod,
                user=reviewer,
                defaults={
                    'rating': rating,
                    'comment': comment
                }
            )
            review_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {review_count} sample reviews.'))

        # 5. Sample Coupons
        from datetime import timedelta
        from django.utils import timezone
        from coupons.models import Coupon

        now = timezone.now()
        valid_until = now + timedelta(days=365)

        coupons_data = [
            {
                'code': 'WELCOME10',
                'discount_type': 'percentage',
                'discount_value': 10.00,
                'min_order_amount': 500.00,
                'max_discount_amount': 200.00,
                'is_active': True,
            },
            {
                'code': 'FLAT50',
                'discount_type': 'fixed',
                'discount_value': 50.00,
                'min_order_amount': 299.00,
                'max_discount_amount': None,
                'is_active': True,
            },
            {
                'code': 'SAVE20',
                'discount_type': 'percentage',
                'discount_value': 20.00,
                'min_order_amount': 1000.00,
                'max_discount_amount': 500.00,
                'is_active': True,
            },
            {
                'code': 'MEGA100',
                'discount_type': 'fixed',
                'discount_value': 100.00,
                'min_order_amount': 999.00,
                'max_discount_amount': None,
                'is_active': True,
            },
            {
                'code': 'FIRST15',
                'discount_type': 'percentage',
                'discount_value': 15.00,
                'min_order_amount': 0.00,
                'max_discount_amount': 300.00,
                'is_active': True,
            },
            {
                'code': 'FESTIVE25',
                'discount_type': 'percentage',
                'discount_value': 25.00,
                'min_order_amount': 2000.00,
                'max_discount_amount': 1000.00,
                'is_active': True,
            },
        ]

        coupon_count = 0
        for c_data in coupons_data:
            Coupon.objects.update_or_create(
                code=c_data['code'],
                defaults={
                    'discount_type': c_data['discount_type'],
                    'discount_value': c_data['discount_value'],
                    'min_order_amount': c_data['min_order_amount'],
                    'max_discount_amount': c_data['max_discount_amount'],
                    'is_active': c_data['is_active'],
                    'valid_from': now,
                    'valid_until': valid_until,
                }
            )
            coupon_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {coupon_count} sample coupons.'))
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))

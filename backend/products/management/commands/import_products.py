import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from accounts.models import User
from products.models import Category, Product


class Command(BaseCommand):
    help = "Import products and categories from a CSV file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            default="data/products.csv",
            help="Path to the CSV file, relative to the backend directory.",
        )
        parser.add_argument(
            "--seller-id",
            type=int,
            default=2,
            help="User ID to assign as the seller.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        csv_path = Path(options["file"])

        if not csv_path.is_absolute():
            csv_path = Path.cwd() / csv_path

        if not csv_path.is_file():
            raise CommandError(f"CSV file not found: {csv_path}")

        try:
            seller = User.objects.get(pk=options["seller_id"])
        except User.DoesNotExist:
            raise CommandError(
                f"Seller ID {options['seller_id']} does not exist."
            )

        created_count = 0
        updated_count = 0

        with csv_path.open("r", encoding="utf-8-sig", newline="") as file:
            reader = csv.DictReader(file)

            required_columns = {
                "title",
                "category",
                "description",
                "price",
                "discount_price",
                "stock",
                "image_url",
            }

            if not reader.fieldnames or not required_columns.issubset(
                set(reader.fieldnames)
            ):
                raise CommandError(
                    "CSV must contain these columns: "
                    + ", ".join(sorted(required_columns))
                )

            for row_number, row in enumerate(reader, start=2):
                title = (row.get("title") or "").strip()
                category_name = (row.get("category") or "").strip()
                description = (row.get("description") or "").strip()

                if not title or not category_name or not description:
                    raise CommandError(
                        f"Row {row_number}: title, category, "
                        "and description are required."
                    )

                try:
                    price = Decimal(row["price"].strip())
                    discount_text = (row.get("discount_price") or "").strip()
                    discount_price = (
                        Decimal(discount_text) if discount_text else None
                    )
                    stock = int(row["stock"].strip())
                except (InvalidOperation, ValueError, AttributeError):
                    raise CommandError(
                        f"Row {row_number}: invalid price, discount, or stock."
                    )

                if price <= 0 or stock < 0:
                    raise CommandError(
                        f"Row {row_number}: price must be positive "
                        "and stock cannot be negative."
                    )

                if discount_price is not None and not (
                    Decimal("0") < discount_price < price
                ):
                    raise CommandError(
                        f"Row {row_number}: discount_price must be "
                        "greater than zero and less than price."
                    )

                category, _ = Category.objects.get_or_create(
                    name=category_name,
                    defaults={
                        "slug": slugify(category_name),
                        "description": f"{category_name} products",
                    },
                )

                # Match an existing product by title and seller.
                # This allows the CSV to be imported again without
                # creating duplicates for the same seller.
                product = Product.objects.filter(
                    title=title,
                    seller=seller,
                ).first()

                if product:
                    product.category = category
                    product.description = description
                    product.price = price
                    product.discount_price = discount_price
                    product.stock = stock
                    product.image_url = (row.get("image_url") or "").strip()
                    product.is_active = True
                    product.save()
                    updated_count += 1
                else:
                    Product.objects.create(
                        title=title,
                        description=description,
                        price=price,
                        discount_price=discount_price,
                        category=category,
                        seller=seller,
                        stock=stock,
                        image_url=(row.get("image_url") or "").strip(),
                        is_active=True,
                    )
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Import complete! Created: {created_count}; "
                f"Updated: {updated_count}."
            )
        )
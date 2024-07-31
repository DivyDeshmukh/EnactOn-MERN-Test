//@ts-nocheck
"use server";

import { sql } from "kysely";
import { DEFAULT_PAGE_SIZE } from "../../constant";
import { db } from "../../db";
import { InsertProducts, Products, UpdateProducts } from "@/types";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/utils/authOptions";
import { cache } from "react";

export async function getProducts(
  pageNo = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  priceRangeTo,
  categoryIds,
  brandIds,
  gender,
  occassions,
  discount,
  sortBy
) {
  try {
    let products;
    let dbQuery = db.selectFrom("products").selectAll("products");

    if (priceRangeTo !== undefined) {
      dbQuery = dbQuery.where("price", "<=", priceRangeTo);
    }

    // if (categoryIds) {
    // const categoryIdsArray = categoryIds
    //   .split(",")
    //   .map((id) => parseInt(id, 10));
    //   dbQuery = dbQuery
    //     .innerJoin(
    //       "product_categories",
    //       "product.id",
    //       "product_categories.product_id"
    //     )
    //     .where("product_categories.category_id", "in", categoryIdsArray);
    //   // console.log("CategoryIds:", categoryIds, "DbQuery: ", dbQuery);
    //   console.log(categoryIdsArray);
    // }

    // if (brandIds) {
    //   console.log("BrandIds: ", brandIds);
    //   const brandIdsArray = brandIds.split(",").map((id) => parseInt(id, 10));
    //   console.log("BrandIds: ", brandIdsArray);
    // dbQuery = dbQuery.where(sql`FIND_IN_SET(brands, ${brandIdsArray})`);
    // }

    if (gender) {
      dbQuery = dbQuery.where("gender", "=", gender);
    }

    if (occassions) {
      // const occassionsArray = occassions.split(",");
      console.log("Occassions: ", occassions);
      // TODO: Query
      dbQuery = dbQuery.where("occasion", "=", occassions);
    }

    if (discount) {
      console.log("Discount: ", discount.split("-")[1]);
      const start = +discount.split("-")[0];
      const end = +discount.split("-")[1];

      dbQuery = dbQuery.where((eb) => eb.between("discount", start, end));
    }

    if (sortBy) {
      const [column, order] = sortBy.split("-");
      console.log(column, order);
      dbQuery = dbQuery.orderBy(column, order);
    }
    console.log(dbQuery);

    const countResult = await dbQuery.execute();
    // const countResult = dbQuery
    //   .where(priceRangeTo !== undefined ? "price <= " + priceRangeTo : sql`1=1`) // Apply same filters
    //   .where(gender ? "gender = " + gender : sql`1=1`)
    //   .where(occassions ? "occasion = " + occassions : sql`1=1`)
    //   .where(discount ? sql`discount BETWEEN ${start} AND ${end}` : sql`1=1`)
    //   .select((eb) => eb.fn.countAll());

    const count = countResult.length || 0;

    const lastPage = Math.ceil(count / pageSize);
    console.log("Count:", countResult.length + 1, "lastPage: ", lastPage);

    products = await dbQuery
      .distinct()
      .offset((pageNo - 1) * pageSize)
      .limit(pageSize)
      .execute();

    const numOfResultsOnCurPage = products.length;

    return { products, count, lastPage, numOfResultsOnCurPage };
  } catch (error) {
    throw error;
  }
}

export const getProduct = cache(async function getProduct(productId: number) {
  // console.log("run");
  try {
    const product = await db
      .selectFrom("products")
      .selectAll()
      .where("id", "=", productId)
      .execute();

    return product;
  } catch (error) {
    return { error: "Could not find the product" };
  }
});

async function enableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 1`.execute(db);
}

async function disableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 0`.execute(db);
}

export async function deleteProduct(productId: number) {
  try {
    await disableForeignKeyChecks();
    await db
      .deleteFrom("product_categories")
      .where("product_categories.product_id", "=", productId)
      .execute();
    await db
      .deleteFrom("reviews")
      .where("reviews.product_id", "=", productId)
      .execute();

    await db
      .deleteFrom("comments")
      .where("comments.product_id", "=", productId)
      .execute();

    await db.deleteFrom("products").where("id", "=", productId).execute();

    await enableForeignKeyChecks();
    revalidatePath("/products");
    return { message: "success" };
  } catch (error) {
    return { error: "Something went wrong, Cannot delete the product" };
  }
}

export async function MapBrandIdsToName(brandsId) {
  const brandsMap = new Map();
  try {
    for (let i = 0; i < brandsId.length; i++) {
      const brandId = brandsId.at(i);
      const brand = await db
        .selectFrom("brands")
        .select("name")
        .where("id", "=", +brandId)
        .executeTakeFirst();
      brandsMap.set(brandId, brand?.name);
    }
    return brandsMap;
  } catch (error) {
    throw error;
  }
}

export async function getAllProductCategories(products: any) {
  try {
    const productsId = products.map((product) => product.id);
    const categoriesMap = new Map();

    for (let i = 0; i < productsId.length; i++) {
      const productId = productsId.at(i);
      const categories = await db
        .selectFrom("product_categories")
        .innerJoin(
          "categories",
          "categories.id",
          "product_categories.category_id"
        )
        .select("categories.name")
        .where("product_categories.product_id", "=", productId)
        .execute();
      categoriesMap.set(productId, categories);
    }
    return categoriesMap;
  } catch (error) {
    throw error;
  }
}

export async function getProductCategories(productId: number) {
  try {
    const categories = await db
      .selectFrom("product_categories")
      .innerJoin(
        "categories",
        "categories.id",
        "product_categories.category_id"
      )
      .select(["categories.id", "categories.name"])
      .where("product_categories.product_id", "=", productId)
      .execute();

    return categories;
  } catch (error) {
    throw error;
  }
}

export async function addProduct(productData: Products): {
  insertId: number | bigint;
} {
  console.log("ProductData: ", productData);
  const {
    name,
    description,
    price,
    rating,
    old_price,
    discount,
    colors,
    brands,
    gender,
    occasion,
    image_url,
  } = productData;
  console.log("name:", name);

  try {
    const add = await db
      .insertInto("products")
      .values({
        name,
        description,
        price,
        rating,
        old_price,
        discount,
        colors,
        brands,
        gender,
        occasion,
        image_url,
      })
      .executeTakeFirst();
    console.log("add: ", add);

    return {
      insertId: add.insertId,
    };
  } catch (error) {
    throw error;
  }
}

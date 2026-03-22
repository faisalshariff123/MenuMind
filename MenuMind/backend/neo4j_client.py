from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

class Neo4jClient:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI"),
            auth=(os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))
        )

    def close(self):
        self.driver.close()

    # ---- WRITE ----

    def create_restaurant(self, restaurant_id, name, location):
        with self.driver.session() as session:
            session.run("""
                MERGE (r:Restaurant {id: $id})
                SET r.name = $name, r.location = $location
            """, id=restaurant_id, name=name, location=location)

    def create_menu_item(self, restaurant_id, category, item):
        with self.driver.session() as session:
            session.run("""
                MATCH (r:Restaurant {id: $restaurant_id})
                MERGE (c:Category {name: $category, restaurant_id: $restaurant_id})
                MERGE (r)-[:HAS_CATEGORY]->(c)
                CREATE (m:MenuItem {
                    name: $name,
                    price: $price,
                    description: $description,
                    enriched_description: $enriched,
                    restaurant_id: $restaurant_id
                })
                MERGE (c)-[:HAS_ITEM]->(m)
            """,
                restaurant_id=restaurant_id,
                category=category,
                name=item["name"],
                price=item["price"],
                description=item["description"],
                enriched=item.get("enriched_description", "")
            )

            for ingredient in item.get("ingredients", []):
                session.run("""
                    MATCH (m:MenuItem {name: $name, restaurant_id: $rid})
                    MERGE (i:Ingredient {name: $ingredient})
                    MERGE (m)-[:HAS_INGREDIENT]->(i)
                """, name=item["name"], rid=restaurant_id, ingredient=ingredient)

            for tag in item.get("dietary_tags", []):
                session.run("""
                    MATCH (m:MenuItem {name: $name, restaurant_id: $rid})
                    MERGE (t:DietaryTag {name: $tag})
                    MERGE (m)-[:TAGGED_AS]->(t)
                """, name=item["name"], rid=restaurant_id, tag=tag)

    # ---- READ ----

    def neo4j_cheapest_by_category(self, restaurant_id, category):
        with self.driver.session() as session:
            result = session.run("""
                MATCH (r:Restaurant {id: $rid})-[:HAS_CATEGORY]->(c:Category)-[:HAS_ITEM]->(m:MenuItem)
                WHERE toLower(c.name) CONTAINS toLower($category)
                OPTIONAL MATCH (m)-[:HAS_INGREDIENT]->(i:Ingredient)
                OPTIONAL MATCH (m)-[:TAGGED_AS]->(t:DietaryTag)
                RETURN m.name as name, m.price as price,
                       m.description as description,
                       m.enriched_description as enriched,
                       c.name as category,
                       collect(distinct i.name) as ingredients,
                       collect(distinct t.name) as tags
                ORDER BY m.price ASC
                LIMIT 1
            """, rid=restaurant_id, category=category)
            return [dict(r) for r in result]

    def neo4j_under_price(self, restaurant_id, max_price):
        with self.driver.session() as session:
            result = session.run("""
                MATCH (r:Restaurant {id: $rid})-[:HAS_CATEGORY]->(c:Category)-[:HAS_ITEM]->(m:MenuItem)
                WHERE m.price <= $max_price
                OPTIONAL MATCH (m)-[:HAS_INGREDIENT]->(i:Ingredient)
                OPTIONAL MATCH (m)-[:TAGGED_AS]->(t:DietaryTag)
                RETURN m.name as name, m.price as price,
                       m.description as description,
                       m.enriched_description as enriched,
                       c.name as category,
                       collect(distinct i.name) as ingredients,
                       collect(distinct t.name) as tags
                ORDER BY m.price ASC
            """, rid=restaurant_id, max_price=float(max_price))
            return [dict(r) for r in result]

    def neo4j_without_allergens(self, restaurant_id, allergens):
        with self.driver.session() as session:
            result = session.run("""
                MATCH (r:Restaurant {id: $rid})-[:HAS_CATEGORY]->(c:Category)-[:HAS_ITEM]->(m:MenuItem)
                WHERE NOT EXISTS {
                    MATCH (m)-[:HAS_INGREDIENT]->(i:Ingredient)
                    WHERE toLower(i.name) IN $allergens
                }
                OPTIONAL MATCH (m)-[:HAS_INGREDIENT]->(i:Ingredient)
                OPTIONAL MATCH (m)-[:TAGGED_AS]->(t:DietaryTag)
                RETURN m.name as name, m.price as price,
                       m.description as description,
                       m.enriched_description as enriched,
                       c.name as category,
                       collect(distinct i.name) as ingredients,
                       collect(distinct t.name) as tags
            """, rid=restaurant_id, allergens=[a.lower() for a in allergens])
            return [dict(r) for r in result]

    def neo4j_by_category(self, restaurant_id, category):
        with self.driver.session() as session:
            result = session.run("""
                MATCH (r:Restaurant {id: $rid})-[:HAS_CATEGORY]->(c:Category)-[:HAS_ITEM]->(m:MenuItem)
                WHERE toLower(c.name) CONTAINS toLower($category)
                OPTIONAL MATCH (m)-[:HAS_INGREDIENT]->(i:Ingredient)
                OPTIONAL MATCH (m)-[:TAGGED_AS]->(t:DietaryTag)
                RETURN m.name as name, m.price as price,
                       m.description as description,
                       m.enriched_description as enriched,
                       c.name as category,
                       collect(distinct i.name) as ingredients,
                       collect(distinct t.name) as tags
            """, rid=restaurant_id, category=category)
            return [dict(r) for r in result]

    def neo4j_search_name(self, restaurant_id, keyword):
        with self.driver.session() as session:
            result = session.run("""
                MATCH (r:Restaurant {id: $rid})-[:HAS_CATEGORY]->(c:Category)-[:HAS_ITEM]->(m:MenuItem)
                WHERE toLower(m.name) CONTAINS toLower($keyword)
                   OR toLower(m.description) CONTAINS toLower($keyword)
                   OR toLower(m.enriched_description) CONTAINS toLower($keyword)
                OPTIONAL MATCH (m)-[:HAS_INGREDIENT]->(i:Ingredient)
                OPTIONAL MATCH (m)-[:TAGGED_AS]->(t:DietaryTag)
                RETURN m.name as name, m.price as price,
                       m.description as description,
                       m.enriched_description as enriched,
                       c.name as category,
                       collect(distinct i.name) as ingredients,
                       collect(distinct t.name) as tags
            """, rid=restaurant_id, keyword=keyword)
            return [dict(r) for r in result]

neo4j_client = Neo4jClient()
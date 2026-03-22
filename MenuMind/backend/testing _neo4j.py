from neo4j_client import neo4j_client

neo4j_client.create_restaurant("test_001", "Test Restaurant", "Hayward CA")
print("✅ Neo4j connected and working!")
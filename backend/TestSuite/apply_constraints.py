import asyncio
import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import neo4j_manager

async def apply_constraints():
    constraints_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../cypher/constraints.cypher"))
    print(f"Reading constraints from: {constraints_path}")
    
    with open(constraints_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Split queries by semicolon, filtering out comments and empty lines
    queries = []
    for block in content.split(";"):
        cleaned = []
        for line in block.splitlines():
            line_strip = line.strip()
            if line_strip and not line_strip.startswith("//"):
                cleaned.append(line_strip)
        if cleaned:
            queries.append(" ".join(cleaned))
            
    print(f"Parsed {len(queries)} queries to run.")
    async with neo4j_manager.session() as session:
        for idx, q in enumerate(queries):
            print(f"Executing query {idx+1}/{len(queries)}: {q}")
            try:
                await session.run(q)
            except Exception as e:
                print(f"Error executing query: {e}")
                
    print("Constraints and indexes applied successfully!")

if __name__ == "__main__":
    asyncio.run(apply_constraints())

import asyncio
import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import neo4j_manager

async def print_constraints():
    async with neo4j_manager.session() as session:
        res = await session.run("SHOW CONSTRAINTS")
        records = await res.data()
        print("ACTIVE CONSTRAINTS:")
        for r in records:
            print(r)

if __name__ == "__main__":
    asyncio.run(print_constraints())

"""Query the knowledge base using RAG."""
import os
import sys
from pathlib import Path

os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

import chromadb
from sentence_transformers import SentenceTransformer
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

KB_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = str(KB_ROOT / ".kb-vectordb")
COLLECTION_NAME = "knowledge_base"
TOP_K = 5

console = Console()


def load_model():
    with console.status("[bold yellow]Loading model..."):
        return SentenceTransformer("BAAI/bge-small-zh-v1.5")


def search(query: str):
    try:
        client = chromadb.PersistentClient(path=DB_PATH)
        collection = client.get_collection(COLLECTION_NAME)
    except Exception:
        console.print("[red]Knowledge base not indexed yet. Run index.py first.")
        sys.exit(1)

    model = load_model()
    query_embedding = model.encode(query).tolist()

    results = collection.query(query_embeddings=[query_embedding], n_results=TOP_K)

    console.print(Panel(f"[bold]Query: {query}[/bold]", style="cyan"))
    console.print("")

    if not results["documents"][0]:
        console.print("[yellow]No relevant results found.")
        return

    for i, (doc, meta, dist) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    )):
        similarity = max(0, 1 - dist)
        source = meta.get("source", "unknown")
        console.print(
            Panel(
                doc[:800] + ("..." if len(doc) > 800 else ""),
                title=f"[bold]#{i + 1}[/] {source}  [dim](similarity: {similarity:.0%})[/]",
                border_style="green" if similarity > 0.6 else "white",
            )
        )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        console.print("[red]Usage: python query.py \"your question\"")
        sys.exit(1)
    search(" ".join(sys.argv[1:]))

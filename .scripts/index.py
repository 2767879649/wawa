"""Index knowledge base .md files into ChromaDB."""
import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime

# Use hf-mirror.com for China accessibility
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn

KB_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = str(KB_ROOT / ".kb-vectordb")
COLLECTION_NAME = "knowledge_base"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100

console = Console()


def load_model():
    with console.status("[bold yellow]Loading embedding model..."):
        return SentenceTransformer("BAAI/bge-small-zh-v1.5")


def split_markdown(content: str, source: str) -> list[dict]:
    """Split markdown into chunks with metadata."""
    chunks = []
    paragraphs = re.split(r"\n\n+", content)
    current = ""
    chunk_idx = 0

    for para in paragraphs:
        if len(current) + len(para) < CHUNK_SIZE:
            current += para + "\n\n"
        else:
            if current.strip():
                chunks.append({"text": current.strip(), "source": source, "chunk": chunk_idx})
                chunk_idx += 1
            current = para + "\n\n"

    if current.strip():
        chunks.append({"text": current.strip(), "source": source, "chunk": chunk_idx})

    return chunks


def index_kb():
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    model = load_model()

    # Remove old collection and re-create
    try:
        chroma_client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = chroma_client.create_collection(name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"})

    # Gather markdown files
    md_files = list(KB_ROOT.glob("**/*.md"))
    md_files = [f for f in md_files if ".scripts" not in str(f) and ".kb-vectordb" not in str(f)]

    all_chunks = []
    for f in md_files:
        rel = str(f.relative_to(KB_ROOT))
        content = f.read_text(encoding="utf-8", errors="ignore")
        chunks = split_markdown(content, rel)
        all_chunks.extend(chunks)

    console.print(f"[cyan]Found {len(md_files)} files, split into {len(all_chunks)} chunks")

    BATCH = 64
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), BarColumn(), TextColumn("[progress.percentage]{task.percentage:>3.0f}%")) as progress:
        task = progress.add_task("[green]Indexing...", total=len(all_chunks))

        for i in range(0, len(all_chunks), BATCH):
            batch = all_chunks[i:i + BATCH]
            texts = [c["text"] for c in batch]
            embeddings = model.encode(texts, show_progress_bar=False).tolist()
            ids = [f"kb_{i+j}" for j in range(len(batch))]
            metadatas = [{"source": c["source"], "chunk": c["chunk"]} for c in batch]

            collection.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
            progress.update(task, advance=len(batch))

    console.print(f"[bold green]Indexed {len(all_chunks)} chunks into ChromaDB at {DB_PATH}")
    console.print(f"[dim]Collection: {COLLECTION_NAME}, Documents: {collection.count()}")


if __name__ == "__main__":
    index_kb()

# cow

RAG local, en TypeScript, sobre el corpus cerrado `rag-datasets/rag-mini-wikipedia`. Indexa los pasajes, busca en ellos y responde citando el `id` del pasaje. No consulta Wikipedia en vivo y no usa lo que el modelo recuerde de su entrenamiento.

Lee `MEMORY.md` al empezar trabajo de implementación. Actualízalo en el mismo cambio cuando cierres una decisión, termines una etapa o el estado deje de ser verdad. No implementes una etapa que `MEMORY.md` todavía marca como no planeada.

## Qué está cerrado

Una sola aplicación Node. Un solo paquete npm. Sin monorepo y sin Python.

El índice es un archivo `data/rag.db` que no se versiona. `better-sqlite3` lo abre. FTS5 busca por palabras. `sqlite-vec` guarda los vectores de 384 dimensiones. La fusión de las dos listas es código del repo, Reciprocal Rank Fusion con `k = 60`: veinte resultados vectoriales, veinte léxicos, cinco finales. No se añade Chroma, Qdrant, pgvector, Docker ni Redis.

Los embeddings son locales, con `@huggingface/transformers` y `bge-small-en-v1.5`. El mismo código embebe pasajes y preguntas. A la pregunta se le antepone `Represent this sentence for searching relevant passages: `. Al pasaje, no. Otra librería u otro modelo invalidan el índice.

El modelo de lenguaje entra solo al final, por el cliente `openai` apuntando a un servidor compatible. La URL, la clave y el nombre del modelo salen de `LLM_BASE_URL`, `LLM_API_KEY` y `LLM_MODEL`. Ollama es opcional y no es una dependencia. Si el contexto no sostiene la respuesta, el modelo se abstiene. `zod` exige tres campos: texto, ids citados y si se abstuvo.

La API es Hono: `POST /ask`. La página es Vite, sin React: pregunta, respuesta y pasajes recuperados, con una atribución CC-BY-3.0. En desarrollo Vite reenvía `/ask` a Hono. En producción Hono sirve lo que Vite compiló.

`hyparquet` y `@huggingface/hub` bajan y leen los Parquet. Se fija la revisión y se anota en `MEMORY.md`. No se usa la librería Python `datasets`.

## Dataset

Hay dos tablas y no se relacionan.

| Tabla | Filas | Uso |
| --- | --- | --- |
| `passages` | 3.200 | Se indexa. Columnas `id`, `passage`. |
| `test` | 918 | Solo evaluación. Columnas `id`, `question`, `answer`. |

El `id` de una pregunta no es el `id` de un pasaje. No inventes pasajes relevantes de oro ni calcules `recall@k` como si existieran. No indexes las preguntas ni las respuestas.

Antes de indexar, repara el mojibake reinterpretando Latin-1 como UTF-8 y, si la fila se rompe, déjala. Descarta pasajes de menos de 80 caracteres. Esos restos no se evalúan como si fueran documentos perdidos.

Las preguntas de evaluación se separan en tres grupos. No se promedian juntos.

- Hecho: la respuesta no es sí/no y la pregunta nombra la entidad. Mide si la respuesta esperada aparece en el top 5.
- Sí/no: la palabra `yes` o `no` dentro de un pasaje no mide nada.
- Anáfora: `he`, `his`, `she` y equivalentes apuntan a un artículo cuyo título se perdió. Un fallo aquí no es un fallo del retriever. Reescribir la pregunta con el historial del chat no lo arregla.

La evaluación de generación, coincidencia normalizada y F1 de tokens, se informa aparte de la de búsqueda. Una muestra son 50 preguntas. `eval` es un comando, no un test de Vitest: gasta llamadas al modelo.

## Qué no se construye

LangChain, LlamaIndex, un reranker, agentes, cuentas, PDFs, conversación multiturno, grafo, BM25 aparte de FTS5, ni una segunda base vectorial. Python solo volvería como un proceso que embebe, y solo si el modelo no existe en ONNX. Eso exige una decisión nueva en `MEMORY.md`, no un segundo RAG.

No limpies el corpus más allá del mojibake y del filtro de largo. No añadas Tailwind ni un framework de UI.

## Reglas de implementación

- Identificadores, comentarios y la página van en inglés. El corpus y las preguntas están en inglés. `AGENTS.md` y `MEMORY.md` siguen en español.
- Comenta solo lo que el código no dice: el prefijo de BGE, la desconexión de ids, el grupo anafórico.
- No versiones `data/`, `.env`, la caché del modelo ni `node_modules/`.
- No escribas secretos en el repo. `LLM_API_KEY` vive solo en el entorno.
- Vitest cubre reparación de texto, filtro de pasajes y fusión de rankings. No mockees el modelo para simular que el RAG funciona.
- Una etapa termina cuando se puede ejecutar el criterio escrito en `MEMORY.md`, no cuando el archivo existe.
- Si una decisión de este archivo deja de servir, cámbiala aquí y registra el motivo en `MEMORY.md` antes de escribir el código que la contradice.

# MEMORY

Estado vivo del proyecto. Si esto contradice el repo, gana el repo y este archivo se corrige. Las reglas estables están en `AGENTS.md`.

## Ahora

Etapa 1 terminada. El corpus se busca por palabras. No hay vectores, modelo de lenguaje ni página.

Última actualización: 2026-10-13.

## Decisiones cerradas

- Producto: RAG de corpus cerrado sobre `rag-datasets/rag-mini-wikipedia`, con citas por `id` de pasaje y abstención.
- Runtime: Node y TypeScript, un paquete npm. Sin Python y sin monorepo.
- Índice: `data/rag.db`, fuera de git. `better-sqlite3`, FTS5 y `sqlite-vec`.
- Búsqueda: top 20 vectorial, top 20 léxico, fusión RRF con `k = 60`, top 5.
- Embeddings: `bge-small-en-v1.5` vía `@huggingface/transformers`. Prefijo de BGE solo en la pregunta.
- Generación: cliente `openai` compatible. Variables `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`. Salida validada con `zod`.
- Superficie: Hono `POST /ask` y una página Vite, sin React, con atribución CC-BY-3.0.
- Datos: Parquet por `@huggingface/hub` y `hyparquet`, revisión fijada cuando se descargue.
- Ingesta: reparar mojibake y descartar pasajes de menos de 80 caracteres. No indexar la tabla `test`.
- Evaluación: 50 preguntas, separadas en hecho, sí/no y anáfora. Sin `recall@k` contra pasajes de oro, porque no existen.

## Hechos del dataset que no hay que redescubrir

- `passages`: 3.200 filas, `id` y `passage`. `test`: 918 filas, `id`, `question` y `answer`. Los ids no se unen.
- Licencia CC-BY-3.0. Hay que atribuir en la página.
- El texto trae mojibake (`RÃ­o`) y pasajes basura (`Map of Uruguay`).
- Muchas preguntas dicen `his` o `he` porque el título del artículo se perdió al separar las tablas.

## Abierto

- Proveedor concreto del modelo de lenguaje. La interfaz ya está cerrada. Falta elegir API u Ollama al probar la generación.
- Corte de la etapa 2. No se implementa hasta acordarla.

## Hecho

- 2026-10-13: se fijó el corpus, el corte TypeScript de punta a punta, el tooling y las reglas de evaluación.
- 2026-10-13: se escribieron `AGENTS.md` y `MEMORY.md`.
- 2026-10-13: etapa 1. Revisión `1f9f3b53fbc5995b85aab8e993504ad42c5f16f6`. Ingesta: 2.636 pasajes, 564 descartados por largo, 918 preguntas fuera del índice. El pasaje más corto mide 80 caracteres. `Map of Uruguay` no está en la tabla. `npm run search -- Lincoln` devuelve pasajes que contienen ese nombre.

## Etapa 1

Terminada el 2026-10-13. Corpus buscable por palabras: paquete Node, descarga fijada, mojibake, filtro de 80 caracteres, FTS5 y `npm run search`.

## Siguiente

Planear la etapa 2 con el usuario. No crear el índice vectorial ni `POST /ask` antes de eso.

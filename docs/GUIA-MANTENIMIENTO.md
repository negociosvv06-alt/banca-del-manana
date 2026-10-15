# Guía de mantenimiento – Banca del Mañana

*Para Vladimir Vergara. Actualizada el 11 de octubre de 2026. Horas en hora de Panamá (UTC-5).*

Esta guía explica, sin necesidad de saber programar, cómo funciona el portal, qué se actualiza solo y cómo hacer cambios.

## 1. Enlaces importantes

| Qué | Enlace |
|---|---|
| Sitio principal (Cloudflare) | https://banca-del-manana-web.negociosvv06.workers.dev/ |
| Copia en GitHub Pages | https://negociosvv06-alt.github.io/banca-del-manana/ |
| Repositorio (código y contenido) | https://github.com/negociosvv06-alt/banca-del-manana |
| Historial de automatizaciones (GitHub Actions) | https://github.com/negociosvv06-alt/banca-del-manana/actions |
| Panel de Cloudflare (cuenta negociosvv06@gmail.com) | https://dash.cloudflare.com/ → Workers & Pages → **banca-del-manana-web** |
| Métricas del Worker (visitas/solicitudes) | Panel de Cloudflare → banca-del-manana-web → pestaña **Metrics** |
| Cloudflare Web Analytics | https://dash.cloudflare.com/ → **Analytics & Logs → Web Analytics** (agregar el sitio si aún no está) |

## 2. Cómo está organizado el proyecto

| Carpeta / archivo | Para qué sirve |
|---|---|
| `content/articles/` | **Artículos** (un archivo `.json` por artículo). Aquí llega el artículo diario "Banca e IA". |
| `src/data/news-panama.json` | Noticias de Panamá (se cargan a mano). |
| `src/data/news-intl.json` | Noticias internacionales (se generan solas desde Fed, BCE y BIS). No editar a mano. |
| `src/data/banks.json` | Directorio de bancos. |
| `src/data/indicators.json` | Indicadores del sistema bancario de la portada. |
| `src/data/glossary.json` | Glosario financiero. |
| `src/data/sources.json` | Lista de fuentes y su tipo (RSS, API o manual). |
| `src/pages/`, `src/components/`, `src/lib/` | Código del sitio (diseño, páginas, calculadoras). |
| `.github/workflows/` | Automatizaciones de GitHub. |
| `wrangler.jsonc` | Configuración de Cloudflare. |
| `docs/` | Documentación (esta guía). |

## 3. Cómo agregar o editar contenido

**Regla de oro:** cada dato necesita fuente con enlace `https://` y fecha. Si no se puede verificar, no se publica (o se marca "Pendiente de verificación"). Si un archivo tiene un error, la publicación se detiene y el sitio anterior sigue en línea; no se rompe nada.

### 3.1 Artículo nuevo
Crear `content/articles/AAAA-MM-DD-identificador.json` con esta plantilla:

```json
{
  "id": "banca-e-ia-2026-10-12",
  "section": "fintech",
  "type": "educativo",
  "title": "Título del artículo",
  "date": "2026-10-12",
  "author": "Vladimir Vergara, autor de Banca del Mañana",
  "aiAssisted": true,
  "sources": [{ "name": "Nombre de la fuente", "url": "https://...", "date": "2026-10-12" }],
  "body": ["Primer párrafo.", "Segundo párrafo."]
}
```

- `id`: solo minúsculas, números y guiones; no se puede repetir. Forma la dirección `/articulo/<id>`.
- `section`: `inversiones`, `pagos`, `fintech`, `educacion`, `avanzadas` u `opinion`.
- `type`: `noticia`, `analisis`, `opinion`, `educativo` o `patrocinado`.
- `aiAssisted`: `true` muestra la etiqueta "Contenido elaborado con asistencia de IA, revisado editorialmente".
- `body`: cada texto entre comillas es un párrafo, separados por comas.
- Para **editar** un artículo, abra su archivo y cambie el texto. Para **quitarlo**, borre el archivo.

### 3.2 Noticia de Panamá
En `src/data/news-panama.json`, copie un bloque `{ ... }` existente, péguelo al inicio de la lista (después del `[`) y cambie:
`id` (único), `title`, `summary`, `date` (fecha de publicación de la fuente), `source` (medio), `url`, `category` (`regulacion`, `sistema`, `bancos`, `pagos`, `credito`, `tecnologia`, `ciberseguridad`, `economia`), `type`, `country`, `banks` (ids de banks.json, p. ej. `["caja-de-ahorros"]` o `[]`), `tags`.

### 3.3 Bancos
En `src/data/banks.json`, cada banco tiene `id`, `name`, `type`, `license`, `website`, `channels`, `notes`. Cambie `license` de "Pendiente de verificación" al dato exacto solo después de verificarlo en el registro de la Superintendencia de Bancos.

### 3.4 Indicadores
En `src/data/indicators.json`, cada indicador tiene `label`, `value`, `unit`, `change`, `period`, `source`, `url`, `published`. Actualícelos cuando la SBP publique un nuevo Informe de Actividad Bancaria y cambie `asOf`.

### 3.5 Glosario
En `src/data/glossary.json` agregue `{"term":"Término","def":"Definición."},` en cualquier lugar de la lista (se ordena solo).

## 4. Editar desde el celular (sin instalar nada)
1. Abra https://github.com/negociosvv06-alt/banca-del-manana en el navegador e inicie sesión con la cuenta **negociosvv06-alt**.
2. Entre a la carpeta y al archivo (por ejemplo `content/articles`).
3. **Editar:** toque el **ícono del lápiz** (✏️), haga el cambio, toque **Commit changes** → deje "Commit directly to the main branch" → **Commit changes**.
4. **Archivo nuevo:** en la carpeta, toque **Add file → Create new file**, escriba el nombre (`2026-10-12-mi-articulo.json`), pegue la plantilla, complete y haga **Commit changes**.
5. En 2–3 minutos el cambio aparece en el sitio. Si algo falló, verá una ✗ roja en la pestaña **Actions** (el sitio anterior sigue funcionando); corrija el archivo o pídame ayuda.

Consejo: cuide las comillas `"` y las comas entre elementos; es el error más común.

## 5. Cómo pedirme cambios al asistente (Grok Bot)
Escríbame en el chat lo que quiere, por ejemplo:
- "Agrega a Banca del Mañana esta noticia: [enlace]".
- "Actualiza los indicadores con el informe de la SBP de septiembre".
- "Corrige el artículo de hoy: cambia el título a …".
- "Cambia el color del encabezado" o "agrega una calculadora de …".
Yo hago el cambio, compruebo que compile y pase las pruebas, lo subo al repositorio y verifico el sitio publicado.

## 6. Ejecutarlo en una computadora (opcional, para técnicos)
Requiere Node.js 22 y Git.
```bash
git clone https://github.com/negociosvv06-alt/banca-del-manana.git
cd banca-del-manana
npm install
npm run dev        # abre http://localhost:5173
npm test           # pruebas
npm run build:cloudflare && npm run preview   # vista de producción en http://localhost:4173
```

## 7. Cómo se publica
- Cada vez que se guarda un cambio en la rama `main` (desde GitHub, el celular, el asistente o la rutina diaria):
  1. **Cloudflare Workers Builds** compila (`npm run build:cloudflare`) y publica (`npx wrangler deploy`) el sitio principal.
  2. **GitHub Actions** compila y publica la copia de GitHub Pages, y ejecuta la verificación (CI).
- Cada compilación descarga de nuevo las noticias de Fed, BCE y BIS. Si una fuente falla, se mantienen las anteriores marcadas como desactualizadas.
- Si la compilación falla (por ejemplo, un JSON mal escrito), **no se publica nada** y sigue en línea la versión anterior.

## 8. Qué se hace en automático y cada cuánto

Las tareas programadas de GitHub usan hora UTC; abajo está convertida a hora de Panamá (UTC-5). GitHub puede retrasar las tareas programadas varios minutos en horas de alta demanda.

| Tarea | Dónde | Cuándo (hora de Panamá) |
|---|---|---|
| Publicar el sitio principal | Cloudflare Workers Builds | En cada cambio guardado en `main` |
| Artículo diario "Banca e IA" (crear, revisar tipos, pruebas, compilar y subir) | Rutina del asistente | Todos los días a las **6:17 a. m.** (al subirlo dispara todas las publicaciones de esta tabla) |
| CI: revisión de tipos, pruebas, compilación y auditoría de seguridad (`ci.yml`) | GitHub Actions | En cada cambio subido y en cada pull request |
| Publicar la copia en GitHub Pages (`deploy.yml`) | GitHub Actions | En cada cambio en `main` + cada 6 horas: **1:15 a. m., 7:15 a. m., 1:15 p. m. y 7:15 p. m.** (cron `15 */6 * * *` UTC) + manual |
| Despliegue alternativo a Cloudflare Pages (`cloudflare.yml`) | GitHub Actions | En cada cambio en `main` + **1:45 a. m., 7:45 a. m., 1:45 p. m. y 7:45 p. m.** (cron `45 */6 * * *` UTC) + manual. **Hoy se omite** porque no existen los secretos `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`. Es redundante con Workers Builds y se puede eliminar. |
| Noticias internacionales (RSS de Fed, BCE y BIS) | Dentro de cada compilación | En cada publicación: la de Cloudflare (cada cambio, al menos una vez al día con el artículo de las 6:17 a. m.) y la de GitHub Pages (además cada 6 horas) |
| Tipos de cambio del conversor de divisas | Navegador del visitante, API Frankfurter (referencia del BCE) | En vivo cada vez que alguien abre el conversor; el BCE publica una vez por día hábil |
| Sitemap, robots.txt y validación de contenido | Dentro de cada compilación | En cada publicación |

Nota: el sitio principal de Cloudflare **no** tiene recompilación cada 6 horas; sus noticias internacionales se renuevan cuando hay un cambio en `main` (como mínimo con el artículo diario). La copia de GitHub Pages sí se recompila cada 6 horas.

### Solo manual (no se actualiza solo)
- Noticias de Panamá (`news-panama.json`): la SBP no tiene RSS.
- Directorio de bancos y verificación de licencias.
- Indicadores del sistema bancario.
- Glosario y textos legales.

### Pendientes
- Verificar licencias de los bancos en el registro de la SBP.
- Cargar tasas verificadas en el comparador.
- Activar Cloudflare Web Analytics y luego conectar el bloque "Más leídas" con datos reales.
- Revisión legal local de Privacidad, Términos y Aviso financiero.
- Versión en inglés (fase 2) y, si se quiere, dominio propio (tiene costo anual).
- Eliminar `cloudflare.yml` si no se va a usar Cloudflare Pages.
- Los títulos internacionales se muestran en inglés (idioma original).

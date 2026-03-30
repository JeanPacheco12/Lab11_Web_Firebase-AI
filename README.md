# EventPass Pro 

En este lab de web se trabajó una plataforma moderna para la gestión de eventos impulsada por Inteligencia Artificial, construida con Next.js App Router, Firebase y Gemini AI.

## Características Principales

### Panel de Organizador (Protected Dashboard)
* **Rutas Protegidas:** Acceso exclusivo para usuarios autenticados.
* **Filtro de Propiedad:** El dashboard (`/my-events`) muestra estrictamente los eventos creados por el usuario activo.
* **Gestión Segura:** Botones de edición y eliminación rápida con alertas de confirmación nativas del navegador.
* **Seguridad en Backend:** Validación de tokens en Server Actions antes de cualquier mutación en la base de datos (Firebase Firestore).

### Asistente Creativo con Gemini AI (Structured Output)
* **Generación de Contenido:** Crea descripciones detalladas a partir de un título.
* **Control de Tono:** Menú desplegable para guiar a la IA y generar texto con tono *Formal*, *Casual* o *Emocionante*.
* **Opciones Múltiples:** Devuelve exactamente 3 opciones generadas simultáneamente usando `responseSchema` (JSON Mode).
* **UI Interactiva:** Tarjetas de selección con botones para aplicar el texto deseado y regenerar nuevas opciones sin perder el contexto.
* **Auto-completado de Etiquetas:** Análisis del título para sugerir automáticamente hasta 5 tags relevantes.

## Stack Tecnológico

* **Framework:** Next.js 15 (App Router, Server Actions)
* **Lenguaje:** TypeScript
* **Base de Datos & Auth:** Firebase (Firestore, Auth, Storage)
* **Inteligencia Artificial:** Google Gemini API (`@google/genai`)
* **Estilos & UI:** Tailwind CSS, shadcn/ui, Lucide Icons

## Instalación y Uso

1. Clonar el repositorio.
2. Instalar dependencias con `npm install`.
3. Configurar variables de entorno (`.env.local`) con las credenciales de Firebase y la API Key de Gemini.
4. Ejecutar el servidor de desarrollo: `npm run dev`.
5. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Video explicativo

[]

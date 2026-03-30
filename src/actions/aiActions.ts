// =============================================================================
// AI ACTIONS - Module 5: EventPass Pro
// =============================================================================
//
// ## Educational Note: Server Actions para IA Generativa
//
// Este archivo contiene Server Actions que integran Gemini AI para generar
// contenido de eventos. Usamos Server Actions en lugar de API Routes porque:
//
// 1. **Seguridad**: Las API keys NUNCA llegan al cliente
// 2. **Simplicidad**: No necesitamos crear endpoints REST
// 3. **Type Safety**: TypeScript end-to-end sin serializacion manual
// 4. **Caching**: Next.js puede cachear resultados automaticamente
//
// ### Flujo de Generación con Gemini
//
// ```
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                    FLUJO: CLIENTE → SERVER ACTION → GEMINI              │
// ├─────────────────────────────────────────────────────────────────────────┤
// │                                                                         │
// │   1. Usuario escribe título ────────────────────────────────────────┐   │
// │      "Conferencia de React 2025"                                    │   │
// │                                                                     │   │
// │   2. Click "Generar con IA" ────────────────────────────────────────┤   │
// │                                                                     │   │
// │   3. EventForm llama generateEventDetailsAction(title) ─────────────┤   │
// │      (Server Action, ejecuta en el servidor)                        │   │
// │                                                                     │   │
// │   4. Server Action construye prompt ────────────────────────────────┤   │
// │      + Envía a Gemini API                                           │   │
// │                                                                     │   │
// │   5. Gemini retorna JSON ───────────────────────────────────────────┤   │
// │      { description, category, tags }                                │   │
// │                                                                     │   │
// │   6. Server Action parsea y valida ─────────────────────────────────┤   │
// │                                                                     │   │
// │   7. Retorna datos al cliente ──────────────────────────────────────┘   │
// │      EventForm actualiza campos automáticamente                         │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// ```
//
// ### Prompt Engineering
//
// El prompt está diseñado para:
// 1. Dar contexto claro al modelo (eres un experto en eventos)
// 2. Especificar el formato exacto de salida (JSON)
// 3. Incluir restricciones (categorías válidas, límite de caracteres)
// 4. Pedir respuesta sin formato markdown (solo JSON)
//
// =============================================================================

'use server';

// Importamos el nuevo schema que creamos para forzar las 3 opciones
import { getGeminiClient, GEMINI_MODELS, multipleDescriptionsSchema } from '@/lib/gemini';
import { EVENT_CATEGORIES } from '@/types/event';

// =============================================================================
// TIPOS DE RESPUESTA
// =============================================================================

export interface GeneratedEventDetails {
    // Ahora descriptions es un array de 3 strings
    descriptions: string[];
    category: string;
    tags: string[];
}

// Actualizamos los parámetros: Ahora recibe el title y el tone (opcional, por defecto 'casual')
export async function generateEventDetailsAction(
  title: string,
  tone: string = 'casual'
): Promise<{ success: boolean; data?: GeneratedEventDetails; error?: string }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        if (!title || title.length < 3) {
            return { success: false, error: 'Please provide a valid event title' };
        }

        const client = getGeminiClient();

        // Actualizamos el prompt para exigir las 3 opciones, aplicar el tono y estructurar el JSON final
        const prompt = `
      You are an expert event planner and copywriter. Based on the event title "${title}", please generate:
      1. Generate exactly 3 different options for a compelling and engaging description. 
         The tone of all 3 descriptions must be: ${tone}. 
         Each description must be 2-3 paragraphs and under 1000 characters.
      2. The most suitable category from this exact list: ${EVENT_CATEGORIES.join(', ')}.
      3. A list of exactly 5 relevant tags (lowercase, concise).

      You must return the response in strictly valid JSON format matching this exact structure:
      {
        "descriptions": ["option 1", "option 2", "option 3"],
        "category": "category_name",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
      }
      Do not include any markdown formatting or explanations, just the JSON string.
    `;

        // The new SDK syntax
        const result = await client.models.generateContent({
            model: GEMINI_MODELS.TEXT,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            config: {
                responseMimeType: 'application/json',
                // Le pasamos el schema para forzar la estructura de las descripciones
                responseSchema: multipleDescriptionsSchema, 
            }
        });

        const text = result.text;

        if (!text) {
            throw new Error('No content generated');
        }

        // Clean up markdown code blocks if present (common in LLM responses)
        // Even with JSON mode, sometimes it might add wrapping
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

        const data = JSON.parse(cleanedText) as GeneratedEventDetails;

        // Validamos que Gemini haya devuelto las 3 opciones
        if (!data.descriptions || !Array.isArray(data.descriptions) || data.descriptions.length === 0) {
             throw new Error('Gemini did not return the descriptions array properly.');
        }

        // Validate category
        if (!EVENT_CATEGORIES.includes(data.category as any)) {
            data.category = 'otro';
        }

        // Limit tags to 5
        data.tags = (data.tags || []).slice(0, 5);

        return { success: true, data };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return { success: false, error: 'Failed to generate content. Please try again.' };
    }
}

export async function generateEventPosterAction(prompt: string, eventId?: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const client = getGeminiClient();

        // Generate image
        const result = await client.models.generateContent({
            model: GEMINI_MODELS.IMAGE,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `Create a professional, modern, and clean business event poster for: ${prompt}. Style: High-quality photorealistic imagery, elegant typography. Avoid futuristic, sci-fi, or neon aesthetics. 16:9 aspect ratio. Minimal text.` }]
                }
            ],
        });

        // Extract base64
        // According to context7 docs for gemini-3-pro-image-preview:
        // response.candidates[0].content.parts[0].inlineData.data
        const candidates = result.candidates; // Access property directly
        const part = candidates?.[0]?.content?.parts?.[0];

        let base64Image: string | undefined;

        if (part?.inlineData?.data) {
            base64Image = part.inlineData.data;
        } else {
            console.error('No inlineData in response:', JSON.stringify(part));
            throw new Error('No image generated');
        }

        const buffer = Buffer.from(base64Image, 'base64');

        // Upload to storage
        // If no eventId, generate a temporary one
        const targetId = eventId || crypto.randomUUID();

        const { uploadPosterToStorage } = await import('@/lib/firebase/storage');
        const imageUrl = await uploadPosterToStorage(targetId, buffer, 'image/png');

        if (!imageUrl) {
            throw new Error('Failed to upload image to storage');
        }

        return { success: true, imageUrl };
    } catch (error) {
        console.error('Gemini Image Generation Error:', error);
        return { success: false, error: 'Failed to generate poster.' };
    }
}
// =============================================================================
// COMPONENTE EVENT CARD - Module 4: Event Pass
// =============================================================================
// Tarjeta para mostrar un evento en el listado.
//
// ## Server Component
// Este es un Server Component (por defecto en Next.js App Router).
// No tiene 'use client' porque no necesita interactividad del cliente.
// =============================================================================

'use client'; // Agregado para poder usar window.confirm y hooks de React

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, Tag, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types/event';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/types/event';
import { formatShortDate, formatPrice, getAvailableSpots } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { deleteEventAction } from '@/actions/eventActions';
import { useTransition } from 'react';

interface EventCardProps {
  event: Event;
  currentUserId?: string;
}

/**
 * Tarjeta de evento para listados.
 *
 * ## Diseño
 * - Imagen con overlay de fecha
 * - Información principal (título, ubicación, fecha)
 * - Badges de categoría y estado
 * - Footer con precio y acción
 */
export function EventCard({ event, currentUserId }: EventCardProps): React.ReactElement {
  // Verificamos si el usuario actual es el dueño del evento (ya sea por prop o por contexto)
  const { user } = useAuth();
  const isOwner = (currentUserId && currentUserId === event.organizerId) || (user?.uid === event.organizerId);

  const [isPending, startTransition] = useTransition();

  const availableSpots = getAvailableSpots(event.capacity, event.registeredCount);
  const isSoldOut = availableSpots === 0;
  const isAvailable = event.status === 'publicado' && !isSoldOut;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
      {/* Imagen del evento */}
      <div className="relative aspect-video">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <Tag className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Overlay con fecha */}
        <div className="absolute left-3 top-3 rounded-lg bg-background/90 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-sm font-semibold">{formatShortDate(event.date)}</p>
        </div>

        {/* Badge de estado si no está publicado */}
        {event.status !== 'publicado' && (
          <div className="absolute right-3 top-3">
            <Badge variant={event.status === 'cancelado' ? 'destructive' : 'secondary'}>
              {STATUS_LABELS[event.status]}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/events/${event.id}`}
            className="line-clamp-2 text-lg font-semibold hover:underline"
          >
            {event.title}
          </Link>
        </div>
        <Badge variant="outline" className="w-fit">
          {CATEGORY_LABELS[event.category]}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2 pb-2 flex-grow">
        {/* Ubicación */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{event.location}</span>
        </div>

        {/* Fecha y hora */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{formatShortDate(event.date)}</span>
        </div>

        {/* Plazas disponibles */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          <span>
            {isSoldOut ? (
              <span className="font-medium text-destructive">Agotado</span>
            ) : (
              `${availableSpots} plazas disponibles`
            )}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pb-4 items-stretch">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-bold text-primary">{formatPrice(event.price)}</p>
          <Button asChild variant={isAvailable ? 'default' : 'secondary'} size="sm">
            <Link href={`/events/${event.id}`}>{isAvailable ? 'Ver detalles' : 'Ver evento'}</Link>
          </Button>
        </div>
        
        {/* Botones adicionales solo para el organizador */}
        {isOwner && (
          <div className="flex w-full gap-2 border-t pt-4 mt-2">
            <Button asChild variant="outline" size="sm" className="flex-1 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
              <Link href={`/events/${event.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault(); // Evitamos el comportamiento por defecto del form
                if (window.confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
                  startTransition(() => {
                    deleteEventAction(event.id);
                  });
                }
              }}
              className="flex-1"
            >
              <Button type="submit" variant="destructive" size="sm" className="w-full gap-2" disabled={isPending}>
                <Trash2 className="h-4 w-4" />
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
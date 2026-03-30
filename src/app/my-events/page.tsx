'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarX } from 'lucide-react';
import { getMyEventsAction } from '@/actions/eventActions';
import { EventList } from '@/components/EventList';
import type { Event } from '@/types/event';

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Nuevos estados para manejar los eventos
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // 1. PROTECCIÓN DE RUTA
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // 2. CARGAR MIS EVENTOS (User filter)
  useEffect(() => {
    async function fetchMyEvents() {
      if (user) {
        setIsLoadingEvents(true);
        const result = await getMyEventsAction();
        if (result.success && result.data) {
          setEvents(result.data);
        }
        setIsLoadingEvents(false);
      }
    }
    fetchMyEvents();
  }, [user]);

  // 3. ESTADO DE CARGA COMBINADO (Auth + Eventos)
  if (authLoading || (user && isLoadingEvents)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 w-48 bg-muted animate-pulse rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis Eventos</h1>
          <p className="text-muted-foreground mt-1">
            Gestionando como: <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">Crear Nuevo Evento</Link>
        </Button>
      </div>

      {/* 4. RENDERIZADO CONDICIONAL: Vacío o Lista de eventos */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-muted/10">
          <CalendarX className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aún no tienes eventos</h2>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Crea tu primer evento para empezar a gestionarlo desde aquí.
          </p>
          <Button asChild>
            <Link href="/events/new">Crear mi primer evento</Link>
          </Button>
        </div>
      ) : (
        <EventList 
          events={events} 
          emptyMessage="" 
        />
      )}
    </div>
  );
}
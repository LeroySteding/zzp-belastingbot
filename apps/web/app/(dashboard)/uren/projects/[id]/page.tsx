'use client';

import { use, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Euro, AlertCircle, Loader2 } from 'lucide-react';
import { getUrenProjects, getUrenClients, getTimeEntries, calculateProjectStats } from '@/lib/uren/actions';
import type { UrenProject, UrenClient, UrenTimeEntry, UrenProjectStats } from '@/lib/uren/actions';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<UrenProject | null>(null);
  const [client, setClient] = useState<UrenClient | null>(null);
  const [stats, setStats] = useState<UrenProjectStats | null>(null);
  const [entries, setEntries] = useState<UrenTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [projects, clients, projectEntries, projectStats] = await Promise.all([
        getUrenProjects(),
        getUrenClients(),
        getTimeEntries(id),
        calculateProjectStats(id),
      ]);

      const foundProject = projects.find(p => p.id === id) || null;
      setProject(foundProject);

      if (foundProject) {
        const foundClient = clients.find(c => c.id === foundProject.clientId) || null;
        setClient(foundClient);
      }

      setStats(projectStats);
      setEntries(projectEntries);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Project niet gevonden</p>
        </div>
      </div>
    );
  }

  const isOverBudget = stats && stats.budgetPercentage > 100;

  return (
    <div className="min-h-screen bg-muted/50">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/uren/projects">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Terug naar projecten
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-4 h-4 rounded-full ${project.color}`} />
                <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              </div>
              <p className="text-muted-foreground">Klant: {client?.name || project.clientName}</p>
              <p className="text-sm text-muted-foreground">{client?.email}</p>
            </div>

            {isOverBudget && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Over budget
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Uren</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round((stats?.totalHours || 0) * 10) / 10}h
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                van {project.budgetHours}h budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Omzet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {'\u20AC'}{Math.round(stats?.revenue || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                @ {'\u20AC'}{project.hourlyRate}/uur
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Gebruik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(stats?.budgetPercentage || 0)}%
              </div>
              <Progress
                value={Math.min(stats?.budgetPercentage || 0, 100)}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registraties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{entries.length}</div>
              <p className="text-sm text-muted-foreground mt-1">
                tijd entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Alle tijdregistraties</CardTitle>
            <CardDescription>Overzicht van alle gewerkte uren op dit project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nog geen uren geregistreerd op dit project
                </p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{entry.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{format(new Date(entry.date), 'EEEE d MMMM yyyy', { locale: nl })}</span>
                        <span>•</span>
                        <span>{entry.startTime} - {entry.endTime}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-foreground">
                        {Math.round(entry.duration / 60 * 10) / 10}h
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {'\u20AC'}{Math.round((entry.duration / 60) * project.hourlyRate)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uurtarief:</span>
                <span className="font-medium">{'\u20AC'}{project.hourlyRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget (uren):</span>
                <span className="font-medium">{project.budgetHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget (euro):</span>
                <span className="font-medium">{'\u20AC'}{project.budgetHours * project.hourlyRate}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Resterende uren:</span>
                <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.round((project.budgetHours - (stats?.totalHours || 0)) * 10) / 10}h
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Klant Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Naam:</span>
                <span className="font-medium">{client?.name || project.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{client?.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

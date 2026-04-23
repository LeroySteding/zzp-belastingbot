'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Euro, TrendingUp, AlertCircle, Briefcase, Download } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, ProjectCardsSkeleton } from '@/components/ui/skeleton';
import { getUrenProjects, getUrenClients, getTimeEntries, calculateProjectStats, createProject } from '@/lib/uren/actions';
import type { UrenProject, UrenClient, UrenTimeEntry, UrenProjectStats } from '@/lib/uren/actions';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projectsData, setProjectsData] = useState<UrenProject[]>([]);
  const [clientsData, setClientsData] = useState<UrenClient[]>([]);
  const [entriesData, setEntriesData] = useState<UrenTimeEntry[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, UrenProjectStats>>({});
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('85');
  const [newProjectBudget, setNewProjectBudget] = useState('100');

  useEffect(() => {
    async function load() {
      const [projects, clients, entries] = await Promise.all([
        getUrenProjects(),
        getUrenClients(),
        getTimeEntries(),
      ]);
      setProjectsData(projects);
      setClientsData(clients);
      setEntriesData(entries);

      // Load stats for all projects
      const stats: Record<string, UrenProjectStats> = {};
      await Promise.all(
        projects.map(async (p) => {
          const s = await calculateProjectStats(p.id);
          if (s) stats[p.id] = s;
        })
      );
      setStatsMap(stats);
      setLoading(false);
    }
    load();
  }, []);

  const getEntriesByProject = (projectId: string) =>
    entriesData.filter(e => e.projectId === projectId);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newProjectClient) return;

    const created = await createProject({
      name: newProjectName,
      clientId: newProjectClient,
      hourlyRate: parseFloat(newProjectRate) || 85,
      budgetHours: parseFloat(newProjectBudget) || 100,
    });

    if (created) {
      setProjectsData(prev => [created, ...prev]);
      setStatsMap(prev => ({
        ...prev,
        [created.id]: { totalHours: 0, revenue: 0, budgetPercentage: 0 },
      }));
    }

    setDialogOpen(false);
    setNewProjectName('');
    setNewProjectClient('');
    setNewProjectRate('85');
    setNewProjectBudget('100');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <ProjectCardsSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projecten</h1>
            <p className="text-gray-600 mt-2">Beheer je projecten en budgetten</p>
          </div>

          <div className="flex gap-3 items-center">
            <a href="/api/export/time-entries" download className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
              <Download className="w-4 h-4" />
              Exporteer CSV
            </a>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nieuw project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateProject}>
                <DialogHeader>
                  <DialogTitle>Nieuw project aanmaken</DialogTitle>
                  <DialogDescription>
                    Voeg een nieuw project toe voor urenregistratie
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Projectnaam *</Label>
                    <Input
                      placeholder="Bijv. Website Redesign"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Klant *</Label>
                    <Select value={newProjectClient} onValueChange={setNewProjectClient} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer klant" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsData.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Uurtarief ({'\u20AC'}) *</Label>
                      <Input
                        type="number"
                        placeholder="85"
                        value={newProjectRate}
                        onChange={(e) => setNewProjectRate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Budget (uren)</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={newProjectBudget}
                        onChange={(e) => setNewProjectBudget(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit">Project aanmaken</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Projects Grid */}
        {projectsData.length === 0 ? (
          <div className="card-premium p-6">
            <EmptyState
              icon={Briefcase}
              title="Nog geen projecten"
              description="Maak je eerste project aan om uren te registreren en budgetten bij te houden."
              actionLabel="Nieuw project"
              actionHref="/uren/projects"
            />
          </div>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsData.map((project) => {
            const stats = statsMap[project.id];
            const entries = getEntriesByProject(project.id);
            const isOverBudget = stats && stats.budgetPercentage > 100;
            const isNearBudget = stats && stats.budgetPercentage > 80 && stats.budgetPercentage <= 100;

            return (
              <Link key={project.id} href={`/uren/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`w-4 h-4 rounded-full ${project.color} mt-1`} />
                      {isOverBudget && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Over budget
                        </Badge>
                      )}
                      {isNearBudget && (
                        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
                          <AlertCircle className="h-3 w-3" />
                          Bijna vol
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-2">{project.name}</CardTitle>
                    <CardDescription>{project.clientName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats && (
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Budget gebruik</span>
                            <span className="font-medium">
                              {Math.round(stats.budgetPercentage)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(stats.budgetPercentage, 100)}
                            className={isOverBudget ? "bg-red-100" : ""}
                          />
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{Math.round(stats.totalHours * 10) / 10}h gebruikt</span>
                            <span>{project.budgetHours}h budget</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
                              <Clock className="h-3 w-3" />
                              Uren
                            </div>
                            <div className="font-bold text-sm">
                              {Math.round(stats.totalHours * 10) / 10}h
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
                              <Euro className="h-3 w-3" />
                              Omzet
                            </div>
                            <div className="font-bold text-sm">
                              {'\u20AC'}{Math.round(stats.revenue)}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
                              <TrendingUp className="h-3 w-3" />
                              Entries
                            </div>
                            <div className="font-bold text-sm">
                              {entries.length}
                            </div>
                          </div>
                        </div>

                        {/* Rate */}
                        <div className="text-sm text-gray-600 pt-3 border-t">
                          Uurtarief: <span className="font-medium text-gray-900">{'\u20AC'}{project.hourlyRate}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        )}

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Projecten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projectsData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Uren</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(
                  Object.values(statsMap).reduce((sum, s) => sum + s.totalHours, 0) * 10
                ) / 10}h
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Omzet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {'\u20AC'}{Math.round(
                  Object.values(statsMap).reduce((sum, s) => sum + s.revenue, 0)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Gem. Uurtarief</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {'\u20AC'}{projectsData.length > 0
                  ? Math.round(
                      projectsData.reduce((sum, p) => sum + p.hourlyRate, 0) / projectsData.length
                    )
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

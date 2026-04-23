'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPortalProjects, getPortalActivities } from '@/lib/portal/actions';
import type { PortalProject, PortalActivity } from '@/lib/portal/actions';
import { FolderKanban, AlertCircle, Plus, UserPlus, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [activities, setActivities] = useState<PortalActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsData, activitiesData] = await Promise.all([
          getPortalProjects(),
          getPortalActivities(),
        ]);
        setProjects(projectsData);
        setActivities(activitiesData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.displayStatus !== 'afgerond' && p.displayStatus !== 'archived');
  const pendingApprovals = projects.filter(p => p.needsApproval);
  const recentActivities = activities.slice(0, 5);
  const avgProgress = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length)
    : 0;

  return (

      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welkom terug! Hier is een overzicht van je projecten.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actieve Projecten</CardTitle>
              <FolderKanban className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeProjects.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {projects.filter(p => p.displayStatus === 'in-uitvoering').length} in uitvoering
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wacht op Goedkeuring</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingApprovals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingApprovals.length > 0 ? 'Actie vereist' : 'Alles up-to-date'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gemiddelde Voortgang</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {avgProgress}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Over alle actieve projecten</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recente Activiteit</CardTitle>
              <CardDescription>Laatste updates van je projecten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'approval' ? 'bg-orange-100' :
                      activity.type === 'comment' ? 'bg-blue-100' :
                      activity.type === 'file' ? 'bg-green-100' : 'bg-muted'
                    }`}>
                      {activity.type === 'approval' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                      {activity.type === 'comment' && <Clock className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'file' && <FolderKanban className="h-4 w-4 text-green-600" />}
                      {activity.type === 'project' && <FolderKanban className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Link href={`/portal/projects/${activity.projectId}`}>
                      <Button variant="ghost" size="sm">Bekijk</Button>
                    </Link>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nog geen activiteit</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Snelle Acties</CardTitle>
              <CardDescription>Veelgebruikte functies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/portal/projects?action=new">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Project
                </Button>
              </Link>
              <Link href="/portal/clients?action=invite">
                <Button className="w-full justify-start" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Klant Uitnodigen
                </Button>
              </Link>
              <Link href="/portal/projects">
                <Button className="w-full justify-start" variant="outline">
                  <FolderKanban className="h-4 w-4 mr-2" />
                  Alle Projecten
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Projects needing attention */}
        {pendingApprovals.length > 0 && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Projecten die aandacht nodig hebben
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovals.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.clientName}</p>
                    </div>
                    <Link href={`/portal/projects/${project.id}`}>
                      <Button size="sm">Bekijk</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockProjects, mockActivities } from '@/lib/portal/mock-data';
import { FolderKanban, AlertCircle, Plus, UserPlus, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const activeProjects = mockProjects.filter(p => p.status !== 'afgerond');
  const pendingApprovals = mockProjects.filter(p => p.needsApproval);
  const recentActivities = mockActivities.slice(0, 5);

  return (
    
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welkom terug! Hier is een overzicht van je projecten.</p>
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
              <p className="text-xs text-gray-600 mt-1">
                {mockProjects.filter(p => p.status === 'in-uitvoering').length} in uitvoering
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
              <p className="text-xs text-gray-600 mt-1">
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
                {Math.round(activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">Over alle actieve projecten</p>
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
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'approval' ? 'bg-orange-100' :
                      activity.type === 'comment' ? 'bg-blue-100' :
                      activity.type === 'file' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {activity.type === 'approval' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                      {activity.type === 'comment' && <Clock className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'file' && <FolderKanban className="h-4 w-4 text-green-600" />}
                      {activity.type === 'project' && <FolderKanban className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Link href={`/projects/${activity.projectId}`}>
                      <Button variant="ghost" size="sm">Bekijk</Button>
                    </Link>
                  </div>
                ))}
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
              <Link href="/projects?action=new">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Project
                </Button>
              </Link>
              <Link href="/clients?action=invite">
                <Button className="w-full justify-start" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Klant Uitnodigen
                </Button>
              </Link>
              <Link href="/projects">
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
                  <div key={project.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-gray-600">{project.clientName}</p>
                    </div>
                    <Link href={`/projects/${project.id}`}>
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

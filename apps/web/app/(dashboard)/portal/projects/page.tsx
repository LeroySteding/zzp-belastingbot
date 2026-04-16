'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockProjects, mockClients } from '@/lib/portal/mock-data';
import { Plus, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

const statusColors: Record<string, string> = {
  'offerte': 'bg-gray-100 text-gray-800',
  'in-uitvoering': 'bg-blue-100 text-blue-800',
  'review': 'bg-orange-100 text-orange-800',
  'afgerond': 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  'offerte': 'Offerte',
  'in-uitvoering': 'In uitvoering',
  'review': 'Review',
  'afgerond': 'Afgerond',
};

export default function ProjectsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProjects = mockProjects.filter(project => {
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    
      <div className="max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projecten</h1>
            <p className="text-gray-600">Beheer al je projecten op één plek</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nieuw Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nieuw Project Aanmaken</DialogTitle>
                <DialogDescription>
                  Vul de projectgegevens in om te starten
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Projectnaam</Label>
                  <Input id="name" placeholder="Website Redesign" />
                </div>
                <div>
                  <Label htmlFor="client">Klant</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een klant" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Korte beschrijving van het project..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue="offerte">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offerte">Offerte</SelectItem>
                        <SelectItem value="in-uitvoering">In uitvoering</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="afgerond">Afgerond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input id="deadline" type="date" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" onClick={(e) => {
                    e.preventDefault();
                    setIsDialogOpen(false);
                  }}>
                    Project Aanmaken
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Zoek projecten..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="offerte">Offerte</SelectItem>
                    <SelectItem value="in-uitvoering">In uitvoering</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="afgerond">Afgerond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <Link href={`/portal/projects/${project.id}`}>
                          <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600">{project.clientName}</p>
                      </div>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Voortgang</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-600">
                      Deadline: {new Date(project.deadline).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <Link href={`/portal/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">Geen projecten gevonden</p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Eerste Project Aanmaken
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    
  );
}

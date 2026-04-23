'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Printer, Calendar, Loader2 } from 'lucide-react';
import { getTimeEntriesByDateRange, getUrenProjects, getUrenClients } from '@/lib/uren/actions';
import type { UrenTimeEntry, UrenProject, UrenClient } from '@/lib/uren/actions';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { nl } from 'date-fns/locale';

type GroupBy = 'project' | 'client';
type Period = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';
type Status = 'concept' | 'goedgekeurd' | 'gefactureerd';

export default function TimesheetsPage() {
  const [period, setPeriod] = useState<Period>('thisWeek');
  const [groupBy, setGroupBy] = useState<GroupBy>('project');
  const [status, setStatus] = useState<Status>('concept');

  const [projectsData, setProjectsData] = useState<UrenProject[]>([]);
  const [clientsData, setClientsData] = useState<UrenClient[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<UrenTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const getPeriodDates = (p: Period) => {
    const now = new Date();
    switch (p) {
      case 'thisWeek':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'lastWeek':
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'lastMonth':
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
    }
  };

  useEffect(() => {
    async function load() {
      const [projects, clients] = await Promise.all([
        getUrenProjects(),
        getUrenClients(),
      ]);
      setProjectsData(projects);
      setClientsData(clients);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      const { start, end } = getPeriodDates(period);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      const entries = await getTimeEntriesByDateRange(startStr, endStr);
      setFilteredEntries(entries);
      setLoading(false);
    }
    loadEntries();
  }, [period]);

  const getProjectById = (id: string) => projectsData.find(p => p.id === id);

  const { start, end } = getPeriodDates(period);

  const groupedData = groupBy === 'project'
    ? projectsData.map(project => ({
        id: project.id,
        name: project.name,
        subtitle: project.clientName,
        entries: filteredEntries.filter(e => e.projectId === project.id),
        color: project.color,
        rate: project.hourlyRate,
      })).filter(g => g.entries.length > 0)
    : clientsData.map(client => ({
        id: client.id,
        name: client.name,
        subtitle: client.email,
        entries: filteredEntries.filter(e => {
          const project = getProjectById(e.projectId);
          return project?.clientId === client.id;
        }),
        color: 'bg-muted/500',
        rate: 0, // Mixed rates for clients
      })).filter(g => g.entries.length > 0);

  const totalHours = filteredEntries.reduce((sum, e) => sum + e.duration, 0) / 60;
  const totalRevenue = filteredEntries.reduce((sum, entry) => {
    const project = getProjectById(entry.projectId);
    return sum + (entry.duration / 60) * (project?.hourlyRate || 0);
  }, 0);

  const handleExportCSV = () => {
    const headers = ['Datum', 'Project', 'Klant', 'Beschrijving', 'Start', 'Eind', 'Uren', 'Tarief', 'Bedrag'];
    const rows = filteredEntries.map(entry => {
      const project = getProjectById(entry.projectId);
      const hours = entry.duration / 60;
      const amount = hours * (project?.hourlyRate || 0);

      return [
        entry.date,
        project?.name || '',
        project?.clientName || '',
        entry.description,
        entry.startTime,
        entry.endTime,
        hours.toFixed(2),
        project?.hourlyRate || 0,
        amount.toFixed(2),
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urenstaat-${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const statusColors: Record<string, string> = {
    concept: 'bg-muted text-foreground',
    goedgekeurd: 'bg-green-100 text-green-800',
    gefactureerd: 'bg-blue-100 text-blue-800',
  };

  if (loading && projectsData.length === 0) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:px-0">
        <div className="mb-8 print:mb-4">
          <h1 className="text-3xl font-bold text-foreground print:text-2xl">Urenstaten</h1>
          <p className="text-muted-foreground mt-2 print:text-sm">Genereer overzichten en exporteer voor facturatie</p>
        </div>

        {/* Filters */}
        <Card className="mb-8 print:hidden">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Periode</label>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisWeek">Deze week</SelectItem>
                    <SelectItem value="lastWeek">Vorige week</SelectItem>
                    <SelectItem value="thisMonth">Deze maand</SelectItem>
                    <SelectItem value="lastMonth">Vorige maand</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Groeperen op</label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="client">Klant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concept">Concept</SelectItem>
                    <SelectItem value="goedgekeurd">Goedgekeurd</SelectItem>
                    <SelectItem value="gefactureerd">Gefactureerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleExportCSV} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button onClick={handlePrint} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 print:mb-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Periode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium">
                {format(start, 'd MMMM', { locale: nl })} - {format(end, 'd MMMM yyyy', { locale: nl })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Uren</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold print:text-2xl">
                {Math.round(totalHours * 10) / 10}h
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredEntries.length} registraties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Omzet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold print:text-2xl">
                {'\u20AC'}{Math.round(totalRevenue)}
              </div>
              <Badge className={statusColors[status]} variant="secondary">
                {status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Grouped Time Entries */}
        <Card>
          <CardHeader className="print:pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="print:text-lg">Urenstaat Details</CardTitle>
                <CardDescription className="print:text-xs">
                  Gegroepeerd per {groupBy === 'project' ? 'project' : 'klant'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : groupedData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Geen uren gevonden voor deze periode
              </p>
            ) : (
              <div className="space-y-8 print:space-y-4">
                {groupedData.map((group) => {
                  const groupHours = group.entries.reduce((sum, e) => sum + e.duration, 0) / 60;
                  const groupRevenue = group.entries.reduce((sum, entry) => {
                    const project = getProjectById(entry.projectId);
                    return sum + (entry.duration / 60) * (project?.hourlyRate || 0);
                  }, 0);

                  return (
                    <div key={group.id} className="border rounded-lg p-4 print:p-2 print:break-inside-avoid">
                      <div className="flex items-center justify-between mb-4 print:mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${group.color}`} />
                          <div>
                            <h3 className="font-semibold text-lg print:text-base">{group.name}</h3>
                            <p className="text-sm text-muted-foreground print:text-xs">{group.subtitle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg print:text-base">
                            {Math.round(groupHours * 10) / 10}h
                          </div>
                          <div className="text-sm text-muted-foreground print:text-xs">
                            {'\u20AC'}{Math.round(groupRevenue)}
                          </div>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="print:text-xs print:py-1">Datum</TableHead>
                            <TableHead className="print:text-xs print:py-1">Beschrijving</TableHead>
                            <TableHead className="print:text-xs print:py-1">Tijd</TableHead>
                            <TableHead className="text-right print:text-xs print:py-1">Uren</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.entries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="print:text-xs print:py-1">
                                {format(new Date(entry.date), 'dd MMM', { locale: nl })}
                              </TableCell>
                              <TableCell className="print:text-xs print:py-1">{entry.description}</TableCell>
                              <TableCell className="print:text-xs print:py-1">
                                {entry.startTime} - {entry.endTime}
                              </TableCell>
                              <TableCell className="text-right font-medium print:text-xs print:py-1">
                                {Math.round(entry.duration / 60 * 10) / 10}h
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock, Euro, TrendingUp, Play } from 'lucide-react';
import { timeEntries, projects, getProjectById } from '@/lib/uren/mock-data';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';

export default function DashboardPage() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Calculate this week's hours
  const thisWeekEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
  });
  const thisWeekHours = thisWeekEntries.reduce((sum, e) => sum + e.duration, 0) / 60;

  // Calculate this month's hours and revenue
  const thisMonthEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
  });
  const thisMonthHours = thisMonthEntries.reduce((sum, e) => sum + e.duration, 0) / 60;
  const thisMonthRevenue = thisMonthEntries.reduce((sum, entry) => {
    const project = getProjectById(entry.projectId);
    return sum + (entry.duration / 60) * (project?.hourlyRate || 0);
  }, 0);

  // Hours per project this month
  const projectHoursData = projects.map(project => {
    const projectEntries = thisMonthEntries.filter(e => e.projectId === project.id);
    const hours = projectEntries.reduce((sum, e) => sum + e.duration, 0) / 60;
    return {
      name: project.name,
      uren: Math.round(hours * 10) / 10,
    };
  }).filter(p => p.uren > 0);

  // Hours per day this week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const dailyHoursData = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEntries = timeEntries.filter(e => e.date === dayStr);
    const hours = dayEntries.reduce((sum, e) => sum + e.duration, 0) / 60;
    return {
      dag: format(day, 'EEE', { locale: nl }),
      uren: Math.round(hours * 10) / 10,
    };
  });

  // Recent entries (last 5)
  const recentEntries = timeEntries.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overzicht van je gewerkte uren en omzet</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deze week</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(thisWeekHours * 10) / 10} uur</div>
              <p className="text-xs text-gray-600 mt-1">
                {thisWeekEntries.length} registraties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deze maand - Uren</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(thisMonthHours * 10) / 10} uur</div>
              <p className="text-xs text-gray-600 mt-1">
                {thisMonthEntries.length} registraties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deze maand - Omzet</CardTitle>
              <Euro className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{Math.round(thisMonthRevenue)}</div>
              <p className="text-xs text-gray-600 mt-1">
                Gebaseerd op uurtarieven
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Timer */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Klaar om te beginnen?</h3>
              <p className="text-gray-600 mt-1">Start de timer en vergeet geen uren meer</p>
            </div>
            <Link href="/uren/track">
              <Button size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Start Timer
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Hours per Project Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Uren per project (deze maand)</CardTitle>
              <CardDescription>Totaal aantal uren per project</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="uren" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hours per Day Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Uren per dag (deze week)</CardTitle>
              <CardDescription>Dagelijkse urenregistratie</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dag" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="uren" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recente registraties</CardTitle>
                <CardDescription>Je laatste 5 tijd registraties</CardDescription>
              </div>
              <Link href="/uren/track">
                <Button variant="outline" size="sm">Alle registraties</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntries.map((entry) => {
                const project = getProjectById(entry.projectId);
                return (
                  <div key={entry.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${project?.color || 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900">{project?.name}</p>
                        <p className="text-sm text-gray-600">{entry.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {Math.round(entry.duration / 60 * 10) / 10}h
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(entry.date), 'dd MMM', { locale: nl })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Clock, Plus } from 'lucide-react';
import { projects, clients, timeEntries, getProjectById, getClientById } from '@/lib/uren/mock-data';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function TrackPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  
  // Manual entry form
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('17:00');
  const [manualProject, setManualProject] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    if (isRunning) {
      // Stop timer - in real app, save entry
      setIsRunning(false);
      if (selectedProject && elapsedSeconds > 0) {
        alert(`Tijd opgeslagen: ${formatTime(elapsedSeconds)} voor ${getProjectById(selectedProject)?.name}`);
        setElapsedSeconds(0);
        setDescription('');
        setSelectedProject('');
      }
    } else {
      // Start timer
      if (!selectedProject) {
        alert('Selecteer eerst een project');
        return;
      }
      setIsRunning(true);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, save manual entry
    alert(`Handmatige registratie opgeslagen voor ${getProjectById(manualProject)?.name}`);
    setManualDescription('');
  };

  // Today's entries
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntries = timeEntries.filter(e => e.date === today);
  const todayHours = todayEntries.reduce((sum, e) => sum + e.duration, 0) / 60;

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tijd registreren</h1>
          <p className="text-gray-600 mt-2">Start de timer of voer uren handmatig in</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="timer" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timer">Timer</TabsTrigger>
                <TabsTrigger value="manual">Handmatig invoeren</TabsTrigger>
              </TabsList>

              {/* Timer Tab */}
              <TabsContent value="timer">
                <Card>
                  <CardHeader>
                    <CardTitle>Timer</CardTitle>
                    <CardDescription>Start de timer om je tijd automatisch bij te houden</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Timer Display */}
                    <div className="text-center py-8">
                      <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
                        {formatTime(elapsedSeconds)}
                      </div>
                      <Button 
                        size="lg" 
                        onClick={handleStartStop}
                        className={isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                      >
                        {isRunning ? (
                          <>
                            <Square className="mr-2 h-5 w-5" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-5 w-5" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Project Selection */}
                    <div className="space-y-2">
                      <Label>Project *</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isRunning}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => {
                            const client = getClientById(project.clientId);
                            return (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name} - {client?.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Beschrijving</Label>
                      <Textarea
                        placeholder="Waar heb je aan gewerkt?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isRunning}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manual Entry Tab */}
              <TabsContent value="manual">
                <Card>
                  <CardHeader>
                    <CardTitle>Handmatig invoeren</CardTitle>
                    <CardDescription>Voeg uren toe die je al hebt gewerkt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Datum *</Label>
                          <Input
                            type="date"
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Project *</Label>
                          <Select value={manualProject} onValueChange={setManualProject} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Starttijd *</Label>
                          <Input
                            type="time"
                            value={manualStartTime}
                            onChange={(e) => setManualStartTime(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Eindtijd *</Label>
                          <Input
                            type="time"
                            value={manualEndTime}
                            onChange={(e) => setManualEndTime(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Beschrijving</Label>
                        <Textarea
                          placeholder="Waar heb je aan gewerkt?"
                          value={manualDescription}
                          onChange={(e) => setManualDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Tijd toevoegen
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Today's Entries */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Vandaag geregistreerd</CardTitle>
                <CardDescription>
                  Totaal: {Math.round(todayHours * 10) / 10} uur
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayEntries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nog geen tijd geregistreerd vandaag
                  </p>
                ) : (
                  <div className="space-y-3">
                    {todayEntries.map((entry) => {
                      const project = getProjectById(entry.projectId);
                      return (
                        <div key={entry.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${project?.color || 'bg-gray-400'}`} />
                            <div>
                              <p className="font-medium text-gray-900">{project?.name}</p>
                              <p className="text-sm text-gray-600">{entry.description}</p>
                              <p className="text-xs text-gray-500">
                                {entry.startTime} - {entry.endTime}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {Math.round(entry.duration / 60 * 10) / 10}h
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Vandaag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(todayHours * 10) / 10}h
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {todayEntries.length} registraties
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sneltoetsen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start/Stop timer</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nieuwe registratie</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">N</kbd>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>💡 Vergeet niet een beschrijving toe te voegen voor later</p>
                <p>⏰ Zet de timer aan zodra je begint met werken</p>
                <p>📊 Check je dashboard voor een overzicht</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

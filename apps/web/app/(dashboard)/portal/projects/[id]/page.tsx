'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPortalProject, addComment, toggleMilestone } from '@/lib/portal/actions';
import type { PortalProject } from '@/lib/portal/actions';
import {
  ArrowLeft,
  Check,
  Upload,
  FileText,
  MessageSquare,
  Calendar,
  GripVertical,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const statusColors: Record<string, string> = {
  'offerte': 'bg-muted text-foreground',
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

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [project, setProject] = useState<PortalProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPortalProject(id);
        setProject(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !project) return;
    setSubmitting(true);
    try {
      const result = await addComment(project.id, newComment);
      if (result.success) {
        setNewComment('');
        // Reload project to get updated comments
        const data = await getPortalProject(id);
        setProject(data);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    const result = await toggleMilestone(milestoneId, !completed);
    if (result.success) {
      // Reload project to get updated milestones/progress
      const data = await getPortalProject(id);
      setProject(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Project niet gevonden</h2>
        <Link href="/portal/projects">
          <Button variant="outline">Terug naar projecten</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
        <div className="mb-6">
          <Link href="/portal/projects">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar projecten
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground">{project.clientName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={statusColors[project.displayStatus] ?? 'bg-muted text-foreground'}>
                {statusLabels[project.displayStatus] ?? project.displayStatus}
              </Badge>
              <Link href={`/portal/projects/${project.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Klant View
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Project Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Beschrijving</h3>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Voortgang</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>
                {project.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="font-medium">
                      {new Date(project.deadline).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="files">Bestanden ({project.files.length})</TabsTrigger>
            <TabsTrigger value="comments">Reacties ({project.comments.length})</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Mijlpalen</CardTitle>
                <CardDescription>Sleep om de volgorde aan te passen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.milestones
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-move"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        milestone.completed ? 'bg-green-100' : 'bg-muted'
                      }`}>
                        {milestone.completed ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${milestone.completed ? 'text-muted-foreground line-through' : ''}`}>
                          {milestone.title}
                        </p>
                        {milestone.due_date && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(milestone.due_date).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={milestone.completed ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleMilestone(milestone.id, milestone.completed)}
                      >
                        {milestone.completed ? 'Ongedaan maken' : 'Markeer compleet'}
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Mijlpaal Toevoegen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Gedeelde Bestanden</CardTitle>
                <CardDescription>Upload bestanden om met je klant te delen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center mb-6 hover:bg-muted/50 transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium mb-1">Klik om bestanden te uploaden</p>
                  <p className="text-xs text-muted-foreground">of sleep bestanden hierheen</p>
                </div>

                {project.files.length > 0 ? (
                  <div className="space-y-2">
                    {project.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.size} &bull; Geüpload op {new Date(file.uploadedAt).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">Nog geen bestanden geüpload</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Reacties & Updates</CardTitle>
                <CardDescription>Communiceer met je klant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {project.comments.length > 0 ? (
                    project.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          comment.isClient ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {comment.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.timestamp).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-8">Nog geen reacties</p>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <Textarea
                    placeholder="Schrijf een update of reactie..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleAddComment} disabled={submitting || !newComment.trim()}>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      Plaats Reactie
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

  );
}

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { mockProjects, mockBranding } from '@/lib/portal/mock-data';
import { 
  Check, 
  FileText, 
  MessageSquare, 
  Calendar,
  Download,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

export default function ClientPortalPage({ params }: { params: Promise<{ slug: string; projectId: string }> }) {
  const { projectId } = React.use(params);
  const project = mockProjects.find(p => p.id === projectId);
  const [newComment, setNewComment] = useState('');

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project niet gevonden</h2>
          <p className="text-gray-600">Dit project bestaat niet of is niet beschikbaar</p>
        </div>
      </div>
    );
  }

  const completedMilestones = project.milestones.filter(m => m.completed).length;
  const totalMilestones = project.milestones.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Simple branded header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: mockBranding.primaryColor }}
              >
                {mockBranding.companyName.charAt(0)}
              </div>
              <div>
                <h1 className="font-bold text-lg">{mockBranding.companyName}</h1>
                <p className="text-xs text-gray-600">Project Portal</p>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              Voor: {project.clientName}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Project Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{project.name}</h2>
          <p className="text-gray-600 mb-4">{project.description}</p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Deadline:</span>
              <span className="font-medium">
                {new Date(project.deadline).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Mijlpalen:</span>
              <span className="font-medium">{completedMilestones} van {totalMilestones} voltooid</span>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6 border-2" style={{ borderColor: mockBranding.primaryColor + '40' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Totale Voortgang</h3>
              <span className="text-2xl font-bold" style={{ color: mockBranding.primaryColor }}>
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} className="h-3" />
            <p className="text-sm text-gray-600 mt-2">
              Het project loopt goed! We verwachten op tijd af te ronden.
            </p>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mijlpalen & Planning</CardTitle>
            <CardDescription>Volg de voortgang van het project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.milestones.sort((a, b) => a.order - b.order).map((milestone, index) => (
                <div key={milestone.id} className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                    milestone.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {milestone.completed ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <span className="font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${milestone.completed ? 'text-gray-500' : 'text-gray-900'}`}>
                      {milestone.title}
                      {milestone.completed && (
                        <span className="ml-2 text-green-600 text-sm">✓ Voltooid</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Verwachte datum: {new Date(milestone.dueDate).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Files */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gedeelde Bestanden</CardTitle>
            <CardDescription>Download de bestanden die voor je zijn gedeeld</CardDescription>
          </CardHeader>
          <CardContent>
            {project.files.length > 0 ? (
              <div className="space-y-3">
                {project.files.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded"
                        style={{ backgroundColor: mockBranding.primaryColor + '20' }}
                      >
                        <FileText className="h-5 w-5" style={{ color: mockBranding.primaryColor }} />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.size} • {new Date(file.uploadedAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                    <Button style={{ backgroundColor: mockBranding.primaryColor }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Er zijn nog geen bestanden gedeeld
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Updates & Communicatie</CardTitle>
            <CardDescription>Stel vragen of geef feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {project.comments.length > 0 ? (
                project.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      comment.isClient 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'text-white'
                    }`} style={!comment.isClient ? { backgroundColor: mockBranding.primaryColor } : {}}>
                      {comment.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">Nog geen berichten</p>
              )}
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-3">
              <Textarea 
                placeholder="Stel een vraag of plaats een reactie..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button 
                  style={{ backgroundColor: mockBranding.primaryColor }}
                  onClick={() => setNewComment('')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Verstuur Bericht
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval CTA */}
        {project.needsApproval && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Klaar voor Goedkeuring</h3>
                    <p className="text-sm text-green-700">Dit project is klaar voor jouw review en goedkeuring</p>
                  </div>
                </div>
                <Button 
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Goedkeuren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>Powered by {mockBranding.companyName}</p>
        </div>
      </footer>
    </div>
  );
}

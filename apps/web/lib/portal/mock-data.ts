export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  activeProjects: number;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  description: string;
  status: 'offerte' | 'in-uitvoering' | 'review' | 'afgerond';
  deadline: string;
  progress: number;
  milestones: Milestone[];
  files: ProjectFile[];
  comments: Comment[];
  needsApproval: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  order: number;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  type: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isClient: boolean;
}

export interface Activity {
  id: string;
  type: 'project' | 'approval' | 'comment' | 'file';
  message: string;
  timestamp: string;
  projectId: string;
}

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Jan de Vries',
    company: 'De Vries Holding',
    email: 'jan@devries.nl',
    activeProjects: 2,
  },
  {
    id: '2',
    name: 'Sophie Bakker',
    company: 'Bakker Media',
    email: 'sophie@bakkermedia.nl',
    activeProjects: 1,
  },
  {
    id: '3',
    name: 'Mohammed Ali',
    company: 'Ali Consultancy',
    email: 'm.ali@aliconsultancy.nl',
    activeProjects: 0,
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    clientId: '1',
    clientName: 'De Vries Holding',
    description: 'Complete redesign van de corporate website met moderne uitstraling',
    status: 'in-uitvoering',
    deadline: '2026-03-15',
    progress: 65,
    needsApproval: false,
    milestones: [
      {
        id: 'm1',
        title: 'Design wireframes opleveren',
        completed: true,
        dueDate: '2026-02-01',
        order: 1,
      },
      {
        id: 'm2',
        title: 'Homepage ontwikkelen',
        completed: true,
        dueDate: '2026-02-10',
        order: 2,
      },
      {
        id: 'm3',
        title: 'Content migratie',
        completed: false,
        dueDate: '2026-02-28',
        order: 3,
      },
      {
        id: 'm4',
        title: 'Testing en optimalisatie',
        completed: false,
        dueDate: '2026-03-10',
        order: 4,
      },
    ],
    files: [
      {
        id: 'f1',
        name: 'design-v3.fig',
        size: '2.3 MB',
        uploadedAt: '2026-02-05',
        type: 'design',
      },
      {
        id: 'f2',
        name: 'homepage-mockup.png',
        size: '845 KB',
        uploadedAt: '2026-02-08',
        type: 'image',
      },
    ],
    comments: [
      {
        id: 'c1',
        author: 'Jij',
        content: 'Homepage is klaar voor review. Bekijk vooral de nieuwe navigatie structuur.',
        timestamp: '2026-02-10T14:30:00',
        isClient: false,
      },
      {
        id: 'c2',
        author: 'Jan de Vries',
        content: 'Ziet er fantastisch uit! Kleine aanpassing: logo iets groter graag.',
        timestamp: '2026-02-11T09:15:00',
        isClient: true,
      },
    ],
  },
  {
    id: '2',
    name: 'Brand Identity Pakket',
    clientId: '2',
    clientName: 'Bakker Media',
    description: 'Logo, kleurenpalet, typografie en huisstijlhandboek',
    status: 'review',
    deadline: '2026-02-28',
    progress: 90,
    needsApproval: true,
    milestones: [
      {
        id: 'm5',
        title: 'Logo concepten (3 opties)',
        completed: true,
        dueDate: '2026-02-01',
        order: 1,
      },
      {
        id: 'm6',
        title: 'Kleurenpalet en typografie',
        completed: true,
        dueDate: '2026-02-08',
        order: 2,
      },
      {
        id: 'm7',
        title: 'Huisstijlhandboek',
        completed: true,
        dueDate: '2026-02-15',
        order: 3,
      },
    ],
    files: [
      {
        id: 'f3',
        name: 'logo-final.svg',
        size: '124 KB',
        uploadedAt: '2026-02-12',
        type: 'design',
      },
      {
        id: 'f4',
        name: 'huisstijlhandboek.pdf',
        size: '4.2 MB',
        uploadedAt: '2026-02-15',
        type: 'document',
      },
    ],
    comments: [
      {
        id: 'c3',
        author: 'Jij',
        content: 'Het complete brand identity pakket is klaar voor goedkeuring!',
        timestamp: '2026-02-15T16:00:00',
        isClient: false,
      },
    ],
  },
  {
    id: '3',
    name: 'Social Media Campagne',
    clientId: '1',
    clientName: 'De Vries Holding',
    description: 'Q1 2026 social media strategie en content productie',
    status: 'offerte',
    deadline: '2026-04-01',
    progress: 10,
    needsApproval: false,
    milestones: [
      {
        id: 'm8',
        title: 'Strategie document',
        completed: false,
        dueDate: '2026-03-01',
        order: 1,
      },
      {
        id: 'm9',
        title: 'Content planning',
        completed: false,
        dueDate: '2026-03-15',
        order: 2,
      },
    ],
    files: [],
    comments: [],
  },
];

export const mockActivities: Activity[] = [
  {
    id: 'a1',
    type: 'approval',
    message: 'Bakker Media heeft goedkeuring nodig voor Brand Identity Pakket',
    timestamp: '2026-02-15T16:05:00',
    projectId: '2',
  },
  {
    id: 'a2',
    type: 'comment',
    message: 'Jan de Vries heeft gereageerd op Website Redesign',
    timestamp: '2026-02-11T09:15:00',
    projectId: '1',
  },
  {
    id: 'a3',
    type: 'file',
    message: 'Nieuw bestand geüpload: huisstijlhandboek.pdf',
    timestamp: '2026-02-15T15:45:00',
    projectId: '2',
  },
  {
    id: 'a4',
    type: 'project',
    message: 'Project "Website Redesign" status gewijzigd naar In uitvoering',
    timestamp: '2026-02-08T10:00:00',
    projectId: '1',
  },
];

export const mockBranding = {
  companyName: 'Mijn Creatieve Bureau',
  primaryColor: '#3b82f6',
  portalUrl: 'portal.mijnbureau.nl',
};

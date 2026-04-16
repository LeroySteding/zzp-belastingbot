export interface Client {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  hourlyRate: number;
  budgetHours: number;
  color: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  description: string;
}

export interface Timesheet {
  id: string;
  startDate: string;
  endDate: string;
  status: 'concept' | 'goedgekeurd' | 'gefactureerd';
  entries: string[]; // time entry IDs
}

export const clients: Client[] = [
  {
    id: 'c1',
    name: 'TechStart BV',
    email: 'contact@techstart.nl',
  },
  {
    id: 'c2',
    name: 'Webwinkel Amsterdam',
    email: 'info@webwinkel-ams.nl',
  },
  {
    id: 'c3',
    name: 'Marketing Bureau Zuid',
    email: 'hallo@marketingzuid.nl',
  },
];

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    clientId: 'c1',
    hourlyRate: 85,
    budgetHours: 120,
    color: 'bg-blue-500',
  },
  {
    id: 'p2',
    name: 'E-commerce Platform',
    clientId: 'c2',
    hourlyRate: 95,
    budgetHours: 200,
    color: 'bg-green-500',
  },
  {
    id: 'p3',
    name: 'SEO Optimalisatie',
    clientId: 'c3',
    hourlyRate: 75,
    budgetHours: 40,
    color: 'bg-purple-500',
  },
  {
    id: 'p4',
    name: 'API Development',
    clientId: 'c1',
    hourlyRate: 100,
    budgetHours: 80,
    color: 'bg-orange-500',
  },
  {
    id: 'p5',
    name: 'Content Strategie',
    clientId: 'c3',
    hourlyRate: 70,
    budgetHours: 60,
    color: 'bg-pink-500',
  },
];

// Generate time entries for the last 2 weeks
const generateTimeEntries = (): TimeEntry[] => {
  const entries: TimeEntry[] = [];
  const now = new Date();
  const projectIds = projects.map(p => p.id);
  
  const descriptions = [
    'Frontend development',
    'Backend API werk',
    'Database optimalisatie',
    'Client meeting',
    'Code review',
    'Bug fixes',
    'Feature implementatie',
    'Testing en QA',
    'Documentatie',
    'Design aanpassingen',
  ];

  let entryId = 1;
  
  // Generate entries for the last 14 days
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // 2-4 entries per day
    const entriesPerDay = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < entriesPerDay; i++) {
      const projectId = projectIds[Math.floor(Math.random() * projectIds.length)];
      const startHour = 9 + Math.floor(Math.random() * 6);
      const duration = [60, 90, 120, 150, 180, 240][Math.floor(Math.random() * 6)];
      
      entries.push({
        id: `e${entryId++}`,
        projectId,
        date: date.toISOString().split('T')[0],
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${Math.floor(startHour + duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`,
        duration,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
      });
    }
  }
  
  return entries.sort((a, b) => b.date.localeCompare(a.date));
};

export const timeEntries: TimeEntry[] = generateTimeEntries();

export const timesheets: Timesheet[] = [
  {
    id: 't1',
    startDate: '2026-02-03',
    endDate: '2026-02-09',
    status: 'goedgekeurd',
    entries: timeEntries.filter(e => e.date >= '2026-02-03' && e.date <= '2026-02-09').map(e => e.id),
  },
  {
    id: 't2',
    startDate: '2026-02-10',
    endDate: '2026-02-14',
    status: 'concept',
    entries: timeEntries.filter(e => e.date >= '2026-02-10' && e.date <= '2026-02-14').map(e => e.id),
  },
];

// Helper functions
export const getClientById = (id: string) => clients.find(c => c.id === id);
export const getProjectById = (id: string) => projects.find(p => p.id === id);
export const getEntriesByProject = (projectId: string) => timeEntries.filter(e => e.projectId === projectId);
export const getEntriesByDateRange = (start: string, end: string) => 
  timeEntries.filter(e => e.date >= start && e.date <= end);

export const calculateProjectStats = (projectId: string) => {
  const entries = getEntriesByProject(projectId);
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalHours = totalMinutes / 60;
  const project = getProjectById(projectId);
  
  if (!project) return null;
  
  return {
    totalHours,
    revenue: totalHours * project.hourlyRate,
    budgetPercentage: (totalHours / project.budgetHours) * 100,
  };
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  ChevronLeft, 
  Clock, 
  Plus, 
  Search, 
  User, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle,
  LayoutDashboard,
  Filter,
  Settings,
  Mail,
  Users,
  Check,
  X,
  Database,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PPSProject, Task, ProjectStatus, TaskStatus, UrgencyLevel, Pivot, EmailTemplate } from './types';
import { MOCK_PROJECTS, MOCK_PIVOTS } from './mockData';
import { supabase, hasSupabaseConfig } from './lib/supabase';

// --- Constants ---
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: localStorage.getItem('pps_admin_password') || 'pps2024'
};

type UserRole = 'admin' | 'guest';

// --- Utility Functions ---

const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case 'green': return 'bg-emerald-500';
    case 'yellow': return 'bg-amber-500';
    case 'red': return 'bg-rose-500';
    default: return 'bg-slate-500';
  }
};

const getStatusTextColor = (status: ProjectStatus) => {
  switch (status) {
    case 'green': return 'text-emerald-700';
    case 'yellow': return 'text-amber-700';
    case 'red': return 'text-rose-700';
    default: return 'text-slate-700';
  }
};

const getStatusBgColor = (status: ProjectStatus) => {
  switch (status) {
    case 'green': return 'bg-emerald-50';
    case 'yellow': return 'bg-amber-50';
    case 'red': return 'bg-rose-50';
    default: return 'bg-slate-50';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const ProgressBar = ({ progress, status }: { progress: number, status: ProjectStatus }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      className={`h-full ${getStatusColor(status)}`}
    />
  </div>
);

const calculateStatus = (project: PPSProject): ProjectStatus => {
  const now = new Date();
  const end = new Date(project.plannedEnd);
  const start = new Date(project.plannedStart);
  
  if (project.progress === 100) return 'green';
  
  // Atrasado: Data fim ultrapassada
  if (now > end) return 'red';
  
  // Risco: Faltam menos de 7 dias e progresso < 70%
  const daysRemaining = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysRemaining < 7 && project.progress < 70) return 'yellow';
  
  // Risco: Progresso desproporcional ao tempo decorrido
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const expectedProgress = (elapsed / totalDuration) * 100;
  
  if (project.progress < (expectedProgress - 20)) return 'yellow';
  
  return 'green';
};

const getUrgencyLabel = (level: number) => {
  switch (level) {
    case 1: return '1 - Visual';
    case 2: return '2 - Funcional';
    case 3: return '3 - Imobiliza Veículo';
    case 4: return '4 - Segurança';
    default: return '';
  }
};

const GanttChart = ({ projects, onSelect }: { projects: PPSProject[], onSelect: (id: string) => void }) => {
  const now = new Date();
  
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (projects.length === 0) {
      const min = new Date();
      const max = new Date();
      min.setDate(min.getDate() - 7);
      max.setDate(max.getDate() + 21);
      return { minDate: min, maxDate: max, totalDays: 28 };
    }
    
    const dates = projects.flatMap(p => [new Date(p.plannedStart).getTime(), new Date(p.plannedEnd).getTime()]);
    dates.push(now.getTime()); // Include today in the range
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 7);
    
    return {
      minDate: min,
      maxDate: max,
      totalDays: Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24))
    };
  }, [projects]);

  const getPositionStyles = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const left = ((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
    const width = ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const todayPos = useMemo(() => {
    return ((now.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
  }, [minDate, totalDays]);

  // Generate week markers
  const weeks = useMemo(() => {
    const w = [];
    const date = new Date(minDate);
    // Move to next monday if not monday
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);

    while (date < maxDate) {
      const left = ((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
      w.push({
        label: `S${Math.ceil(date.getDate() / 7)}`,
        left: `${left}%`
      });
      date.setDate(date.getDate() + 7);
    }
    return w;
  }, [minDate, maxDate, totalDays]);

  const months = useMemo(() => {
    const m = [];
    const date = new Date(minDate);
    date.setDate(1);
    while (date < maxDate) {
      const left = ((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
      m.push({
        label: date.toLocaleDateString('pt-PT', { month: 'short' }),
        left: `${left}%`
      });
      date.setMonth(date.getMonth() + 1);
    }
    return m;
  }, [minDate, maxDate, totalDays]);

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm relative">
      <div className="min-w-[1000px] p-6">
        <div className="relative border-l border-slate-200 pt-12 pb-4">
          {/* Month headers */}
          {months.map((m, idx) => (
            <div 
              key={idx} 
              className="absolute top-0 border-l border-slate-200 h-full text-[10px] font-black text-slate-400 pl-2 uppercase tracking-widest"
              style={{ left: m.left }}
            >
              {m.label}
            </div>
          ))}

          {/* Week grid */}
          {weeks.map((w, idx) => (
            <div 
              key={idx} 
              className="absolute top-6 border-l border-slate-50 h-full text-[9px] font-bold text-slate-300 pl-1 pt-1"
              style={{ left: w.left }}
            >
              {w.label}
            </div>
          ))}

          {/* Today line */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-rose-400 z-10 opacity-70"
            style={{ left: `${todayPos}%` }}
          >
            <div className="absolute top-0 -left-1.5 w-3 h-3 bg-rose-400 rounded-full border-2 border-white shadow-sm" title="Hoje" />
          </div>

          {/* Project bars */}
          <div className="space-y-6 pt-10">
            {projects.map((project) => {
              const { left, width } = getPositionStyles(project.plannedStart, project.plannedEnd);
              const status = calculateStatus(project);
              const isOverdue = now > new Date(project.plannedEnd) && project.progress < 100;
              
              // Calculate delay width if overdue
              let delayWidth = 0;
              if (isOverdue) {
                const end = new Date(project.plannedEnd);
                delayWidth = ((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
              }

              return (
                <div key={project.id} className="relative h-14 group">
                  {/* Delay Indicator Bar */}
                  {isOverdue && (
                    <div 
                      className="absolute h-1 top-1/2 -translate-y-1/2 bg-rose-500/30 border-t border-b border-rose-300 opacity-50 z-0"
                      style={{ left: `calc(${left} + ${width})`, width: `${delayWidth}%` }}
                    />
                  )}
                  
                  <motion.div
                    whileHover={{ scale: 1.01, zIndex: 20 }}
                    onClick={() => onSelect(project.id)}
                    className={`absolute cursor-pointer rounded-lg bg-white border shadow-sm p-2 flex flex-col justify-between overflow-hidden z-10 ${isOverdue ? 'border-rose-400 shadow-rose-100' : 'border-slate-100'}`}
                    style={{ left, width: `calc(${width} + 2px)`, minWidth: '120px' }}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] font-bold text-slate-800 truncate uppercase leading-tight">{project.name}</span>
                      <div className="flex gap-1 items-center">
                        {isOverdue && <Clock className="w-2.5 h-2.5 text-rose-500 animate-pulse" />}
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(status)}`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[9px] text-slate-500 font-bold truncate uppercase">{project.owner}</span>
                      <span className={`text-[9px] font-black ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>{project.progress}%</span>
                    </div>
                    <ProgressBar progress={project.progress} status={status} />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [projects, setProjects] = useState<PPSProject[]>([]);
  const [pivots, setPivots] = useState<Pivot[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // Carregar dados iniciais (Supabase ou LocalStorage)
  useEffect(() => {
    async function init() {
      if (!hasSupabaseConfig) {
        const savedProjects = localStorage.getItem('pps_projects');
        const savedPivots = localStorage.getItem('pps_pivots');
        setProjects(savedProjects ? JSON.parse(savedProjects) : MOCK_PROJECTS);
        setPivots(savedPivots ? JSON.parse(savedPivots) : MOCK_PIVOTS);
        setLoading(false);
        setSupabaseConnected(false);
        return;
      }

      try {
        const { data: projData, error: projError } = await supabase.from('projects').select('*');
        const { data: pivData } = await supabase.from('pivots').select('*');
        const { data: taskData } = await supabase.from('tasks').select('*');

        if (projError) throw projError;

        setSupabaseConnected(true);

        if (projData) {
          const formatted = projData.map(p => ({
            ...p,
            urgency: p.urgency as UrgencyLevel,
            plannedStart: p.planned_start,
            plannedEnd: p.planned_end,
            actualStart: p.actual_start,
            actualEnd: p.actual_end,
            imageUrl: p.image_url,
            tasks: (taskData || [])
              .filter(t => t.project_id === p.id)
              .map(t => ({
                id: t.id,
                description: t.description,
                responsible: t.responsible,
                deadline: t.deadline,
                status: t.status as TaskStatus
              }))
          }));
          setProjects(formatted);
        }
        if (pivData) setPivots(pivData);
      } catch (err) {
        console.error("Erro Supabase:", err);
        setSupabaseConnected(false);
        // Fallback
        const savedProjects = localStorage.getItem('pps_projects');
        setProjects(savedProjects ? JSON.parse(savedProjects) : MOCK_PROJECTS);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>(() => {
    const saved = localStorage.getItem('pps_email_template');
    return saved ? JSON.parse(saved) : {
      subject: 'Pedido de Feedback PPS: {projectName}',
      bodyBefore: 'Olá,\n\nSolicitamos feedback sobre o estado das acções atribuídas no âmbito do projecto PPS: {projectName}.\n\nTarefas pendentes:',
      bodyAfter: '\n\nMelhores cumprimentos,\nGestão de Processo'
    };
  });

  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return localStorage.getItem('pps_user_role') as UserRole | null;
  });
  const [loginError, setLoginError] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => [msg, ...prev].slice(0, 5));
  };

  // Sync to local and Supabase
  useEffect(() => {
    if (loading) return;
    localStorage.setItem('pps_projects', JSON.stringify(projects));
  }, [projects, loading]);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem('pps_pivots', JSON.stringify(pivots));
  }, [pivots, loading]);

  useEffect(() => {
    localStorage.setItem('pps_email_template', JSON.stringify(emailTemplate));
  }, [emailTemplate]);

  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedId), 
  [projects, selectedId]);

  const stats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.progress === 100).length;
    const green = projects.filter(p => p.status === 'green').length;
    return { total, completed, green };
  }, [projects]);

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const urgency = parseInt(formData.get('urgency') as string) as UrgencyLevel;
      
      const newProject: PPSProject = {
        id: hasSupabaseConfig ? undefined : `pps-${Date.now()}`,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        owner: formData.get('owner') as string,
        urgency,
        status: 'green',
        progress: 0,
        plannedStart: formData.get('start') as string,
        plannedEnd: formData.get('end') as string,
        tasks: []
      } as any;

      if (hasSupabaseConfig) {
        addLog("Tentando inserir no Supabase...");
        const { data, error } = await supabase.from('projects').insert({
          name: newProject.name,
          description: newProject.description,
          owner: newProject.owner,
          urgency: newProject.urgency,
          planned_start: newProject.plannedStart,
          planned_end: newProject.plannedEnd,
          progress: 0
        }).select().single();
        
        if (error) {
          addLog(`Erro Supabase: ${error.message}`);
          alert(`Erro no Supabase: ${error.message}. A criar localmente por agora.`);
          // Fallback para local se o supabase falhar
          (newProject as any).id = `pps-${Date.now()}`;
          newProject.status = calculateStatus(newProject);
          setProjects([...projects, newProject]);
        } else if (data) {
          addLog("Sucesso ao criar no Supabase!");
          newProject.id = data.id;
          newProject.status = calculateStatus(newProject);
          setProjects([...projects, newProject]);
        }
      } else {
        addLog("Criando projeto em modo Local.");
        (newProject as any).id = `pps-${Date.now()}`;
        newProject.status = calculateStatus(newProject);
        setProjects([...projects, newProject]);
      }

      setIsAddingProject(false);
    } catch (err) {
      addLog(`Erro Crítico: ${err instanceof Error ? err.message : String(err)}`);
      alert("Ocorreu um erro ao processar o formulário. Verifique os logs nas Definições.");
    }
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedId) return;
    
    const formData = new FormData(e.currentTarget);
    const taskDesc = formData.get('description') as string;
    const taskResp = formData.get('responsible') as string;
    const taskDeadline = formData.get('deadline') as string;

    const newTask: Task = {
      id: hasSupabaseConfig ? undefined : `task-${Date.now()}`,
      description: taskDesc,
      responsible: taskResp,
      deadline: taskDeadline,
      status: 'por-fazer',
    } as any;

    if (hasSupabaseConfig) {
      addLog("Adicionando tarefa no Supabase...");
      const { data, error } = await supabase.from('tasks').insert({
        project_id: selectedId,
        description: newTask.description,
        responsible: newTask.responsible,
        deadline: newTask.deadline,
        status: 'por-fazer'
      }).select().single();

      if (error) {
        addLog(`Erro tarefa: ${error.message}`);
        (newTask as any).id = `task-${Date.now()}`;
        setProjects(projects.map(p => {
          if (p.id === selectedId) return { ...p, tasks: [...p.tasks, newTask] };
          return p;
        }));
      } else if (data) {
        addLog("Tarefa adicionada com sucesso!");
        newTask.id = data.id;
        setProjects(projects.map(p => {
          if (p.id === selectedId) return { ...p, tasks: [...p.tasks, newTask] };
          return p;
        }));
        (e.target as HTMLFormElement).reset();
      }
    } else {
      addLog("Tarefa adicionada em modo Local.");
      (newTask as any).id = `task-${Date.now()}`;
      setProjects(projects.map(p => {
        if (p.id === selectedId) return { ...p, tasks: [...p.tasks, newTask] };
        return p;
      }));
    }
    e.currentTarget.reset();
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (hasSupabaseConfig) {
      addLog(`Atualizando status da tarefa ${taskId}...`);
      const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
      if (error) addLog(`Erro ao atualizar tarefa: ${error.message}`);
    }

    setProjects(projects.map(p => {
      if (p.id === selectedId) {
        const updatedTasks = p.tasks.map(t => t.id === taskId ? { ...t, status } : t);
        const completedTasks = updatedTasks.filter(t => t.status === 'concluido').length;
        const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;
        
        // Update progress in supabase too
        if (hasSupabaseConfig) {
          supabase.from('projects').update({ progress }).eq('id', selectedId).then();
        }

        return { ...p, tasks: updatedTasks, progress };
      }
      return p;
    }));
  };

  const deleteProject = async (id: string) => {
    if (userRole !== 'admin') return;
    if (confirm('Tem a certeza que deseja eliminar este projecto?')) {
      if (hasSupabaseConfig) {
        addLog(`Eliminando projeto ${id}...`);
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) addLog(`Erro ao eliminar: ${error.message}`);
      }
      setProjects(projects.filter(p => p.id !== id));
      setView('dashboard');
      setSelectedId(null);
    }
  };

  const handleUpdateDates = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedId || userRole !== 'admin') return;

    const formData = new FormData(e.currentTarget);
    const start = formData.get('start') as string;
    const end = formData.get('end') as string;

    if (hasSupabaseConfig) {
      addLog("Atualizando datas no Supabase...");
      const { error } = await supabase.from('projects').update({
        planned_start: start,
        planned_end: end
      }).eq('id', selectedId);
      if (error) {
        addLog(`Erro ao atualizar datas: ${error.message}`);
        alert("Erro no Supabase ao salvar datas.");
        return;
      }
    }

    setProjects(projects.map(p => {
      if (p.id === selectedId) {
        const updated = { ...p, plannedStart: start, plannedEnd: end };
        updated.status = calculateStatus(updated);
        return updated;
      }
      return p;
    }));
    setIsEditingDates(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      if (hasSupabaseConfig) {
        addLog("Enviando foto ao Supabase...");
        const { error } = await supabase.from('projects').update({
          image_url: base64String
        }).eq('id', selectedId);

        if (error) {
          addLog(`Erro ao salvar foto: ${error.message}`);
          alert("Erro ao salvar foto no banco de dados.");
          return;
        }
      }

      setProjects(projects.map(p => {
        if (p.id === selectedId) return { ...p, imageUrl: base64String };
        return p;
      }));
      addLog("Foto do PPS anexada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const u = formData.get('username') as string;
    const p = formData.get('password') as string;

    if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
      setUserRole('admin');
      localStorage.setItem('pps_user_role', 'admin');
    } else {
      setLoginError('Credenciais inválidas');
    }
  };

  const enterAsGuest = () => {
    setUserRole('guest');
    localStorage.setItem('pps_user_role', 'guest');
  };

  const logout = () => {
    setUserRole(null);
    localStorage.removeItem('pps_user_role');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">A ligar ao servidor...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 selection:bg-emerald-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          <div className="bg-emerald-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">PPS Control</h1>
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Projectos</p>
          </div>
          
          <div className="p-8 space-y-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Main User</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    name="username"
                    type="text" 
                    required
                    placeholder="Utilizador"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    name="password"
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                  />
                </div>
              </div>
              {loginError && <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{loginError}</p>}
              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
              >
                Entrar como Administrador
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px]"><span className="px-2 bg-white text-slate-400 font-black uppercase">Ou</span></div>
            </div>

            <button 
              onClick={enterAsGuest}
              className="w-full py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Entrar como Convidado
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100">
      {/* Navbar */}
      <nav className="bg-white border-bottom border-slate-200 sticky top-0 z-30 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-emerald-600 p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">PPS <span className="text-emerald-600">Control</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${supabaseConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
              <Database className={`w-3.5 h-3.5 ${supabaseConnected ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-tight">
                {supabaseConnected ? 'Supabase Ligado' : 'Modo Local'}
              </span>
            </div>
            {userRole === 'admin' && (
              <>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                  title="Definições"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsAddingProject(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo PPS</span>
                </button>
              </>
            )}
            <div 
              onClick={() => { if(confirm('Sair da sessão?')) logout(); }}
              className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all"
              title={`Sessão: ${userRole === 'admin' ? 'Administrador' : 'Convidado'} (Clique para Sair)`}
            >
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl"><BarChart3 className="w-6 h-6 text-blue-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Projetos</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-emerald-50 p-3 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Concluídos</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-amber-50 p-3 rounded-xl"><AlertCircle className="w-6 h-6 text-amber-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">On Track</p>
                    <p className="text-2xl font-bold">{stats.green}</p>
                  </div>
                </div>
              </div>

              {/* Gantt View Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Vista Cronológica (Gantt)
                  </h2>
                  <div className="flex gap-4 items-center">
                     <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Ok</span>
                     <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"><div className="w-2 h-2 rounded-full bg-amber-500" /> Risco</span>
                     <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"><div className="w-2 h-2 rounded-full bg-rose-500" /> Atraso</span>
                     <div className="group relative">
                        <AlertCircle className="w-4 h-4 text-slate-300 cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-800 text-white p-3 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                          <p className="font-bold mb-1 uppercase tracking-wider text-emerald-400">Cálculo de Estados:</p>
                          <ul className="space-y-1 opacity-80">
                            <li><span className="text-rose-400 font-bold">ATRASO:</span> Data fim ultrapassada e progresso &lt; 100%.</li>
                            <li><span className="text-amber-400 font-bold">RISCO:</span> Menos de 7 dias para o fim ou progresso insuficiente para o tempo decorrido.</li>
                            <li><span className="text-emerald-400 font-bold">OK:</span> Dentro do planeamento.</li>
                          </ul>
                        </div>
                     </div>
                  </div>
                </div>
                <GanttChart projects={projects} onSelect={(id) => { setSelectedId(id); setView('detail'); }} />
              </section>

              {/* Project List Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Todos os PPS</h2>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar projetos..." 
                      className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(project => (
                    <motion.div 
                      key={project.id}
                      whileHover={{ y: -4 }}
                      onClick={() => { setSelectedId(project.id); setView('detail'); }}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1">
                          <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit ${getStatusBgColor(calculateStatus(project))} ${getStatusTextColor(calculateStatus(project))}`}>
                            {calculateStatus(project) === 'green' ? 'Em dia' : calculateStatus(project) === 'yellow' ? 'Em risco' : 'Em atraso'}
                          </div>
                          <div className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider w-fit">
                            {getUrgencyLabel(project.urgency)}
                          </div>
                        </div>
                        <span className="text-slate-400 group-hover:text-emerald-600 transition-colors"><Edit2 className="w-4 h-4" /></span>
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors uppercase text-sm tracking-tight">{project.name}</h3>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{project.description}</p>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5 grayscale opacity-70">
                          <User className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">{project.owner}</span>
                        </div>
                        <div className="flex items-center gap-1.5 grayscale opacity-70">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">{formatDate(project.plannedEnd)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Progresso</span>
                          <span className="text-slate-700">{project.progress}%</span>
                        </div>
                        <ProgressBar progress={project.progress} status={project.status} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Back & Actions */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setView('dashboard')}
                  className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold transition-colors group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Voltar ao Dashboard
                </button>
                <div className="flex gap-2">
                  {userRole === 'admin' && (
                    <>
                      <button 
                        onClick={() => {
                          if (!selectedProject) return;
                          const pendingTasks = selectedProject.tasks.filter(t => t.status !== 'concluido');
                          if (pendingTasks.length === 0) {
                            alert('Não existem tarefas pendentes para pedir feedback.');
                            return;
                          }

                          const pivotsWithPending = pivots.filter(p => pendingTasks.some(t => t.responsible === p.id));
                          const emails = pivotsWithPending.map(p => p.email).join(',');
                          
                          const taskSummary = pendingTasks.map(t => {
                            const pivot = pivots.find(p => p.id === t.responsible);
                            return `- ${t.description} (Pivot: ${pivot?.name || 'N/A'}) [Prazo: ${formatDate(t.deadline)}]`;
                          }).join('\n');

                          const currentSubject = emailTemplate.subject.replace('{projectName}', selectedProject.name);
                          const currentBodyBefore = emailTemplate.bodyBefore.replace('{projectName}', selectedProject.name);
                          const currentBodyAfter = emailTemplate.bodyAfter.replace('{projectName}', selectedProject.name);

                          const subject = encodeURIComponent(currentSubject);
                          const body = encodeURIComponent(`${currentBodyBefore}\n\n${taskSummary}\n\n${currentBodyAfter}`);
                          window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-100 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Relembrar PIVOTs (Email)
                      </button>
                      <button 
                        onClick={() => deleteProject(selectedId!)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {selectedProject && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Project Info */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${getStatusBgColor(calculateStatus(selectedProject))} ${getStatusTextColor(calculateStatus(selectedProject))}`}>
                            PPS {calculateStatus(selectedProject) === 'green' ? 'Controlado' : calculateStatus(selectedProject) === 'yellow' ? 'Em Alerta' : 'Crítico'}
                          </div>
                          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest leading-none flex items-center">
                            {getUrgencyLabel(selectedProject.urgency)}
                          </div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">{selectedProject.name}</h2>
                        <p className="text-slate-600 leading-relaxed">{selectedProject.description}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100 p-2">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Responsável</p>
                          <p className="text-sm font-bold text-slate-800">{selectedProject.owner}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Progresso</p>
                          <p className="text-sm font-bold text-slate-800">{selectedProject.progress}%</p>
                        </div>
                        <div className={`relative ${userRole === 'admin' ? 'cursor-pointer hover:bg-slate-50 rounded p-1 transition-colors' : ''}`} onClick={() => userRole === 'admin' && setIsEditingDates(true)}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Início Planeado</p>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                            {formatDate(selectedProject.plannedStart)}
                            {userRole === 'admin' && <Edit2 className="w-3 h-3 text-emerald-600 opacity-40" />}
                          </p>
                        </div>
                        <div className={`relative ${userRole === 'admin' ? 'cursor-pointer hover:bg-slate-50 rounded p-1 transition-colors' : ''}`} onClick={() => userRole === 'admin' && setIsEditingDates(true)}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Fim Planeado</p>
                          <p className={`text-sm font-bold flex items-center gap-1 ${new Date() > new Date(selectedProject.plannedEnd) && selectedProject.progress < 100 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatDate(selectedProject.plannedEnd)}
                            {userRole === 'admin' && <Edit2 className="w-3 h-3 text-emerald-600 opacity-40" />}
                          </p>
                        </div>
                      </div>

                      {/* Project Image Attachment Section */}
                      <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Estado Atual (Foto PPS Físico)</h4>
                           {userRole === 'admin' && (
                             <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95">
                               {selectedProject.imageUrl ? 'Alterar Foto' : 'Anexar Foto'}
                               <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                             </label>
                           )}
                        </div>
                        
                        {selectedProject.imageUrl ? (
                          <div className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-50">
                            <img 
                              src={selectedProject.imageUrl} 
                              alt="PPS Status" 
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                               <a href={selectedProject.imageUrl} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-xl">Ver Tamanho Inteiro</a>
                            </div>
                          </div>
                        ) : (
                          <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-6">
                            <Calendar className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-[11px] font-medium text-center">Nenhuma foto anexada. Registe o estado do PPS físico para evidência.</p>
                          </div>
                        )}
                      </div>

                      {selectedProject.actualStart && (
                        <div className="bg-slate-50 p-4 rounded-xl flex gap-6">
                           <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Início Real</p>
                            <p className="text-xs font-bold">{formatDate(selectedProject.actualStart)}</p>
                          </div>
                          {selectedProject.actualEnd && (
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fim Real</p>
                               <p className="text-xs font-bold">{formatDate(selectedProject.actualEnd)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Task List */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Plano de Acções</h3>
                        <div className="text-sm text-slate-400 font-bold">{selectedProject.tasks.length} tarefas</div>
                      </div>

                      <div className="space-y-4">
                        {selectedProject.tasks.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                             <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                             <p className="text-slate-400 font-medium tracking-tight">Sem tarefas definidas. Adicione a primeira acção.</p>
                          </div>
                        ) : (
                          selectedProject.tasks.map(task => (
                            <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 transition-all group">
                              <button 
                                onClick={() => updateTaskStatus(task.id, task.status === 'concluido' ? 'em-curso' : 'concluido')}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border-2 ${task.status === 'concluido' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-emerald-500 text-transparent'}`}
                              >
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                              </button>
                              <div className="flex-1">
                                <h4 className={`text-sm font-bold transition-all uppercase tracking-tight ${task.status === 'concluido' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  {task.description}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 opacity-70 italic">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {pivots.find(p => p.id === task.responsible)?.name || 'N/A'}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(task.deadline)}</span>
                                </div>
                              </div>
                              <select 
                                value={task.status}
                                onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                                className="text-[10px] font-black uppercase tracking-widest outline-none bg-slate-50 border-none p-1 rounded font-bold cursor-pointer transition-colors hover:bg-slate-100"
                              >
                                <option value="por-fazer">Por fazer</option>
                                <option value="em-curso">Em curso</option>
                                <option value="concluido">Concluído</option>
                              </select>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar - Add Task */}
                  <div className="space-y-6">
                    {userRole === 'admin' ? (
                      <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-xl shadow-emerald-200/50 sticky top-28">
                        <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Nova Acção</h3>
                        <form onSubmit={handleAddTask} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Descrição da Tarefa</label>
                            <textarea 
                              name="description" 
                              required 
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-white/30 min-h-[100px]"
                              placeholder="Ex: Definir novo Standard..."
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Responsável (Pivot)</label>
                            <select 
                              name="responsible" 
                              required 
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 [color-scheme:dark] text-white"
                            >
                              <option value="" className="text-slate-900">Seleccionar Pivot...</option>
                              {pivots.map(p => (
                                <option key={p.id} value={p.id} className="text-slate-900">{p.name} ({p.department})</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Prazo</label>
                            <input 
                              name="deadline" 
                              type="date" 
                              required 
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 [color-scheme:dark]"
                            />
                          </div>
                          <button 
                            type="submit" 
                            className="w-full bg-white text-emerald-900 font-bold py-4 rounded-xl hover:bg-emerald-50 transition-colors uppercase tracking-widest mt-4 shadow-lg active:scale-[0.98]"
                          >
                            Adicionar Acção
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm sticky top-28 border-dashed flex flex-col items-center text-center">
                        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-6 h-6 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Modo Convidado</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Apenas Administradores podem adicionar novas acções ao projecto.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAddingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProject(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <h2 className="text-2xl font-black mb-6 uppercase tracking-tight text-slate-800">Novo Projecto PPS</h2>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Projecto</label>
                  <input 
                    name="name" 
                    required 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="Ex: Otimização Posto X"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição/Objectivo</label>
                  <textarea 
                    name="description" 
                    required 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Owner</label>
                  <input 
                    name="owner" 
                    required 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nível de Urgência</label>
                  <select 
                    name="urgency" 
                    required 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="1">1 - Visual</option>
                    <option value="2">2 - Funcional</option>
                    <option value="3">3 - Imobiliza Veículo</option>
                    <option value="4">4 - Segurança</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Início Planeado</label>
                    <input 
                      name="start" 
                      type="date" 
                      required 
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fim Planeado</label>
                    <input 
                      name="end" 
                      type="date" 
                      required 
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingProject(false)}
                    className="flex-1 px-4 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest text-sm"
                  >
                    Criar Projecto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Project Dates Modal */}
      <AnimatePresence>
        {isEditingDates && selectedProject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingDates(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <h2 className="text-xl font-black mb-6 uppercase tracking-tight text-slate-800">Alterar Prazos do PPS</h2>
              <form onSubmit={handleUpdateDates} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Início Planeado</label>
                    <input 
                      name="start" 
                      type="date" 
                      required 
                      defaultValue={selectedProject.plannedStart}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fim Planeado</label>
                    <input 
                      name="end" 
                      type="date" 
                      required 
                      defaultValue={selectedProject.plannedEnd}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingDates(false)}
                    className="flex-1 px-4 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest text-sm"
                  >
                    Guardar Datas
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 p-2 rounded-xl text-white">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Definições do Sistema</h2>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 h-full">
                {/* Supabase Diagnostic Panel */}
                <section className="mb-12">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Estado do Sistema & Base de Dados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-medium tracking-tight">VITE_SUPABASE_URL</span>
                          <span className={(import.meta as any).env.VITE_SUPABASE_URL ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                            {(import.meta as any).env.VITE_SUPABASE_URL ? "✓ DETETADA" : "✗ AUSENTE"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-medium tracking-tight">VITE_SUPABASE_ANON_KEY</span>
                          <span className={(import.meta as any).env.VITE_SUPABASE_ANON_KEY ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                            {(import.meta as any).env.VITE_SUPABASE_ANON_KEY ? "✓ DETETADA" : "✗ AUSENTE"}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-medium tracking-tight">Ligação Real</span>
                          <span className={supabaseConnected ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>
                            {supabaseConnected ? "ESTABELECIDA ✓" : "MODO LOCAL (OFFLINE) ⚠"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900 rounded-2xl p-6 text-[10px] font-mono text-emerald-400 shadow-inner overflow-hidden">
                      <p className="text-slate-500 mb-2 border-b border-slate-800 pb-1 uppercase italic tracking-widest">Logs de Operação:</p>
                      <div className="space-y-1 h-[60px] overflow-y-auto">
                        {debugLog.length > 0 ? (
                          debugLog.map((log, i) => <div key={i} className="py-0.5">&gt; {log}</div>)
                        ) : (
                          <div className="text-slate-700 italic">Aguardando operações...</div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!supabaseConnected && (import.meta as any).env.VITE_SUPABASE_URL && (
                    <p className="mt-3 text-[10px] text-amber-600 font-medium leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <strong>Nota:</strong> As variáveis foram detetadas mas a ligação falhou. Verifique se as tabelas foram criadas no Supabase usando o script SQL fornecido e se as políticas RLS permitem inserções.
                    </p>
                  )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Pivot Management */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        Gestão de PIVOTs
                      </h3>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Adicionar Novo Pivot</h4>
                      {userRole === 'admin' ? (
                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const newPivot: Pivot = {
                              id: hasSupabaseConfig ? undefined : `piv-${Date.now()}`,
                              name: formData.get('name') as string,
                              email: formData.get('email') as string,
                              department: formData.get('department') as string,
                            } as any;

                            if (hasSupabaseConfig) {
                              const { data, error } = await supabase.from('pivots').insert({
                                name: newPivot.name,
                                email: newPivot.email,
                                department: newPivot.department
                              }).select().single();
                              if (data) {
                                newPivot.id = data.id;
                                setPivots([...pivots, newPivot]);
                              }
                            } else {
                              (newPivot as any).id = `piv-${Date.now()}`;
                              setPivots([...pivots, newPivot]);
                            }
                            e.currentTarget.reset();
                          }}
                          className="grid grid-cols-1 gap-3"
                        >
                          <input name="name" required placeholder="Nome Completo" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <input name="email" type="email" required placeholder="Email" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <input name="department" required placeholder="Área / Departamento" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <button type="submit" className="bg-emerald-600 text-white font-bold py-2 rounded-xl hover:bg-emerald-700 transition-colors uppercase tracking-widest text-xs mt-2">
                            Guardar Pivot
                          </button>
                        </form>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Gestão restrita a Administradores.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pivots Registados ({pivots.length})</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {pivots.map(pivot => (
                          <div key={pivot.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:border-emerald-200 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">{pivot.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{pivot.email} &bull; {pivot.department}</p>
                            </div>
                            {userRole === 'admin' && (
                              <button 
                                onClick={async () => {
                                  if (hasSupabaseConfig) {
                                    await supabase.from('pivots').delete().eq('id', pivot.id);
                                  }
                                  setPivots(pivots.filter(p => p.id !== pivot.id));
                                }}
                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Segurança & Acesso
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Password do Administrador</label>
                          <div className="flex gap-2">
                            <input 
                              type="password"
                              defaultValue={ADMIN_CREDENTIALS.password}
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              onBlur={(e) => {
                                if (e.target.value.trim()) {
                                  ADMIN_CREDENTIALS.password = e.target.value.trim();
                                  localStorage.setItem('pps_admin_password', e.target.value.trim());
                                  addLog("Password de Admin atualizada no browser.");
                                }
                              }}
                            />
                            <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-bold flex items-center">
                              BROWSER ONLY
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-relaxed italic">
                            Nota: Esta alteração é persistida apenas neste browser (local). Para alterar permanentemente em todos os dispositivos, o código fonte deve ser atualizado no GitHub.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Template Management */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-emerald-600" />
                      Template de Email
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assunto do Email</label>
                        <input 
                          value={emailTemplate.subject}
                          disabled={userRole !== 'admin'}
                          onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensagem (Início)</label>
                        <textarea 
                          value={emailTemplate.bodyBefore}
                          disabled={userRole !== 'admin'}
                          onChange={(e) => setEmailTemplate({ ...emailTemplate, bodyBefore: e.target.value })}
                          rows={4}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-sans disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Visualização das Tarefas</p>
                        <div className="space-y-1 opacity-40 select-none">
                          <p className="text-[10px] font-mono">- Acção 1 (Pivot: Ana) [Prazo: 20/04]</p>
                          <p className="text-[10px] font-mono">- Acção 2 (Pivot: João) [Prazo: 25/04]</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensagem (Fim)</label>
                        <textarea 
                          value={emailTemplate.bodyAfter}
                          disabled={userRole !== 'admin'}
                          onChange={(e) => setEmailTemplate({ ...emailTemplate, bodyAfter: e.target.value })}
                          rows={3}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-sans disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Dica de Variáveis</p>
                          <p className="text-[10px] text-blue-500 leading-tight">Use <code className="bg-blue-100 px-1 rounded">{"{projectName}"}</code> para inserir o nome do projecto automaticamente.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Meta */}
      <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 mt-12 border-t border-slate-100">
        <p className="text-[10px] font-black uppercase tracking-widest">&copy; 2026 PPS Control System &bull; Continuous Improvement</p>
        <div className="flex gap-6">
          <button className="text-[10px] font-black uppercase tracking-widest hover:text-emerald-600 transition-colors">Suporte</button>
          <button className="text-[10px] font-black uppercase tracking-widest hover:text-emerald-600 transition-colors">Exportar Dados</button>
        </div>
      </footer>
    </div>
  );
}

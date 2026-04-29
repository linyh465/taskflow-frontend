import { create } from 'zustand';
import { Task, Status } from '@/types';

interface TaskStore {
  tasks: Task[];
  viewMode: 'list' | 'kanban';
  filterStatus: Status | 'ALL';
  isModalOpen: boolean;
  editingTask: Task | null;

  setTasks: (tasks: Task[]) => void;
  setViewMode: (mode: 'list' | 'kanban') => void;
  setFilterStatus: (status: Status | 'ALL') => void;
  openModal: (task?: Task) => void;
  closeModal: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  viewMode: 'kanban',
  filterStatus: 'ALL',
  isModalOpen: false,
  editingTask: null,

  setTasks: (tasks) => set({ tasks }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  openModal: (task) => set({ isModalOpen: true, editingTask: task || null }),
  closeModal: () => set({ isModalOpen: false, editingTask: null }),
}));

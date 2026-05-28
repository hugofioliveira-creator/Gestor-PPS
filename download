/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectStatus = 'green' | 'yellow' | 'red';
export type TaskStatus = 'por-fazer' | 'em-curso' | 'concluido';

export interface Task {
  id: string;
  description: string;
  responsible: string; // This will now store the Pivot ID
  deadline: string; // ISO format
  status: TaskStatus;
}

export interface Pivot {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface EmailTemplate {
  subject: string;
  bodyBefore: string;
  bodyAfter: string;
}

export type UrgencyLevel = 1 | 2 | 3 | 4;

export interface PPSProject {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  urgency: UrgencyLevel;
  progress: number;
  plannedStart: string; // ISO format
  plannedEnd: string;   // ISO format
  actualStart?: string; // ISO format
  actualEnd?: string;   // ISO format
  imageUrl?: string;
  isCompleted?: boolean;
  tasks: Task[];
}

// ================================
// Outgoing requests Shapes
// ================================

export interface RegisterUser {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}

export interface LoginUser {
    email: string;
    password: string;
}

export interface CreateTask {
    title: string;
    description?: string;
    frequency?: 'once' | 'daily' | 'saturday' | 'sunday' | 'weekends' | 'monthly' | null;
    priority: boolean;
    duration?: number;
    due_date: string;
}

export interface UpdateTask {
    title?: string;
    description?: string | null;
    frequency?: 'once' | 'daily' | 'saturday' | 'sunday' | 'weekends' | 'monthly' | null;
    priority?: boolean;
    duration?: number | null;
    due_date?: string;
}
export interface GetTaskFilter {
    status?: boolean;
    due_date?: string;
    priority?: boolean;
}

// ================================
// Incoming Responses Shapes
// ================================

export interface UserResponse {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface TaskResponse {
    id: number;
    user_id: number;
    title: string;
    description: string | null;
    frequency: 'once' | 'daily' | 'saturday' | 'sunday' | 'weekends' | 'monthly' | null;
    priority: boolean;
    duration: number | null;
    created_at: string;
    due_date: string;
    is_completed: boolean;
    is_locked: boolean;
}

export interface DailyBreakDownWithTasks {
    date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    total_duration: number;
    completed: TaskResponse[]
    incomplete: TaskResponse[]
}

export interface WeeklySummary {
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    total_duration_hours: number;
    average_tasks_per_day: number;
    average_duration_per_day: number;
    days_with_tasks: number;
}

export interface WeeklyProductivityResponse {
    start_date: string;
    end_date: string;
    summary: WeeklySummary
    most_productive_day: DailyBreakdown | null
    daily_breakdown: DailyBreakDownWithTasks[] 
}


export interface DailyProductivityResponse {
    date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    high_priority_tasks: number;
    low_priority_tasks: number;
    high_priority_completed: number;
    low_priority_completed: number;
    high_priority_completion_percentage: number;
    low_priority_completion_percentage: number;
    total_hours: number;
    high_priority_hours: number;
    low_priority_hours: number;
}

export interface DailyBreakdown {
    date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    total_duration: number;
}

export interface MonthlySummary {
    month: number;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    total_duration_hours: number;
    average_tasks_per_day: number;
    average_duration_per_day: number;
    days_with_tasks: number;
}

export interface MonthlyProductivity {
    year: number;
    month: number;
    summary: MonthlySummary;
    most_productive_day: DailyBreakdown | null;
    daily_breakdown: DailyBreakdown[];
}

export interface YearlyProductivity {
    year: number;
    summary: {
        total_tasks: number;
        completed_tasks: number;
        completion_percentage: number;
    };
    daily_breakdown: DailyBreakdown[];
    best_day: DailyBreakdown | null;
    best_month: MonthlySummary | null;
    months: MonthlySummary[];
}

export interface User { 
    id: string; 
    first_name: string; 
    last_name: string; 
    email: string; 
    createdAt: string;
}

export interface AuthContextType { 
    user: User | null;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}
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
    duration?: number;
    due_date: string;
    arena_id: number;
}

export interface UpdateTask {
    title?: string;
    description?: string | null;
    frequency?: 'once' | 'daily' | 'saturday' | 'sunday' | 'weekends' | 'monthly' | null;
    duration?: number | null;
    due_date?: string;
    arena_id?: number;
}
export interface GetTaskFilter {
    status?: boolean;
    due_date?: string;
}

// NEW: Arena interface
export interface ArenaCreate {
    name: string;
    color: string;
}

export interface ArenaUpdate {
    name?: string;
    color?: string;
}

export interface ArenaColorUpdate {
    color: string;
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
    duration: number | null;
    created_at: string;
    due_date: string;
    is_completed: boolean;
    is_locked: boolean;
    group_id: string | null;
    arena: ArenaResponse;
}

export interface DailyBreakDownWithTasks {
    date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    total_duration: number;
    completed: TaskResponse[]
    incomplete: TaskResponse[]
    arenas: ArenaBreakdown[]
}

export interface WeeklySummary {
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    total_duration_hours: number;
    average_tasks_per_day: number;
    average_duration_per_day: number;
    days_with_tasks: number;
    arenas: ArenaBreakdown[];
}

export interface WeeklyProductivityResponse {
    start_date: string;
    end_date: string;
    summary: WeeklySummary
    most_productive_day: DailyProductivityResponse | null
    daily_breakdown: DailyBreakDownWithTasks[] 
}


export interface DailyProductivityResponse {
    date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    total_hours: number;
    arenas: ArenaBreakdown[]
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
    arenas: ArenaBreakdown[]
}

export interface MonthlyProductivity {
    year: number;
    month: number;
    summary: MonthlySummary;
    most_productive_day: DailyProductivityResponse | null;
    daily_breakdown: DailyProductivityResponse[];
}

export interface YearlyProductivity {
    year: number;
    summary: {
        total_tasks: number;
        completed_tasks: number;
        completion_percentage: number;
        arenas: ArenaBreakdown[]
    };
    daily_breakdown: DailyProductivityResponse[];
    best_day: DailyProductivityResponse | null;
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

export interface UserUpdate {
    first_name?: string;
    last_name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}


export interface ArenaResponse {
    id: number;
    name: string;
    color: string;
    is_archived: boolean;
    created_at: string;
}

export interface ArenaBreakdown {
    arena_id: number;
    arena_name: string;
    arena_color: string;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    total_hours: number;
}

export interface ArenaStreak {
    arena_id: number;
    arena_name: string;
    arena_color: string;
    current_streak: number;
    longest_streak: number;
}

export interface StreakResponse {
    current_streak: number;
    longest_streak: number;
    arenas: ArenaStreak[];
}
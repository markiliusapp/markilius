const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
import type { RegisterUser, LoginUser, CreateTask, UpdateTask, GetTaskFilter, ArenaResponse, ArenaCreate, ArenaUpdate, ArenaColorUpdate } from "@/types";

// Helper to get token from localStorage
const getToken = (): string | null => {
    return localStorage.getItem("token")
}

// Helper to handle API responses
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        if (response.status === 401 && getToken()) {
            window.dispatchEvent(new CustomEvent('session-expired'));
        }
        if (response.status === 429) {
            throw new Error('Rate limit exceeded')
        }
        let errorMessage = "An error occurred"
        try {
            const errorData = await response.json()
            if (Array.isArray(errorData.detail)) {
                errorMessage = errorData.detail.map((e: { msg: string; loc: string[] }) => `${e.loc.slice(1).join('.')}: ${e.msg}`).join(', ')
            } else {
                errorMessage = errorData.detail || errorMessage
            }
        } catch {
            errorMessage = response.statusText || `Error ${response.status}`;
        }
        throw new Error(errorMessage)
    }
    return response.json()
}

// Auth endpoints

export const authAPI = {
    register: async (userDate: RegisterUser)=> {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(userDate)
        })

        return handleResponse(response)
    },
    login: async (credentials: LoginUser) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(credentials)
        })

        return handleResponse(response)
    },
    getMe: async () => {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        })
        
        return handleResponse(response)
    },
    googleLogin: async (token: { access_token: string }) => {
        const response = await fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(token)
        })

        return handleResponse(response)
    },
    forgotPassword: async (email: string) => {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return handleResponse(response);
    },

    resetPassword: async (token: string, new_password: string) => {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password }),
        });
        return handleResponse(response);
    },
    verifyEmail: async (token: string) => {
        const response = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
            method: 'POST',
        });
        return handleResponse(response);
    },
    resendVerification: async (email: string) => {
        const response = await fetch(`${API_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return handleResponse(response);
    },
    updateMe: async (data: { first_name?: string; last_name?: string; email?: string; current_password?: string; new_password?: string; weekly_email?: boolean; monthly_email?: boolean; timezone?: string }) => {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    deleteMe: async () => {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (!response.ok) return handleResponse(response);
    },
}


// Task endpoints
export const taskAPI = {
    getAll: async (filters?: GetTaskFilter) => {
        const params = new URLSearchParams();
        if (filters?.status !== undefined) params.append("status", filters.status.toString())
        if (filters?.due_date) params.append("due_date", filters.due_date)

        const url = `${API_URL}/tasks/?${params.toString()}`
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        })

        return handleResponse(response)
    },
    create: async (taskDate: CreateTask) => {
        const response = await fetch(`${API_URL}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify(taskDate)
        })
        return handleResponse(response)
    },
    update: async (taskId: number, taskData: UpdateTask) => {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify(taskData),
        });
        return handleResponse(response);
    },
    toggleComplete: async (taskId: number) => {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "PATCH",
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        })
        return handleResponse(response)
    },
    delete: async (taskId: number) => {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        if (response.status === 204) return; // No content
        return handleResponse(response);
    },
    deleteSeries: async (taskId: number): Promise<void> => {
        const response = await fetch(`${API_URL}/tasks/${taskId}/series`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        if (response.status === 204) return;
        return handleResponse(response);
    },
}

// Productivity endpoints
export const productivityAPI = {
    getDaily: async (targetDate: string) => {
        const response = await fetch(
            `${API_URL}/productivity/day?target_date=${targetDate}`,
            {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                },
            }
        );
        return handleResponse(response);
    },

    getWeekly: async (startDate: string) => {
        const response = await fetch(
            `${API_URL}/productivity/week?start_date=${startDate}`,
            {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                },
            }
        );
        return handleResponse(response);
    },

    getMonthly: async (year: number, month: number) => {
        const response = await fetch(
            `${API_URL}/productivity/month?year=${year}&month=${month}`,
            {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                },
            }
        );
        return handleResponse(response);
    },
    getYearly: async (year: number) => {
        const response = await fetch(`${API_URL}/productivity/year?year=${year}`, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        })
        return handleResponse(response)
    },
    getStreaks: async () => {
        const response = await fetch(`${API_URL}/productivity/streaks`, {
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        return handleResponse(response);
    },
};

export const arenaAPI = {
    getAll: async (): Promise<ArenaResponse[]> => {
        const response = await fetch(`${API_URL}/arenas/`, {
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        return handleResponse(response);
    },
    getArchived: async (): Promise<ArenaResponse[]> => {
        const response = await fetch(`${API_URL}/arenas/archived`, {
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        return handleResponse(response);
    },
    create: async (arena: ArenaCreate): Promise<ArenaResponse> => {
        const response = await fetch(`${API_URL}/arenas/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify(arena),
        });
        return handleResponse(response);
    },
    update: async (arenaId: number, arena: ArenaUpdate): Promise<ArenaResponse> => {
        const response = await fetch(`${API_URL}/arenas/${arenaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify(arena),
        });
        return handleResponse(response);
    },
    updateColor: async (arenaId: number, body: ArenaColorUpdate): Promise<ArenaResponse> => {
        const response = await fetch(`${API_URL}/arenas/${arenaId}/color`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    },
    archive: async (arenaId: number): Promise<void> => {
        const response = await fetch(`${API_URL}/arenas/${arenaId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (response.status === 204) return;
        return handleResponse(response);
    },
    restore: async (arenaId: number): Promise<ArenaResponse> => {
        const response = await fetch(`${API_URL}/arenas/${arenaId}/restore`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        return handleResponse(response);
    },
};

export const paymentAPI = {
    createCheckoutSession: async (plan: 'monthly' | 'yearly' | 'lifetime'): Promise<{ url: string }> => {
        const response = await fetch(`${API_URL}/payments/checkout?plan=${plan}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        return handleResponse(response);
    },
    upgradeToLifetime: async (): Promise<{ url: string }> => {
        const response = await fetch(`${API_URL}/payments/upgrade-to-lifetime`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        return handleResponse(response);
    },
    verifySession: async (sessionId: string): Promise<{ status: string }> => {
        const response = await fetch(`${API_URL}/payments/verify-session?session_id=${encodeURIComponent(sessionId)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        return handleResponse(response);
    },
    createPortalSession: async (): Promise<{ url: string }> => {
        const response = await fetch(`${API_URL}/payments/portal`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        return handleResponse(response);
    },
};

export const publicAPI = {
    getProfile: async (publicId: string) => {
        const response = await fetch(`${API_URL}/public/${publicId}`);
        return handleResponse(response);
    },
    getYearlyProductivity: async (publicId: string, year: number) => {
        const response = await fetch(`${API_URL}/public/${publicId}/productivity/year?year=${year}`);
        return handleResponse(response);
    },
    getMonthlyProductivity: async (publicId: string, year: number, month: number) => {
        const response = await fetch(`${API_URL}/public/${publicId}/productivity/month?year=${year}&month=${month}`);
        return handleResponse(response);
    },
};
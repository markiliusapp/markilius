const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
import type { RegisterRequest, LoginRequest, CreateTaskRequest, UpdateTaskRequest, GetTaskFilter } from "@/types";

// Helper to get token from localStorage
const getToken = (): string | null => {
    return localStorage.getItem("token")
}

// Helper to handle API responses
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch( () => ({ detail: "An error occurred"}))
        throw new Error(error.detail || "Request failed")
    }
    return response.json()
}

// Auth endpoints

export const authAPI = {
    register: async (userDate: RegisterRequest)=> {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(userDate)
        })

        return handleResponse(response)
    },
    login: async (credentials: LoginRequest) => {
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
    }
} 

// Task endpoints
export const taskAPI = {
    getAll: async(filters?: GetTaskFilter) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append("status", filters.status.toString())
        if (filters?.due_date) params.append("due_date", filters.due_date)
        if (filters?.priority) params.append("priority", filters.priority.toString())

        const url = `${API_URL}/tasks/?${params.toString()}`
        const response = await fetch(url, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        })

        return handleResponse(response)
    },
    create: async(taskDate: CreateTaskRequest) => {
        const response = await fetch(`${API_URL}/tasks/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken}`
            },
            body: JSON.stringify(taskDate)
        })
        return handleResponse(response)
    },
    update: async(taskId: number, taskData: UpdateTaskRequest) => {
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
    toggleComplete: async(taskId: number) => {
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
    }
};
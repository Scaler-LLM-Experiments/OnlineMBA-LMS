import { Session, SessionFilters, Note, NoteInput, Student, ApiResponse, SSBCalendarEvent } from '../../types';

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL || '';

class ApiService {
  private async request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      // Use text/plain to avoid CORS preflight (Google Apps Script doesn't handle OPTIONS)
      const headers: HeadersInit = {};
      if (options?.method === 'POST') {
        headers['Content-Type'] = 'text/plain';
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options?.headers,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==================== SESSIONS ====================

  async getSessions(filters?: SessionFilters): Promise<ApiResponse<{ sessions: Session[]; count: number }>> {
    const params = new URLSearchParams({ action: 'getSessions' });

    if (filters?.type) params.append('type', filters.type);
    if (filters?.batch) params.append('batch', filters.batch);
    if (filters?.domain) params.append('domain', filters.domain);
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.term) params.append('term', filters.term);

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  async getSession(sessionId: string): Promise<ApiResponse<{ session: Session }>> {
    const params = new URLSearchParams({
      action: 'getSession',
      sessionId,
    });

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  async getLiveSessions(batch?: string): Promise<ApiResponse<{ sessions: Session[]; count: number }>> {
    const params = new URLSearchParams({ action: 'getLiveSessions' });
    if (batch) params.append('batch', batch);

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  async getRecordings(filters?: Omit<SessionFilters, 'type'>): Promise<ApiResponse<{ sessions: Session[]; count: number }>> {
    const params = new URLSearchParams({ action: 'getRecordings' });

    if (filters?.batch) params.append('batch', filters.batch);
    if (filters?.domain) params.append('domain', filters.domain);
    if (filters?.subject) params.append('subject', filters.subject);

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  async getCalendarEvents(batch?: string): Promise<ApiResponse<{ events: SSBCalendarEvent[]; count: number }>> {
    const params = new URLSearchParams({ action: 'getCalendarEvents' });
    if (batch) params.append('batch', batch);

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  // ==================== NOTES ====================

  async getNotes(studentId: string, sessionId?: string): Promise<ApiResponse<{ notes: Note[] }>> {
    const params = new URLSearchParams({
      action: 'getAllNotes',
      studentEmail: studentId,
      studentId: studentId,
    });

    if (sessionId) params.append('sessionId', sessionId);

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  async getNote(studentId: string, sessionId: string): Promise<ApiResponse<{ note: Note | null }>> {
    const params = new URLSearchParams({
      action: 'getNote',
      studentId,
      sessionId,
    });

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  async saveNote(noteData: NoteInput): Promise<ApiResponse<{ noteId: string; action: 'created' | 'updated' }>> {
    return this.request(`${API_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveNote',
        ...noteData,
      }),
    });
  }

  async deleteNote(noteId: string, studentId: string): Promise<ApiResponse<null>> {
    return this.request(`${API_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'deleteNote',
        noteId,
        studentId,
      }),
    });
  }

  async togglePinNote(noteId: string, studentId: string): Promise<ApiResponse<{ isPinned: boolean }>> {
    return this.request(`${API_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'togglePinNote',
        noteId,
        studentId,
      }),
    });
  }

  async getNotesHierarchy(studentId: string): Promise<ApiResponse<{ hierarchy: any }>> {
    const params = new URLSearchParams({
      action: 'getNotesHierarchy',
      studentId,
    });

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  async searchNotes(studentId: string, query: string): Promise<ApiResponse<{ notes: Note[] }>> {
    const params = new URLSearchParams({
      action: 'searchNotes',
      studentId,
      query,
    });

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  // ==================== STUDENTS ====================

  async getStudent(email: string): Promise<ApiResponse<{ student: Student }>> {
    const params = new URLSearchParams({
      action: 'getStudent',
      email,
    });

    return this.request(`${API_BASE_URL}?${params.toString()}`);
  }

  async updateStudentLogin(email: string): Promise<ApiResponse<null>> {
    return this.request(`${API_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateStudent',
        email,
      }),
    });
  }

  // ==================== SYNC ====================

  async triggerSync(): Promise<ApiResponse<any>> {
    return this.request(`${API_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'triggerSync',
      }),
    });
  }
}

export const api = new ApiService();

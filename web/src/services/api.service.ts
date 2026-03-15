import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

const API_URL = `${location.protocol}//${location.hostname}:${environment.serverPort}/api`;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  private async request<T>(method: HttpMethod, path: string, params?: Record<string, string>, body?: any): Promise<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const val = params![key];
        if (val !== undefined && val !== null) {
          httpParams = httpParams.append(key, val.toString());
        }
      });
    }

    try {
      return await firstValueFrom(
        this.http.request<T>(method, `${API_URL}${path}`, { body: body, params: httpParams }),
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    let errorMessage = 'Something went wrong';

    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        errorMessage = error.error?.error || `Server error: ${error.status}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`[API ${errorMessage}]`);
    return new Error(errorMessage);
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, params);
  }

  async post<T, D = any>(path: string, data: D): Promise<T> {
    return this.request<T>('POST', path, {}, data);
  }

  async put<T, D = any>(path: string, data: D): Promise<T> {
    return this.request<T>('PUT', path, {}, data);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

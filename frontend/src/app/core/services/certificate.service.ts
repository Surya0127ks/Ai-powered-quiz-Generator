import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Certificate, VerifyCertificateResult } from '../models/certificate.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  readonly myCertificates = signal<Certificate[]>([]);

  generateCertificate(courseId: string): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.baseUrl}/courses/${courseId}/certificate/generate`, {});
  }

  getMyCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.baseUrl}/certificates/my-certificates`).pipe(
      tap(certs => this.myCertificates.set(certs))
    );
  }

  verifyCertificate(code: string): Observable<VerifyCertificateResult> {
    return this.http.get<VerifyCertificateResult>(`${this.baseUrl}/certificates/verify/${code}`);
  }
}

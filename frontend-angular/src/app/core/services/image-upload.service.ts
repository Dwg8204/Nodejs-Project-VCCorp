import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from './api-client.service';

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly api = inject(ApiClientService);

  upload(file: File): Observable<UploadedImage> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api
      .post<{ image: UploadedImage }>('/uploads/images', formData)
      .pipe(map((response) => response.data.image));
  }
}

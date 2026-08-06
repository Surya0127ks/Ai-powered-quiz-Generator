export enum VideoProvider {
  Cloudinary = 1,
  DirectUrl = 2,
  HLS = 3
}

export interface VideoMetadata {
  id: string;
  lessonId: string;
  provider: VideoProvider;
  publicId?: string;
  videoUrl: string;
  playbackUrl: string;
  durationSeconds: number;
  resolution?: string;
  sizeBytes?: number;
}

export interface UserVideoProgress {
  lessonId: string;
  lastWatchedPositionSeconds: number;
  totalDurationSeconds: number;
  isCompleted: boolean;
  progressPercentage: number;
  lastWatchedAtUtc: string;
}

export interface UpdateVideoProgressRequest {
  positionSeconds: number;
  totalDurationSeconds: number;
}

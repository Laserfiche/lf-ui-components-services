export interface NotificationService {
    warn(message: string): void;
    success(message: string): void;
    error(message: string): void;
    clear(message: string): void;
}
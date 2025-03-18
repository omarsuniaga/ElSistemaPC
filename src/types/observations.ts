// Types for managing observations in a Music Academy context

export interface Observation {
    id: string;
    studentId: string;
    teacherId: string;
    date: Date;
    content: string;
    category: ObservationType;
    status: ObservationStatus;
    createdAt: Date;
    updatedAt?: Date;
}

export enum ObservationType {
    PERFORMANCE = 'PERFORMANCE',
    ATTENDANCE = 'ATTENDANCE',
    BEHAVIOR = 'BEHAVIOR',
    PROGRESS = 'PROGRESS',
    TECHNIQUE = 'TECHNIQUE',
    OTHER = 'OTHER'
}

export enum ObservationStatus {
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
    RESOLVED = 'RESOLVED'
}

export interface ObservationCreateInput {
    studentId: string;
    content: string;
    category: ObservationType;
}

export interface ObservationUpdateInput {
    id: string;
    content?: string;
    category?: ObservationType;
    status?: ObservationStatus;
}
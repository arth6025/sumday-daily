export type Category = 'Travel' | 'Sports' | 'Fitness' | 'Lifestyle';

export interface Media {
  kind: 'video' | 'photo';
  src: string;
  poster?: string;
  shape?: '4:5' | '9:16';
  credit: string;
  licence: string;
  source: string;
  note?: string;
}

export interface Experience {
  id: string;
  name: string;
  place: string;
  country: string;
  categories: Category[];
  activities: string[];
  bestMonths: string;
  /** Expected month of the experience, YYYY-MM. */
  expectedMonth: string;
  nights: number;
  /** All-in cost for one person, INR. */
  cost: number;
  costSplit: { flights: number; stay: number; experience: number; food: number };
  hooks: string[];
  tips: string[];
  editorNote: string;
  media: Media[];
}

export interface Friend {
  id: string;
  name: string;
  colour: string;
  free: string;
}

/** Everything a member can do to a card. Each one is a training signal. */
export type Action = 'view' | 'dwell' | 'skip' | 'open' | 'heart' | 'unheart' | 'jam' | 'share' | 'not_interested';

export interface FeedEvent {
  memberId: string;
  experienceId: string;
  action: Action;
  at: number;
}

export type JamStatus = 'tagged' | 'in' | 'maybe';

export interface Note {
  who: string;
  text: string;
  at: number;
}

export interface Someday {
  /** Months moved from the expected month (can be negative). */
  shift: number;
  paused: boolean;
  pinnedAt?: string;
}

export interface MemberState {
  id: string;
  name: string;
  city: string;
  /** Monthly amount the member is comfortable pouring, INR. */
  comfort: number;
  /** Interests picked at onboarding, used before there are events. */
  onboarding: string[];
  hearts: string[];
  jams: Record<string, Record<string, JamStatus>>;
  notes: Record<string, Note[]>;
  somedays: Record<string, Someday>;
  mandate: { active: boolean; since?: string };
  events: FeedEvent[];
}

export type Format = 'auto' | 'tap' | 'carousel' | 'post' | 'reel';

export interface Filters {
  category?: string;
  country?: string;
  activity?: string;
  q?: string;
  newToMe?: boolean;
}

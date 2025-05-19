export interface Airfoil {
  id: string;
  name: string;
  description?: string;
  coordinates: [number, number][];
  camber?: number;
  thickness?: number;
  reynoldsRange?: string;
  maxLiftDragRatio?: number;
  stallAngle?: number;
  momentCoefficient?: number;
  applications?: string[];
}

export interface FilterState {
  search: string;
  camber: string[];
  thickness: string[];
  applications: string[];
  sortBy: string;
  view: 'grid' | 'list';
}

export interface ComparisonState {
  items: Airfoil[];
  isOpen: boolean;
} 
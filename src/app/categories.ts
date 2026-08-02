import { RentalCategory } from './models';

export interface CategoryOption {
  value: RentalCategory;
  label: string;
  icon: string;
}

export interface CategoryGroup {
  label: string;
  options: CategoryOption[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: 'Vehicles',
    options: [
      { value: 'BIKE', label: 'Bikes', icon: '🏍️' },
      { value: 'SCOOTER', label: 'Scooters', icon: '🛵' },
      { value: 'CAR', label: 'Cars', icon: '🚗' },
      { value: 'AUTO_RICKSHAW', label: 'Auto rickshaws', icon: '🛺' },
      { value: 'TRUCK', label: 'Trucks & tempos', icon: '🚚' }
    ]
  },
  {
    label: 'Machinery & equipment',
    options: [
      { value: 'TRACTOR', label: 'Tractors', icon: '🚜' },
      { value: 'HEAVY_VEHICLE', label: 'Heavy vehicles (JCB, crane)', icon: '🏗️' },
      { value: 'FARM_EQUIPMENT', label: 'Farm equipment', icon: '🌾' },
      { value: 'CONSTRUCTION_EQUIPMENT', label: 'Construction equipment', icon: '🧱' },
      { value: 'POWER_TOOLS', label: 'Power tools', icon: '🔧' }
    ]
  },
  {
    label: 'Home & events',
    options: [
      { value: 'PROPERTY', label: 'Properties', icon: '🏠' },
      { value: 'EVENT_EQUIPMENT', label: 'Event equipment (tents, sound)', icon: '🎪' },
      { value: 'FURNITURE', label: 'Furniture & appliances', icon: '🛋️' },
      { value: 'ELECTRONICS', label: 'Electronics', icon: '📷' },
      { value: 'OTHER', label: 'Anything else', icon: '📦' }
    ]
  }
];

export const CATEGORY_OPTIONS: CategoryOption[] = CATEGORY_GROUPS.flatMap((group) => group.options);

const LABELS = new Map(CATEGORY_OPTIONS.map((option) => [option.value, option.label]));

export function categoryLabel(category: RentalCategory): string {
  return LABELS.get(category) ?? category;
}

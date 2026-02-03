/**
 * Property Type System for HoyConnect-Accommoda
 *
 * Strict 3-part commission system:
 * 1. Hotel - 15% commission, booking enabled
 * 2. Fully Furnished - 12% commission, booking enabled
 * 3. Rental - 0% commission, inquiry only
 */

export type PropertyType = 'hotel' | 'fully_furnished' | 'rental';

export interface PropertyTypeConfig {
  type: PropertyType;
  label: string;
  commissionRate: number;
  bookingEnabled: boolean;
  paymentEnabled: boolean;
  inquiryEnabled: boolean;
  agentCallEnabled: boolean;
  description: string;
}

export const PROPERTY_TYPE_CONFIGS: Record<PropertyType, PropertyTypeConfig> = {
  hotel: {
    type: 'hotel',
    label: 'Hotel',
    commissionRate: 15,
    bookingEnabled: true,
    paymentEnabled: true,
    inquiryEnabled: false,
    agentCallEnabled: false,
    description: '15% commission per booking. Online booking and payment enabled.',
  },
  fully_furnished: {
    type: 'fully_furnished',
    label: 'Fully Furnished',
    commissionRate: 12,
    bookingEnabled: true,
    paymentEnabled: true,
    inquiryEnabled: false,
    agentCallEnabled: false,
    description: '12% commission per booking. Online booking and payment enabled.',
  },
  rental: {
    type: 'rental',
    label: 'Rental',
    commissionRate: 0,
    bookingEnabled: false,
    paymentEnabled: false,
    inquiryEnabled: true,
    agentCallEnabled: true,
    description: 'Inquiry-based. No online booking or automatic commission.',
  },
};

export function getPropertyTypeConfig(type: PropertyType): PropertyTypeConfig {
  const config = PROPERTY_TYPE_CONFIGS[type];
  if (!config) {
    console.error(`Invalid property type: ${type}. Defaulting to rental.`);
    return PROPERTY_TYPE_CONFIGS['rental'];
  }
  return config;
}

export function isBookablePropertyType(type: PropertyType): boolean {
  const config = PROPERTY_TYPE_CONFIGS[type];
  if (!config) {
    console.error(`Invalid property type: ${type}. Defaulting to false.`);
    return false;
  }
  return config.bookingEnabled;
}

export function hasCommission(type: PropertyType): boolean {
  const config = PROPERTY_TYPE_CONFIGS[type];
  if (!config) {
    console.error(`Invalid property type: ${type}. Defaulting to false.`);
    return false;
  }
  return config.commissionRate > 0;
}

export function getCommissionRate(type: PropertyType): number {
  const config = PROPERTY_TYPE_CONFIGS[type];
  if (!config) {
    console.error(`Invalid property type: ${type}. Defaulting to 0.`);
    return 0;
  }
  return config.commissionRate;
}

export function calculateCommission(amount: number, type: PropertyType): number {
  if (!hasCommission(type)) {
    return 0;
  }
  const rate = getCommissionRate(type);
  return (amount * rate) / 100;
}

export function isInquiryBasedProperty(type: PropertyType): boolean {
  return PROPERTY_TYPE_CONFIGS[type].inquiryEnabled;
}

export function canCallAgent(type: PropertyType): boolean {
  return PROPERTY_TYPE_CONFIGS[type].agentCallEnabled;
}

export function getBookablePropertyTypes(): PropertyType[] {
  return Object.values(PROPERTY_TYPE_CONFIGS)
    .filter(config => config.bookingEnabled)
    .map(config => config.type);
}

export function getInquiryPropertyTypes(): PropertyType[] {
  return Object.values(PROPERTY_TYPE_CONFIGS)
    .filter(config => config.inquiryEnabled)
    .map(config => config.type);
}

export function formatPropertyType(type: PropertyType): string {
  return PROPERTY_TYPE_CONFIGS[type].label;
}

export function getPropertyTypeDescription(type: PropertyType): string {
  return PROPERTY_TYPE_CONFIGS[type].description;
}

export function validatePropertyTypeForBooking(type: PropertyType): boolean {
  return isBookablePropertyType(type);
}

export function validatePropertyTypeForPayment(type: PropertyType): boolean {
  const config = PROPERTY_TYPE_CONFIGS[type];
  if (!config) {
    console.error(`Invalid property type: ${type}. Defaulting to false.`);
    return false;
  }
  return config.paymentEnabled;
}

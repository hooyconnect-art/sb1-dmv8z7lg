/**
 * Commission Calculation System for HoyConnect-Accommoda
 *
 * Handles commission calculations based on property type:
 * - Hotel: 15%
 * - Fully Furnished: 12%
 * - Rental: 0% (no automatic commission)
 */

import { PropertyType, getCommissionRate, hasCommission, isBookablePropertyType } from './property-types';

export interface CommissionBreakdown {
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  hostEarnings: number;
  propertyType: PropertyType;
}

export function calculateBookingCommission(
  amount: number,
  propertyType: PropertyType
): CommissionBreakdown {
  if (!isBookablePropertyType(propertyType)) {
    throw new Error(`Property type "${propertyType}" does not support bookings`);
  }

  const commissionRate = getCommissionRate(propertyType);
  const commissionAmount = hasCommission(propertyType)
    ? (amount * commissionRate) / 100
    : 0;
  const hostEarnings = amount - commissionAmount;

  return {
    subtotal: amount,
    commissionRate,
    commissionAmount,
    hostEarnings,
    propertyType,
  };
}

export function formatCommissionBreakdown(breakdown: CommissionBreakdown): {
  subtotal: string;
  commission: string;
  hostEarnings: string;
  commissionRate: string;
} {
  return {
    subtotal: `$${breakdown.subtotal.toFixed(2)}`,
    commission: `$${breakdown.commissionAmount.toFixed(2)}`,
    hostEarnings: `$${breakdown.hostEarnings.toFixed(2)}`,
    commissionRate: `${breakdown.commissionRate}%`,
  };
}

export interface CommissionAnalytics {
  propertyType: PropertyType;
  totalBookings: number;
  totalRevenue: number;
  totalCommission: number;
  averageCommissionRate: number;
  hostEarnings: number;
}

export function aggregateCommissions(
  commissions: CommissionBreakdown[]
): CommissionAnalytics {
  const byType = commissions.reduce((acc, commission) => {
    const type = commission.propertyType;
    if (!acc[type]) {
      acc[type] = {
        propertyType: type,
        totalBookings: 0,
        totalRevenue: 0,
        totalCommission: 0,
        averageCommissionRate: 0,
        hostEarnings: 0,
      };
    }

    acc[type].totalBookings += 1;
    acc[type].totalRevenue += commission.subtotal;
    acc[type].totalCommission += commission.commissionAmount;
    acc[type].hostEarnings += commission.hostEarnings;

    return acc;
  }, {} as Record<PropertyType, CommissionAnalytics>);

  Object.values(byType).forEach((analytics) => {
    analytics.averageCommissionRate = analytics.totalBookings > 0
      ? (analytics.totalCommission / analytics.totalRevenue) * 100
      : 0;
  });

  return Object.values(byType)[0] || {
    propertyType: 'hotel',
    totalBookings: 0,
    totalRevenue: 0,
    totalCommission: 0,
    averageCommissionRate: 0,
    hostEarnings: 0,
  };
}

export function filterCommissionableBookings<T extends { property_type?: string }>(
  bookings: T[]
): T[] {
  return bookings.filter(
    (booking) =>
      booking.property_type === 'hotel' || booking.property_type === 'fully_furnished'
  );
}

export function shouldCalculateCommission(propertyType: string): boolean {
  return propertyType === 'hotel' || propertyType === 'fully_furnished';
}

export function getCommissionSettingsForPropertyType(propertyType: PropertyType): {
  propertyType: string;
  commissionRate: number;
  description: string;
} {
  const configs = {
    hotel: {
      propertyType: 'Hotel',
      commissionRate: 15,
      description: 'Commission applied per confirmed hotel booking',
    },
    fully_furnished: {
      propertyType: 'Fully Furnished',
      commissionRate: 12,
      description: 'Commission applied per confirmed furnished property booking',
    },
    rental: {
      propertyType: 'Rental',
      commissionRate: 0,
      description: 'No automatic commission - inquiries and manual handling only',
    },
  };

  return configs[propertyType];
}

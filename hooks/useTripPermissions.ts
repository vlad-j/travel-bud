// ─── useTripPermissions ───────────────────────────────────────────────────────
// Returns what the current user can do in the active trip.
// Based on their role: owner or editor.

import { useMemo } from 'react';
import { useCurrentTrip } from '../src/context/TripContext';

export interface TripPermissions {
  // Trip-level
  canDeleteTrip: boolean;
  canEditTripSettings: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canPromoteMembers: boolean;

  // Content
  canAddActivities: boolean;
  canEditActivities: boolean;
  canDeleteActivities: boolean;
  canAddExpenses: boolean;
  canEditExpenses: boolean;
  canDeleteExpenses: boolean;
  canAddTransport: boolean;
  canEditTransport: boolean;
  canDeleteTransport: boolean;
  canAddAccommodation: boolean;
  canEditAccommodation: boolean;
  canDeleteAccommodation: boolean;
  canAddDocuments: boolean;
  canDeleteDocuments: boolean;
  canAddPacking: boolean;
  canDeletePacking: boolean;
  canWriteJournal: boolean;

  // Role info
  isOwner: boolean;
  isEditor: boolean;
  role: string | null;
}

const OWNER_PERMISSIONS: TripPermissions = {
  canDeleteTrip: true,
  canEditTripSettings: true,
  canInviteMembers: true,
  canRemoveMembers: true,
  canPromoteMembers: true,
  canAddActivities: true,
  canEditActivities: true,
  canDeleteActivities: true,
  canAddExpenses: true,
  canEditExpenses: true,
  canDeleteExpenses: true,
  canAddTransport: true,
  canEditTransport: true,
  canDeleteTransport: true,
  canAddAccommodation: true,
  canEditAccommodation: true,
  canDeleteAccommodation: true,
  canAddDocuments: true,
  canDeleteDocuments: true,
  canAddPacking: true,
  canDeletePacking: true,
  canWriteJournal: true,
  isOwner: true,
  isEditor: false,
  role: 'owner',
};

const EDITOR_PERMISSIONS: TripPermissions = {
  canDeleteTrip: false,
  canEditTripSettings: false,
  canInviteMembers: false,
  canRemoveMembers: false,
  canPromoteMembers: false,
  canAddActivities: true,
  canEditActivities: true,
  canDeleteActivities: true,
  canAddExpenses: true,
  canEditExpenses: true,
  canDeleteExpenses: true,
  canAddTransport: true,
  canEditTransport: true,
  canDeleteTransport: true,
  canAddAccommodation: true,
  canEditAccommodation: true,
  canDeleteAccommodation: true,
  canAddDocuments: true,
  canDeleteDocuments: true,
  canAddPacking: true,
  canDeletePacking: true,
  canWriteJournal: true,
  isOwner: false,
  isEditor: true,
  role: 'editor',
};

const NO_PERMISSIONS: TripPermissions = {
  canDeleteTrip: false,
  canEditTripSettings: false,
  canInviteMembers: false,
  canRemoveMembers: false,
  canPromoteMembers: false,
  canAddActivities: false,
  canEditActivities: false,
  canDeleteActivities: false,
  canAddExpenses: false,
  canEditExpenses: false,
  canDeleteExpenses: false,
  canAddTransport: false,
  canEditTransport: false,
  canDeleteTransport: false,
  canAddAccommodation: false,
  canEditAccommodation: false,
  canDeleteAccommodation: false,
  canAddDocuments: false,
  canDeleteDocuments: false,
  canAddPacking: false,
  canDeletePacking: false,
  canWriteJournal: false,
  isOwner: false,
  isEditor: false,
  role: null,
};

export function useTripPermissions(): TripPermissions {
  const { currentTripId, tripMembers, currentUserId } = useCurrentTrip();

  return useMemo(() => {
    if (!currentTripId || !currentUserId) return NO_PERMISSIONS;

    const currentMember = tripMembers.find(m => m.id === currentUserId);
    if (!currentMember) return EDITOR_PERMISSIONS; // safe default

    if (currentMember.role === 'owner') return OWNER_PERMISSIONS;
    return EDITOR_PERMISSIONS;
  }, [currentTripId, tripMembers, currentUserId]);
}

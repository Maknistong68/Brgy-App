import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ResidentDashboard } from '@/components/dashboard/ResidentDashboard';
import { AdminHomeDashboard } from '@/components/dashboard/AdminHomeDashboard';

export default function HomeScreen() {
  const { isRoleAtLeast } = usePermissions();

  if (isRoleAtLeast('secretary')) {
    return <AdminHomeDashboard />;
  }

  return <ResidentDashboard />;
}

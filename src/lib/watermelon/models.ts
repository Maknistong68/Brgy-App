// WatermelonDB models - requires native module setup
// These models map to the WatermelonDB schema and provide
// the bridge between local SQLite storage and the app

// Note: WatermelonDB requires native module installation
// Run: npx expo install @nozbe/watermelondb
// Then follow platform-specific setup instructions

export interface LocalProfile {
  id: string;
  server_id: string;
  user_id: string;
  barangay_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  is_verified: boolean;
  updated_at: number;
}

export interface LocalComplaint {
  id: string;
  server_id: string;
  barangay_id: string;
  reference_number: string;
  complainant_id: string;
  respondent_name: string;
  respondent_address: string | null;
  category: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: number;
  updated_at: number;
}

export interface LocalDocumentRequest {
  id: string;
  server_id: string;
  barangay_id: string;
  reference_number: string;
  requestor_id: string;
  document_type: string;
  purpose: string;
  status: string;
  payment_status: string;
  amount: number | null;
  created_at: number;
  updated_at: number;
}

export interface LocalNotification {
  id: string;
  server_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: number;
}

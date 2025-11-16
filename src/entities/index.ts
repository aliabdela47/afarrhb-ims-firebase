// Core entity types for AfarRHB IMS

export interface Item {
  id: string;
  name: string;
  name_am?: string;
  code: string;
  category_id?: string;
  warehouse_id?: string;
  description?: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  unit_price: number;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
  created_by?: string;
}

export interface Category {
  id: string;
  name: string;
  name_am?: string;
  code: string;
  description?: string;
  parent_category_id?: string;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  name_am?: string;
  code: string;
  location?: string;
  manager_name?: string;
  phone?: string;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
}

export interface Employee {
  id: string;
  name: string;
  name_am?: string;
  employee_code: string;
  salary?: number;
  taamagoli?: string;
  directorate?: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
  photo?: string;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
}

export interface Directorate {
  id: string;
  name: string;
  name_am?: string;
  code: string;
  director_name?: string;
  phone?: string;
  email?: string;
  parent_directorate_id?: string;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
}

export interface Customer {
  id: string;
  name: string;
  name_am?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tin_number?: string;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
}

export type RequesterType = 'employee' | 'directorate' | 'customer';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';

export interface Request {
  id: string;
  request_number: string;
  requester_type: RequesterType;
  employee_id?: string;
  directorate_id?: string;
  customer_id?: string;
  warehouse_id: string;
  request_date: Date;
  needed_by_date?: Date;
  purpose?: string;
  status: RequestStatus;
  approved_by?: string;
  approved_date?: Date;
  rejection_reason?: string;
  notes?: string;
  created_date?: Date;
  updated_date?: Date;
  created_by?: string;
}

export interface RequestItem {
  id: string;
  request_id: string;
  item_id: string;
  quantity_requested: number;
  quantity_approved?: number;
  notes?: string;
  created_date?: Date;
  updated_date?: Date;
}

export type RecipientType = 'employee' | 'directorate' | 'customer';
export type IssuanceStatus = 'draft' | 'completed' | 'cancelled';

export interface Issuance {
  id: string;
  issuance_number: string;
  request_id?: string;
  recipient_type: RecipientType;
  employee_id?: string;
  directorate_id?: string;
  customer_id?: string;
  warehouse_id: string;
  issuance_date: Date;
  issued_by: string;
  purpose?: string;
  status: IssuanceStatus;
  notes?: string;
  total_value: number;
  created_date?: Date;
  updated_date?: Date;
  created_by?: string;
}

export interface IssuanceItem {
  id: string;
  issuance_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_date?: Date;
  updated_date?: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_email: string;
  timestamp: Date;
  changes?: string;
  ip_address?: string;
  user_agent?: string;
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  runTransaction,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type {
  Request,
  RequestItem,
  Issuance,
  IssuanceItem,
  Item,
  AuditLog,
} from '../entities';

// Helper to convert Firestore timestamps to Date objects
export function convertTimestamps<T>(data: DocumentData): T {
  const converted: any = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted as T;
}

// Generic CRUD operations
export async function createDoc<T>(
  collectionName: string,
  data: Omit<T, 'id' | 'created_date' | 'updated_date' | 'created_by'>
): Promise<string> {
  const user = auth.currentUser;
  const docData = {
    ...data,
    created_date: Timestamp.now(),
    updated_date: Timestamp.now(),
    created_by: user?.email || 'anonymous',
  };
  
  const docRef = await addDoc(collection(db, collectionName), docData);
  return docRef.id;
}

export async function getDocById<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return convertTimestamps<T>({ id: docSnap.id, ...docSnap.data() });
  }
  return null;
}

export async function updateDocById<T>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updated_date: Timestamp.now(),
  } as any);
}

export async function deleteDocById(
  collectionName: string,
  id: string
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

export async function queryDocs<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) =>
    convertTimestamps<T>({ id: doc.id, ...doc.data() })
  );
}

export async function getAllDocs<T>(collectionName: string): Promise<T[]> {
  return queryDocs<T>(collectionName);
}

// Generate sequential code
export async function generateSequentialCode(
  collectionName: string,
  prefix: string,
  length: number
): Promise<string> {
  const docs = await getAllDocs<{ [key: string]: any }>(collectionName);
  const numbers = docs
    .map((doc) => {
      const numberField = Object.keys(doc).find((key) =>
        doc[key]?.toString().startsWith(prefix)
      );
      if (numberField) {
        const match = doc[numberField].match(new RegExp(`${prefix}(\\d+)`));
        return match ? parseInt(match[1], 10) : 0;
      }
      return 0;
    })
    .filter((n) => !isNaN(n));
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(length, '0')}`;
}

// Audit logging
export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  changes?: any
): Promise<void> {
  const user = auth.currentUser;
  const auditData: Omit<AuditLog, 'id'> = {
    action,
    entity_type: entityType,
    entity_id: entityId,
    user_email: user?.email || 'anonymous',
    timestamp: new Date(),
    changes: changes ? JSON.stringify(changes) : undefined,
  };
  
  await createDoc<AuditLog>('audit_logs', auditData);
}

// Request operations
export async function createRequest(
  requestData: Omit<Request, 'id' | 'request_number' | 'created_date' | 'updated_date' | 'created_by'>,
  items: Array<Omit<RequestItem, 'id' | 'request_id' | 'created_date' | 'updated_date'>>
): Promise<string> {
  // Generate request number
  const requestNumber = await generateSequentialCode('requests', 'REQ-', 5);
  
  // Create request document
  const requestId = await createDoc<Request>('requests', {
    ...requestData,
    request_number: requestNumber,
  } as any);
  
  // Create request items in subcollection
  const batch = writeBatch(db);
  items.forEach((item) => {
    const itemRef = doc(collection(db, `requests/${requestId}/items`));
    batch.set(itemRef, {
      ...item,
      request_id: requestId,
      created_date: Timestamp.now(),
      updated_date: Timestamp.now(),
    });
  });
  await batch.commit();
  
  // Log audit
  await logAudit('create', 'Request', requestId, { requestNumber, itemCount: items.length });
  
  return requestId;
}

export async function getRequestItems(requestId: string): Promise<RequestItem[]> {
  const itemsRef = collection(db, `requests/${requestId}/items`);
  const snapshot = await getDocs(itemsRef);
  
  return snapshot.docs.map((doc) =>
    convertTimestamps<RequestItem>({ id: doc.id, ...doc.data() })
  );
}

export async function approveRequest(
  requestId: string,
  approvedItems: Array<{ id: string; quantity_approved: number }>
): Promise<void> {
  const user = auth.currentUser;
  
  // Update request status
  await updateDocById<Request>('requests', requestId, {
    status: 'approved',
    approved_by: user?.email || 'anonymous',
    approved_date: new Date(),
  } as any);
  
  // Update approved quantities for items
  const batch = writeBatch(db);
  approvedItems.forEach((item) => {
    const itemRef = doc(db, `requests/${requestId}/items`, item.id);
    batch.update(itemRef, {
      quantity_approved: item.quantity_approved,
      updated_date: Timestamp.now(),
    });
  });
  await batch.commit();
  
  // Log audit
  await logAudit('approve', 'Request', requestId, { approvedItems });
}

export async function rejectRequest(
  requestId: string,
  rejectionReason: string
): Promise<void> {
  await updateDocById<Request>('requests', requestId, {
    status: 'rejected',
    rejection_reason: rejectionReason,
  } as any);
  
  await logAudit('reject', 'Request', requestId, { rejectionReason });
}

// Issuance operations with stock deduction
export async function createIssuance(
  issuanceData: Omit<Issuance, 'id' | 'issuance_number' | 'total_value' | 'created_date' | 'updated_date' | 'created_by'>,
  items: Array<Omit<IssuanceItem, 'id' | 'issuance_id' | 'created_date' | 'updated_date'>>
): Promise<string> {
  const user = auth.currentUser;
  
  // Calculate total value
  const totalValue = items.reduce((sum, item) => sum + item.total_price, 0);
  
  // Generate issuance number
  const issuanceNumber = await generateSequentialCode('issuances', 'ISS-', 5);
  
  // Use transaction to ensure atomicity
  return await runTransaction(db, async (transaction) => {
    // Verify stock availability for all items
    for (const item of items) {
      const itemRef = doc(db, 'items', item.item_id);
      const itemDoc = await transaction.get(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error(`Item ${item.item_id} not found`);
      }
      
      const itemData = itemDoc.data() as Item;
      if (itemData.current_stock < item.quantity) {
        throw new Error(
          `Insufficient stock for item ${itemData.name}. Available: ${itemData.current_stock}, Requested: ${item.quantity}`
        );
      }
    }
    
    // Create issuance document
    const issuanceRef = doc(collection(db, 'issuances'));
    transaction.set(issuanceRef, {
      ...issuanceData,
      issuance_number: issuanceNumber,
      total_value: totalValue,
      issued_by: user?.email || 'anonymous',
      created_date: Timestamp.now(),
      updated_date: Timestamp.now(),
      created_by: user?.email || 'anonymous',
    });
    
    // Create issuance items and deduct stock
    for (const item of items) {
      const itemRef = doc(collection(db, `issuances/${issuanceRef.id}/items`));
      transaction.set(itemRef, {
        ...item,
        issuance_id: issuanceRef.id,
        created_date: Timestamp.now(),
        updated_date: Timestamp.now(),
      });
      
      // Deduct stock from item
      const stockItemRef = doc(db, 'items', item.item_id);
      const stockItemDoc = await transaction.get(stockItemRef);
      const currentStock = (stockItemDoc.data() as Item).current_stock;
      const newStock = currentStock - item.quantity;
      
      transaction.update(stockItemRef, {
        current_stock: newStock,
        updated_date: Timestamp.now(),
      });
      
      // Log stock change audit
      await logAudit('update', 'Item', item.item_id, {
        field: 'current_stock',
        old_value: currentStock,
        new_value: newStock,
        reason: `Issuance ${issuanceNumber}`,
      });
    }
    
    const issuanceId = issuanceRef.id;
    
    // Log issuance audit
    await logAudit('issue', 'Issuance', issuanceId, {
      issuanceNumber,
      itemCount: items.length,
      totalValue,
    });
    
    return issuanceId;
  });
}

export async function getIssuanceItems(issuanceId: string): Promise<IssuanceItem[]> {
  const itemsRef = collection(db, `issuances/${issuanceId}/items`);
  const snapshot = await getDocs(itemsRef);
  
  return snapshot.docs.map((doc) =>
    convertTimestamps<IssuanceItem>({ id: doc.id, ...doc.data() })
  );
}

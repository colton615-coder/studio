'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';
import { offlineQueue } from '@/lib/offline-queue';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 * Queues operation offline if network is unavailable.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const operation = options && 'merge' in options ? 'update' : 'create';
  setDoc(docRef, data, options || {}).catch(error => {
    // Check if it's a network error
    if (error.code === 'unavailable' || !navigator.onLine) {
      // Queue operation for retry when online
      offlineQueue.addOperation({
        type: 'set',
        collectionPath: docRef.parent.path,
        documentId: docRef.id,
        data,
      }).catch(() => {
        // Queue operation failure is non-critical
      });
    } else {
      // Handle other errors (permissions, etc.)
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: operation,
          requestResourceData: data,
        })
      )
    }
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 * Queues operation offline if network is unavailable.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      // Check if it's a network error
      if (error.code === 'unavailable' || !navigator.onLine) {
        // Queue operation for retry when online
        offlineQueue.addOperation({
          type: 'add',
          collectionPath: colRef.path,
          data,
        }).catch(() => {
          // Queue operation failure is non-critical
        });
      } else {
        // Handle other errors (permissions, etc.)
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: data,
          })
        )
      }
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 * Queues operation offline if network is unavailable.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      // Check if it's a network error
      if (error.code === 'unavailable' || !navigator.onLine) {
        // Queue operation for retry when online
        offlineQueue.addOperation({
          type: 'update',
          collectionPath: docRef.parent.path,
          documentId: docRef.id,
          data,
        }).catch(() => {
          // Queue operation failure is non-critical
        });
      } else {
        // Handle other errors (permissions, etc.)
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
          })
        )
      }
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 * Queues operation offline if network is unavailable.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      // Check if it's a network error
      if (error.code === 'unavailable' || !navigator.onLine) {
        // Queue operation for retry when online
        offlineQueue.addOperation({
          type: 'delete',
          collectionPath: docRef.parent.path,
          documentId: docRef.id,
        }).catch(() => {
          // Queue operation failure is non-critical
        });
      } else {
        // Handle other errors (permissions, etc.)
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          })
        )
      }
    });
}

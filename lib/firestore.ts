import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { ImageUploadService } from './imageUpload';

export type Assessment = {
  id?: string;
  userId: string;
  created_at: number;
  latitude: number | null;
  longitude: number | null;
  category: string;
  element: string;
  condition: number;
  priority: number;
  photo_uri: string;
  notes: string;
};

export class FirestoreService {
  static async createAssessment(assessment: Omit<Assessment, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'assessments'), assessment);
      return { ...assessment, id: docRef.id };
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  }

  static async createAssessmentWithImageUpload(assessmentData: Omit<Assessment, 'id'>) {
    try {
      // Generate a temporary ID for the assessment
      const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 11);

      // Upload the image to Firebase Storage
      const downloadURL = await ImageUploadService.uploadImageWithRetry(
        assessmentData.photo_uri,
        assessmentData.userId,
        tempId
      );

      // Create the assessment with the Firebase Storage URL
      const assessmentWithStorageUrl = {
        ...assessmentData,
        photo_uri: downloadURL
      };

      const docRef = await addDoc(collection(db, 'assessments'), assessmentWithStorageUrl);

      return { ...assessmentWithStorageUrl, id: docRef.id };
    } catch (error) {
      console.error('Error creating assessment with image upload:', error);

      // Provide more context in the error message
      if (error instanceof Error) {
        throw new Error(`Failed to create assessment: ${error.message}`);
      } else {
        throw new Error('Failed to create assessment: Unknown error occurred');
      }
    }
  }

  static async listAssessments(userId: string) {
    try {
      const q = query(
        collection(db, 'assessments'),
        where('userId', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assessment[];
    } catch (error) {
      console.error('Error listing assessments:', error);
      throw error;
    }
  }

  static async getAssessment(id: string) {
    try {
      const docRef = doc(db, 'assessments', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Assessment;
      }
      throw new Error('Assessment not found');
    } catch (error) {
      console.error('Error getting assessment:', error);
      throw error;
    }
  }

  static async updateAssessment(id: string, data: Partial<Assessment>) {
    try {
      const docRef = doc(db, 'assessments', id);
      await updateDoc(docRef, data);
      return { id, ...data };
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }

  static async deleteAssessment(id: string) {
    try {
      const docRef = doc(db, 'assessments', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw error;
    }
  }
}
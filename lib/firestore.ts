import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { ImageUploadService } from './imageUpload';

export type UserRole = 'staff' | 'admin';

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  created_at: number;
  updated_at: number;
  isActive: boolean;
};

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
  // User Profile Management
  static async createUserProfile(userId: string, email: string, displayName: string, role: UserRole = 'staff') {
    try {
      const userProfile: UserProfile = {
        id: userId,
        email,
        displayName,
        role,
        created_at: Date.now(),
        updated_at: Date.now(),
        isActive: true,
      };

      await setDoc(doc(db, 'users', userId), userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async updateUserRole(userId: string, role: UserRole) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        role,
        updated_at: Date.now(),
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  static async listAllUsers(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'users'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error: any) {
      console.error('Error listing users:', error);

      // Provide helpful error messages for common issues
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied: Please ensure Firebase security rules are properly configured. See FIREBASE_RULES_DEVELOPMENT.md for immediate fix.');
      }

      throw new Error(`Failed to load users: ${error?.message || 'Unknown error'}`);
    }
  }

  // Assessment Management
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

  static async listAllAssessments(): Promise<Assessment[]> {
    try {
      const q = query(
        collection(db, 'assessments'),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assessment[];
    } catch (error: any) {
      console.error('Error listing all assessments:', error);

      // Provide helpful error messages for common issues
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied: Please ensure Firebase security rules are properly configured. See FIREBASE_RULES_DEVELOPMENT.md for immediate fix.');
      }

      if (error?.code === 'failed-precondition') {
        throw new Error('Database index required: Please create the necessary Firestore indexes.');
      }

      throw new Error(`Failed to load assessments: ${error?.message || 'Unknown error'}`);
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
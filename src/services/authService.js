import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile,
    sendPasswordResetEmail
  } from "firebase/auth";
  import { setDoc, doc } from "firebase/firestore";
  import { auth, db } from "./firebase";
  
  // Register a new user
  export const registerUser = async (name, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: name
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        createdAt: new Date()
      });
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Login an existing user
  export const loginUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Logout the current user
  export const logoutUser = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Send password reset email
  export const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Update user profile
  export const updateUserProfile = async (updates) => {
    try {
      await updateProfile(auth.currentUser, updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
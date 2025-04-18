import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    query, 
    where, 
    orderBy 
  } from "firebase/firestore";
  import { auth, db } from "./firebase";
  
  // Get all study sessions for the current user
  export const getAllSessions = async () => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const sessionsRef = collection(db, "users", auth.currentUser.uid, "sessions");
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      const sessions = [];
      sessionsSnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, sessions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Get upcoming sessions
  export const getUpcomingSessions = async () => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const sessionsRef = collection(db, "users", auth.currentUser.uid, "sessions");
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      const today = new Date();
      const upcomingSessions = [];
      
      sessionsSnapshot.forEach((doc) => {
        const session = { id: doc.id, ...doc.data() };
        const sessionDate = new Date(session.date);
        
        if (sessionDate >= today) {
          upcomingSessions.push(session);
        }
      });
      
      // Sort by date
      upcomingSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return { success: true, sessions: upcomingSessions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Add a new study session
  export const addSession = async (sessionData) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const sessionsRef = collection(db, "users", auth.currentUser.uid, "sessions");
      const newSession = {
        ...sessionData,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(sessionsRef, newSession);
      return { success: true, sessionId: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Update a study session
  export const updateSession = async (sessionId, updates) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const sessionRef = doc(db, "users", auth.currentUser.uid, "sessions", sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Delete a study session
  export const deleteSession = async (sessionId) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const sessionRef = doc(db, "users", auth.currentUser.uid, "sessions", sessionId);
      await deleteDoc(sessionRef);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
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
  
  // Get all tasks for the current user
  export const getAllTasks = async () => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const tasksRef = collection(db, "users", auth.currentUser.uid, "tasks");
      const tasksSnapshot = await getDocs(tasksRef);
      
      const tasks = [];
      tasksSnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, tasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Get completed tasks
  export const getCompletedTasks = async () => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const tasksRef = collection(db, "users", auth.currentUser.uid, "tasks");
      const q = query(tasksRef, where("completed", "==", true));
      const tasksSnapshot = await getDocs(q);
      
      const tasks = [];
      tasksSnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, tasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Get incomplete tasks
  export const getIncompleteTasks = async () => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const tasksRef = collection(db, "users", auth.currentUser.uid, "tasks");
      const q = query(tasksRef, where("completed", "==", false));
      const tasksSnapshot = await getDocs(q);
      
      const tasks = [];
      tasksSnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, tasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Add a new task
  export const addTask = async (taskData) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const tasksRef = collection(db, "users", auth.currentUser.uid, "tasks");
      const newTask = {
        ...taskData,
        completed: false,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(tasksRef, newTask);
      return { success: true, taskId: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Update a task
  export const updateTask = async (taskId, updates) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Mark a task as complete/incomplete
  export const toggleTaskCompletion = async (taskId, isCompleted) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
      await updateDoc(taskRef, {
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Delete a task
  export const deleteTask = async (taskId) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
      await deleteDoc(taskRef);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
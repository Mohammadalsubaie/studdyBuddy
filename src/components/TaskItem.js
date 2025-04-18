import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function TaskItem({ task, onUpdate }) {
  const toggleComplete = async () => {
    try {
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", task.id);
      await updateDoc(taskRef, {
        completed: !task.completed
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <View style={styles.taskItem}>
      <TouchableOpacity onPress={toggleComplete} style={styles.checkbox}>
        <View style={[
          styles.checkboxInner, 
          task.completed && styles.checkboxChecked
        ]}>
          {task.completed && (
            <Ionicons name="checkmark" size={18} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text 
          style={[
            styles.taskTitle, 
            task.completed && styles.taskCompleted
          ]}
        >
          {task.title}
        </Text>
        
        {task.description ? (
          <Text 
            style={[
              styles.taskDescription, 
              task.completed && styles.taskCompleted
            ]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        ) : null}
        
        <Text 
          style={[
            styles.dueDate, 
            isOverdue && styles.overdue
          ]}
        >
          Due: {isOverdue ? 'Overdue' : formatDate(task.dueDate)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    marginRight: 15,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dueDate: {
    fontSize: 12,
    color: '#888',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  overdue: {
    color: '#ff3b30',
    fontWeight: '500',
  },
});
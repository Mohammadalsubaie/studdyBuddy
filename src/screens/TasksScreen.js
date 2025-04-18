import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DateTimePicker from '@react-native-community/datetimepicker';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch tasks from Firebase
  const fetchTasks = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const tasksRef = collection(db, "users", auth.currentUser.uid, "tasks");
      const tasksSnapshot = await getDocs(tasksRef);
      
      let incompleteTasks = [];
      let completed = [];
      
      tasksSnapshot.forEach((doc) => {
        const taskData = doc.data();
        const task = { 
          id: doc.id, 
          ...taskData,
          // Convert Firebase timestamp to JS Date if needed
          dueDate: taskData.dueDate instanceof Timestamp ? 
            taskData.dueDate.toDate() : 
            new Date(taskData.dueDate)
        };
        
        if (task.completed) {
          completed.push(task);
        } else {
          incompleteTasks.push(task);
        }
      });
      
      // Sort by due date
      incompleteTasks.sort((a, b) => a.dueDate - b.dueDate);
      completed.sort((a, b) => {
        const dateA = b.completedAt instanceof Timestamp ? 
          b.completedAt.toDate() : 
          new Date(b.completedAt || b.dueDate);
        const dateB = a.completedAt instanceof Timestamp ? 
          a.completedAt.toDate() : 
          new Date(a.completedAt || a.dueDate);
        return dateA - dateB;
      });
      
      setTasks(incompleteTasks);
      setCompletedTasks(completed);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
      Alert.alert("Error", "Failed to load tasks: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Add or update task
  const handleAddTask = async () => {
    if (title.trim() === '') {
      Alert.alert("Error", "Please enter a task title");
      return;
    }
    
    setLoading(true);
    try {
      if (isEditing && currentTaskId) {
        // Update existing task
        const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", currentTaskId);
        
        // Create task data
        const taskData = {
          title: title,
          description: description,
          dueDate: dueDate.toISOString(),
          priority: priority,
          subject: subject,
          updatedAt: new Date().toISOString()
        };
        
        // Update in Firebase
        await updateDoc(taskRef, taskData);
        Alert.alert("Success", "Task updated successfully");
      } else {
        // Add new task
        const taskData = {
          title: title,
          description: description,
          dueDate: dueDate.toISOString(),
          priority: priority,
          subject: subject,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        // Add to Firebase
        await addDoc(collection(db, "users", auth.currentUser.uid, "tasks"), taskData);
        Alert.alert("Success", "Task added successfully");
      }
      
      closeModal();
      fetchTasks(); // Refresh tasks
    } catch (error) {
      console.error("Error saving task: ", error);
      Alert.alert("Error", "Failed to save task: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (task) => {
    setTaskToDelete(task);
    setDeleteModalVisible(true);
  };

  // Delete task after confirmation
  const handleDeleteConfirm = async () => {
    if (!taskToDelete || !taskToDelete.id) {
      Alert.alert("Error", "No task selected for deletion");
      return;
    }
    
    setLoading(true);
    try {
      // Delete from Firebase
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskToDelete.id);
      await deleteDoc(taskRef);
      
      setDeleteModalVisible(false);
      setTaskToDelete(null);
      Alert.alert("Success", "Task deleted successfully");
      
      // Refresh tasks
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task: ", error);
      Alert.alert("Error", "Failed to delete task: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (task) => {
    if (!task || !task.id) return;
    
    setLoading(true);
    try {
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", task.id);
      
      // Update completion status
      await updateDoc(taskRef, {
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      });
      
      // Refresh tasks
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task completion: ", error);
      Alert.alert("Error", "Failed to update task: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit task
  const editTask = (task) => {
    setTitle(task.title);
    setDescription(task.description || '');
    
    // Handle date conversion
    try {
      setDueDate(task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate));
    } catch (error) {
      console.error("Error parsing date:", error);
      setDueDate(new Date());
    }
    
    setPriority(task.priority || 'medium');
    setSubject(task.subject || '');
    setCurrentTaskId(task.id);
    setIsEditing(true);
    setModalVisible(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setModalVisible(false);
    setTitle('');
    setDescription('');
    setDueDate(new Date());
    setPriority('medium');
    setSubject('');
    setIsEditing(false);
    setCurrentTaskId(null);
  };

  // Handle date picker changes
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  // Simple TaskItem component
  const TaskItem = ({ task }) => (
    <TouchableOpacity 
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
      }}
      onPress={() => toggleTaskCompletion(task)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: '#007AFF',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10
        }}>
          {task.completed && (
            <Ionicons name="checkmark" size={18} color="#007AFF" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: 'bold',
              textDecorationLine: task.completed ? 'line-through' : 'none',
              color: task.completed ? '#999' : '#333'
            }}>
              {task.title}
            </Text>
            <Text style={{ color: '#666' }}>
              {task.dueDate instanceof Date 
                ? task.dueDate.toLocaleDateString() 
                : new Date(task.dueDate).toLocaleDateString()}
            </Text>
          </View>
          
          {task.description ? (
            <Text style={{ 
              marginTop: 5, 
              color: task.completed ? '#999' : '#666',
              textDecorationLine: task.completed ? 'line-through' : 'none'
            }}>
              {task.description}
            </Text>
          ) : null}
          
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <View style={{
              backgroundColor: 
                task.priority === 'high' ? '#ffdddd' : 
                task.priority === 'medium' ? '#fff0dd' : '#ddffdd',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
              marginRight: 10
            }}>
              <Text style={{ fontSize: 12, fontWeight: '500' }}>{task.priority}</Text>
            </View>
            {task.subject ? (
              <Text style={{ fontSize: 12, color: '#666' }}>{task.subject}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            !showCompleted && styles.activeFilter
          ]}
          onPress={() => setShowCompleted(false)}
        >
          <Text style={styles.filterText}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            showCompleted && styles.activeFilter
          ]}
          onPress={() => setShowCompleted(true)}
        >
          <Text style={styles.filterText}>Completed</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.taskList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTasks} />
        }
      >
        {!showCompleted ? (
          // Show active tasks
          tasks.length > 0 ? (
            tasks.map(task => (
              <View key={task.id} style={styles.taskWrapper}>
                <TaskItem task={task} />
                <View style={styles.taskActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => editTask(task)}
                  >
                    <Ionicons name="pencil" size={18} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => showDeleteConfirmation(task)}
                  >
                    <Ionicons name="trash" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkbox-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No tasks yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to add a new task
              </Text>
            </View>
          )
        ) : (
          // Show completed tasks
          completedTasks.length > 0 ? (
            completedTasks.map(task => (
              <View key={task.id} style={styles.taskWrapper}>
                <TaskItem task={task} />
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => showDeleteConfirmation(task)}
                >
                  <Ionicons name="trash" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No completed tasks</Text>
              <Text style={styles.emptyStateSubtext}>
                Complete a task to see it here
              </Text>
            </View>
          )
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CS475 - Mobile Development
          </Text>
          <Text style={styles.footerText}>
            CRN: Your CRN - Group Members Names
          </Text>
        </View>
      </ScrollView>
      
      {/* Add/Edit Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Task' : 'Add New Task'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Task title"
                value={title}
                onChangeText={setTitle}
              />
              
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
              
              <Text style={styles.inputLabel}>Due Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {dueDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
              
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                <TouchableOpacity 
                  style={[
                    styles.priorityButton, 
                    styles.lowPriorityButton,
                    priority === 'low' && styles.activePriorityButton
                  ]}
                  onPress={() => setPriority('low')}
                >
                  <Text style={styles.priorityButtonText}>Low</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.priorityButton, 
                    styles.mediumPriorityButton,
                    priority === 'medium' && styles.activePriorityButton
                  ]}
                  onPress={() => setPriority('medium')}
                >
                  <Text style={styles.priorityButtonText}>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.priorityButton, 
                    styles.highPriorityButton,
                    priority === 'high' && styles.activePriorityButton
                  ]}
                  onPress={() => setPriority('high')}
                >
                  <Text style={styles.priorityButtonText}>High</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Subject/Course (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Math, History"
                value={subject}
                onChangeText={setSubject}
              />
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddTask}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Task' : 'Add Task'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Delete Task</Text>
            <Text style={styles.confirmationText}>
              Are you sure you want to delete this task?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={handleDeleteConfirm}
              >
                <Text style={[styles.confirmButtonText, {color: 'white'}]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  activeFilter: {
    backgroundColor: '#e6f2ff',
  },
  filterText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  taskList: {
    flex: 1,
    padding: 16,
  },
  taskWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  editButton: {
    padding: 8,
    marginRight: 5,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmationModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  lowPriorityButton: {
    backgroundColor: '#ddffdd',
  },
  mediumPriorityButton: {
    backgroundColor: '#fff0dd',
  },
  highPriorityButton: {
    backgroundColor: '#ffdddd',
  },
  activePriorityButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  priorityButtonText: {
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
});
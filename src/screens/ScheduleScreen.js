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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import StudySessionCard from '../components/StudySessionCard';

export default function ScheduleScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
  const [location, setLocation] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [pickerType, setPickerType] = useState('date');

  const fetchSessions = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const sessionsRef = collection(db, "users", auth.currentUser.uid, "sessions");
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      let sessionsList = [];
      
      sessionsSnapshot.forEach((doc) => {
        const session = { id: doc.id, ...doc.data() };
        sessionsList.push(session);
      });
      
      // Sort by date and time
      sessionsList.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        return new Date(a.startTime) - new Date(b.startTime);
      });
      
      setSessions(sessionsList);
    } catch (error) {
      console.error("Error fetching sessions: ", error);
      Alert.alert("Error", "Failed to load study sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleAddSession = async () => {
    if (title.trim() === '') {
      Alert.alert("Error", "Please enter a session title");
      return;
    }

    try {
      if (isEditing && currentSessionId) {
        // Update existing session
        const sessionRef = doc(db, "users", auth.currentUser.uid, "sessions", currentSessionId);
        await updateDoc(sessionRef, {
          title,
          date,
          startTime,
          endTime,
          location,
          subject,
          notes,
          updatedAt: new Date()
        });
      } else {
        // Add new session
        await addDoc(collection(db, "users", auth.currentUser.uid, "sessions"), {
          title,
          date,
          startTime,
          endTime,
          location,
          subject,
          notes,
          createdAt: new Date()
        });
      }
      
      closeModal();
      fetchSessions();
    } catch (error) {
      console.error("Error adding/updating session: ", error);
      Alert.alert("Error", "Failed to save study session");
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "sessions", sessionId));
      fetchSessions();
    } catch (error) {
      console.error("Error deleting session: ", error);
      Alert.alert("Error", "Failed to delete study session");
    }
  };

  const editSession = (session) => {
    setTitle(session.title);
    setDate(new Date(session.date));
    setStartTime(new Date(session.startTime));
    setEndTime(new Date(session.endTime));
    setLocation(session.location || '');
    setSubject(session.subject || '');
    setNotes(session.notes || '');
    setCurrentSessionId(session.id);
    setIsEditing(true);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTitle('');
    setDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date(new Date().setHours(new Date().getHours() + 1)));
    setLocation('');
    setSubject('');
    setNotes('');
    setIsEditing(false);
    setCurrentSessionId(null);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
      
      // set end time to start time + 1 hour if the end time is erlier
      // 
      if (selectedTime > endTime) {
        const newEndTime = new Date(selectedTime);
        newEndTime.setHours(newEndTime.getHours() + 1);
        setEndTime(newEndTime);
      }
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const groupSessionsByDate = () => {
    const grouped = {};
    
    sessions.forEach(session => {
      const dateKey = new Date(session.date).toLocaleDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    
    return grouped;
  };

  const groupedSessions = groupSessionsByDate();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Schedule</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.sessionList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchSessions} />
        }
      >
        {Object.keys(groupedSessions).length > 0 ? (
          Object.entries(groupedSessions).map(([dateKey, dateSessions]) => (
            <View key={dateKey} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>
                {new Date(dateKey).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              
              {dateSessions.map(session => (
                <View key={session.id} style={styles.sessionWrapper}>
                  <StudySessionCard session={session} />
                  <View style={styles.sessionActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => editSession(session)}
                    >
                      <Ionicons name="pencil" size={18} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          "Delete Session",
                          "Are you sure you want to delete this study session?",
                          [
                            {
                              text: "Cancel",
                              style: "cancel"
                            },
                            { 
                              text: "Delete", 
                              onPress: () => deleteSession(session.id),
                              style: "destructive"
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No study sessions</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to schedule a study session
            </Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CS475 - Mobile Development
          </Text>
          <Text style={styles.footerText}>
          Mohammad Alsubaie
          </Text>
        </View>
      </ScrollView>
      
     
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
                {isEditing ? 'Edit Study Session' : 'Schedule Study Session'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Session title"
                value={title}
                onChangeText={setTitle}
              />
              
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  setPickerType('date');
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateText}>
                  {date.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <View style={styles.timeInputRow}>
                <View style={styles.timeInput}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      setPickerType('time');
                      setShowStartTimePicker(true);
                    }}
                  >
                    <Text style={styles.dateText}>
                      {startTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                    <Ionicons name="time" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.timeInput}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      setPickerType('time');
                      setShowEndTimePicker(true);
                    }}
                  >
                    <Text style={styles.dateText}>
                      {endTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                    <Ionicons name="time" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.inputLabel}>Location (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Library, Room 101"
                value={location}
                onChangeText={setLocation}
              />
              
              <Text style={styles.inputLabel}>Subject/Course (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Math, History"
                value={subject}
                onChangeText={setSubject}
              />
              
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any additional details"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddSession}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Session' : 'Schedule Session'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default"
                onChange={handleStartTimeChange}
              />
            )}
            
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={handleEndTimeChange}
              />
            )}
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
  sessionList: {
    flex: 1,
    padding: 16,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    backgroundColor: '#e6f2ff',
    padding: 10,
    borderRadius: 8,
  },
  sessionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionActions: {
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginRight: 8,
  },
  timeInput: {
    width: '48%',
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
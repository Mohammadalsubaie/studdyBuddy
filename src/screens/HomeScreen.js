import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import TaskItem from '../components/TaskItem';
import StudySessionCard from '../components/StudySessionCard';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
    
      const tasksRef = collection(db, "users", auth.currentUser.uid, "tasks");
      const tasksSnapshot = await getDocs(tasksRef);
      
      let tasks = [];
      let completed = 0;
      tasksSnapshot.forEach((doc) => {
        const task = { id: doc.id, ...doc.data() };
        if (task.completed) {
          completed++;
        } else {
          tasks.push(task);
        }
      });
      
      
      tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setUpcomingTasks(tasks.slice(0, 3));
      setCompletedTasks(completed);
      setTotalTasks(tasks.length + completed);
      
    
      const sessionsRef = collection(db, "users", auth.currentUser.uid, "sessions");
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      let sessions = [];
      sessionsSnapshot.forEach((doc) => {
        const session = { id: doc.id, ...doc.data() };
        if (new Date(session.date) >= new Date()) {
          sessions.push(session);
        }
      });
      
      // Sort by date and get only upcoming 2
      sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
      setUpcomingSessions(sessions.slice(0, 2));
      
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const progressPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {auth.currentUser?.displayName || 'Student'}</Text>
        <Text style={styles.subGreeting}>Ready to study today?</Text>
      </View>
      
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            <Text style={styles.progressText}>
              {completedTasks} of {totalTasks} tasks completed
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <View style={styles.tasksSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming tasks</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('Tasks')}
            >
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.sessionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Study Sessions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingSessions.length > 0 ? (
          upcomingSessions.map(session => (
            <StudySessionCard key={session.id} session={session} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming study sessions</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('Schedule')}
            >
              <Text style={styles.addButtonText}>Schedule Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          CS475 - Mobile Development
        </Text>
        <Text style={styles.footerText}>
        Mohammad Alsubaie
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#007AFF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 16,
    color: '#e6f2ff',
    marginTop: 5,
  },
  progressSection: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  tasksSection: {
    padding: 20,
  },
  sessionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
});
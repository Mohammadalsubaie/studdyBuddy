import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import ProgressBar from '../components/ProgressBar';

export default function ProgressScreen() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    subjectProgress: {},
    weeklyProgress: {},
  });

  const fetchData = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const tasksRef = collection(db, "users", auth.currentUser.uid, "tasks");
      const tasksSnapshot = await getDocs(tasksRef);
      
      let totalTasks = 0;
      let completedTasks = 0;
      
      // For tracking progress by subject
      let subjects = {};
      
      // For tracking weekly progress
      let weekly = {
        Monday: { total: 0, completed: 0 },
        Tuesday: { total: 0, completed: 0 },
        Wednesday: { total: 0, completed: 0 },
        Thursday: { total: 0, completed: 0 },
        Friday: { total: 0, completed: 0 },
        Saturday: { total: 0, completed: 0 },
        Sunday: { total: 0, completed: 0 },
      };
      
      tasksSnapshot.forEach((doc) => {
        const task = doc.data();
        totalTasks++;
        
        // Count by completion status
        if (task.completed) {
          completedTasks++;
        }
        
        // Count by subject
        if (task.subject) {
          if (!subjects[task.subject]) {
            subjects[task.subject] = { total: 0, completed: 0 };
          }
          subjects[task.subject].total++;
          if (task.completed) {
            subjects[task.subject].completed++;
          }
        }
        
        // Count by day of week
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const dayOfWeek = dueDate.toLocaleDateString('en-US', { weekday: 'long' });
          if (weekly[dayOfWeek]) {
            weekly[dayOfWeek].total++;
            if (task.completed) {
              weekly[dayOfWeek].completed++;
            }
          }
        }
      });
      
      // Calculate percentages for subjects
      let subjectProgress = {};
      for (const subject in subjects) {
        const { total, completed } = subjects[subject];
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        subjectProgress[subject] = {
          total,
          completed,
          percentage
        };
      }
      
      // Calculate percentages for weekly progress
      let weeklyProgress = {};
      for (const day in weekly) {
        const { total, completed } = weekly[day];
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        weeklyProgress[day] = {
          total,
          completed,
          percentage
        };
      }
      
      setStats({
        totalTasks,
        completedTasks,
        subjectProgress,
        weeklyProgress
      });
      
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const overallPercentage = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Progress</Text>
        <View style={styles.statsCard}>
          <View style={styles.overallStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalTasks}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completedTasks}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{overallPercentage}%</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${overallPercentage}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress by Subject</Text>
        <View style={styles.statsCard}>
          {Object.keys(stats.subjectProgress).length > 0 ? (
            Object.entries(stats.subjectProgress).map(([subject, data]) => (
              <View key={subject} style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{subject}</Text>
                  <Text style={styles.progressCount}>
                    {data.completed}/{data.total}
                  </Text>
                </View>
                <ProgressBar progress={data.percentage} />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No subjects assigned to tasks yet
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Overview</Text>
        <View style={styles.statsCard}>
          {Object.entries(stats.weeklyProgress).map(([day, data]) => (
            <View key={day} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{day}</Text>
                <Text style={styles.progressCount}>
                  {data.completed}/{data.total}
                </Text>
              </View>
              <ProgressBar progress={data.percentage} />
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          CS475 - Mobile Development
        </Text>
        <Text style={styles.footerText}>
          CRN: Your CRN - Group Members Names
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
      paddingTop: 50,
      backgroundColor: '#007AFF',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
    },
    statsCard: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    overallStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF',
    },
    statLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 5,
    },
    progressContainer: {
      marginVertical: 10,
    },
    progressBarContainer: {
      height: 10,
      backgroundColor: '#e0e0e0',
      borderRadius: 5,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#007AFF',
    },
    progressItem: {
      marginBottom: 15,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    progressLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
    },
    progressCount: {
      fontSize: 14,
      color: '#666',
    },
    emptyText: {
      textAlign: 'center',
      color: '#666',
      padding: 20,
    },
    footer: {
      padding: 20,
      alignItems: 'center',
    },
    footerText: {
      color: '#666',
      fontSize: 14,
      marginBottom: 5,
    },
  });
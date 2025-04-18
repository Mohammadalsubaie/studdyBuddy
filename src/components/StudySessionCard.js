import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StudySessionCard({ session }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <View style={styles.sessionCard}>
      <View style={styles.dateTimeContainer}>
        <Text style={styles.date}>{formatDate(session.date)}</Text>
        <Text style={styles.time}>{formatTime(session.startTime)} - {formatTime(session.endTime)}</Text>
      </View>
      
      <View style={styles.sessionDetails}>
        <Text style={styles.sessionTitle}>{session.title}</Text>
        
        {session.location ? (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.locationText}>{session.location}</Text>
          </View>
        ) : null}
        
        {session.subject ? (
          <View style={styles.subjectContainer}>
            <Ionicons name="book-outline" size={16} color="#666" />
            <Text style={styles.subjectText}>{session.subject}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateTimeContainer: {
    backgroundColor: '#e6f2ff',
    borderRadius: 8,
    padding: 8,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  date: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
});
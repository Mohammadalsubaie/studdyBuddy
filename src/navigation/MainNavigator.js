import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ProfileScreen from '../screens/ProfileScreen';

const FallbackScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Screen {route.name} not implemented yet</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  
  const HomeComponent = HomeScreen ?? FallbackScreen;
  const TasksComponent = TasksScreen ?? FallbackScreen;
  const ProgressComponent = ProgressScreen ?? FallbackScreen;
  const ScheduleComponent = ScheduleScreen ?? FallbackScreen;
  const ProfileComponent = ProfileScreen ?? FallbackScreen;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeComponent} />
      <Tab.Screen name="Tasks" component={TasksComponent} />
      <Tab.Screen name="Progress" component={ProgressComponent} />
      <Tab.Screen name="Schedule" component={ScheduleComponent} />
      <Tab.Screen name="Profile" component={ProfileComponent} />
    </Tab.Navigator>
  );
}
// Date formatting
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Time formatting
  export const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Check if a date is today
  export const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Check if a date is tomorrow
  export const isTomorrow = (dateString) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(dateString);
    
    return date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();
  };
  
  // Check if a date is in the past
  export const isPast = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    
    return date < now;
  };
  
  // Group sessions by date
  export const groupByDate = (sessions) => {
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
  
  // Priority color mapping
  export const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ffdddd';
      case 'medium':
        return '#fff0dd';
      case 'low':
        return '#ddffdd';
      default:
        return '#e0e0e0';
    }
  };
  
  // Get relative day description
  export const getRelativeDayDescription = (dateString) => {
    if (isToday(dateString)) {
      return 'Today';
    } else if (isTomorrow(dateString)) {
      return 'Tomorrow';
    } else {
      return formatDate(dateString);
    }
  };
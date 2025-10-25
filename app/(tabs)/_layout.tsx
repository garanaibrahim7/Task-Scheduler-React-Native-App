import { Tabs } from 'expo-router';
import { CheckSquare, PlusSquare, History, BarChart3 } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#061129ff',
        tabBarInactiveTintColor: '#72849eff',
        tabBarStyle: {
          backgroundColor: '#ffffffff',
          borderTopWidth: 1,
          borderTopColor: '#000000ff',
          paddingBottom: 5,
          paddingTop: 5,
          height: 80,
        },
        headerStyle: {
          backgroundColor: '#181c25ff',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Tasks',
          tabBarIcon: ({ size, color }) => <CheckSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Task',
          tabBarIcon: ({ size, color }) => <PlusSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ size, color }) => <History size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { Hop as Home, ClipboardList, Wallet, Map, BookOpen } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import ItineraryScreen from '../screens/ItineraryScreen';
import BudgetScreen from '../screens/BudgetScreen';
import MapScreen from '../screens/MapScreen';
import JournalScreen from '../screens/JournalScreen';
import AccommodationScreen from '../screens/AccommodationScreen';
import TransportScreen from '../screens/TransportScreen';
import PackingScreen from '../screens/PackingScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import TripOverviewScreen from '../screens/TripOverviewScreen';
import DestinationDetailsScreen from '../screens/DestinationDetailsScreen';
import ExpenseDetailsScreen from '../screens/ExpenseDetailsScreen';
import TravelersScreen from '../screens/TravelersScreen';
import TripSettingsScreen from '../screens/TripSettingsScreen';
import MemoriesRecapScreen from '../screens/MemoriesRecapScreen';
import OfflineCenterScreen from '../screens/OfflineCenterScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import DownloadDataScreen from '../screens/DownloadDataScreen';
import CurrencySelectorScreen from '../screens/CurrencySelectorScreen';
import LanguageSelectorScreen from '../screens/LanguageSelectorScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import PartnerSyncScreen from '../screens/PartnerSyncScreen';
import NotificationCenterScreen from '../screens/NotificationCenterScreen';
import MyTripsScreen from '../screens/MyTripsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Home,
  Itinerary: ClipboardList,
  Budget: Wallet,
  Explore: Map,
  Journal: BookOpen,
};

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const Icon = TAB_ICONS[name];
  const color = focused ? '#4CAF50' : '#999';
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      {Icon && <Icon size={22} color={color} />}
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="TripOverview" component={TripOverviewScreen} />
      <Stack.Screen name="Accommodation" component={AccommodationScreen} />
      <Stack.Screen name="Transport" component={TransportScreen} />
      <Stack.Screen name="Packing" component={PackingScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="DestinationDetails" component={DestinationDetailsScreen} />
      <Stack.Screen name="Travelers" component={TravelersScreen} />
      <Stack.Screen name="TripSettings" component={TripSettingsScreen} />
      <Stack.Screen name="MemoriesRecap" component={MemoriesRecapScreen} />
      <Stack.Screen name="OfflineCenter" component={OfflineCenterScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="DownloadData" component={DownloadDataScreen} />
      <Stack.Screen name="CurrencySelector" component={CurrencySelectorScreen} />
      <Stack.Screen name="LanguageSelector" component={LanguageSelectorScreen} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
      <Stack.Screen name="PartnerSync" component={PartnerSyncScreen} />
      <Stack.Screen name="Notifications" component={NotificationCenterScreen} />
      <Stack.Screen name="MyTrips" component={MyTripsScreen} />
    </Stack.Navigator>
  );
}

function ItineraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ItineraryMain" component={ItineraryScreen} />
      <Stack.Screen name="Transport" component={TransportScreen} />
      <Stack.Screen name="Accommodation" component={AccommodationScreen} />
      <Stack.Screen name="DestinationDetails" component={DestinationDetailsScreen} />
    </Stack.Navigator>
  );
}

function BudgetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BudgetMain" component={BudgetScreen} />
      <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
      <Stack.Screen name="Travelers" component={TravelersScreen} />
    </Stack.Navigator>
  );
}

function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreMain" component={MapScreen} />
      <Stack.Screen name="Accommodation" component={AccommodationScreen} />
      <Stack.Screen name="Transport" component={TransportScreen} />
      <Stack.Screen name="Packing" component={PackingScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="TripOverview" component={TripOverviewScreen} />
      <Stack.Screen name="DestinationDetails" component={DestinationDetailsScreen} />
    </Stack.Navigator>
  );
}

function JournalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JournalMain" component={JournalScreen} />
      <Stack.Screen name="MemoriesRecap" component={MemoriesRecapScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={route.name} focused={focused} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Itinerary" component={ItineraryStack} />
        <Tab.Screen name="Budget" component={BudgetStack} />
        <Tab.Screen name="Explore" component={ExploreStack} />
        <Tab.Screen name="Journal" component={JournalStack} />
      </Tab.Navigator>

  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconFocused: {
    backgroundColor: '#E8F5E9',
  },
});

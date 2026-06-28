import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import JoinTripScreen from '../screens/JoinTripScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS: Record<string, any> = {
  Home: require('../../assets/icons/home.png'),
  Itinerary: require('../../assets/icons/itinerary.png'),
  Budget: require('../../assets/icons/budget.png'),
  Explore: require('../../assets/icons/explore.png'),
  Journal: require('../../assets/icons/journal.png'),
};

const TAB_LABELS = ['Home', 'Itinerary', 'Budget', 'Explore', 'Journal'];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const icon = TAB_ICONS[route.name];
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <Image
              source={icon}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.4 }]}
              resizeMode="contain"
            />
            <Text style={[styles.tabLabel, { color: focused ? '#4CAF50' : '#999' }]}>
              {TAB_LABELS[index]}
            </Text>
          </TouchableOpacity>
        );
      })}
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
      <Stack.Screen name="JoinTrip" component={JoinTripScreen} options={{ headerShown: false }} />
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
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
  flexDirection: 'row',
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#F0F0F0',
  height: 70,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: -2 },
  elevation: 8,
},
tabItem: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 0,
  paddingBottom: 2,
  gap: 0,
},
tabIcon: {
  width: 65,
  height: 65,
  marginTop: -6,
},

tabLabel: {
  fontSize: 11,
  fontWeight: '600',
  marginTop: -10,
},

});
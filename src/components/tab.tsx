import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Album from './Tab_screens/Album';
import Artist from './Tab_screens/Artist';
import All_songs from './Tab_screens/All_songs';
import FavSongs from './Tab_screens/favsongs';
import BottomPlayer from './Player/BottomPlayer';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faPlay } from '@fortawesome/free-solid-svg-icons';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const Tab = createMaterialTopTabNavigator();

const TabNavigator = ({ navigation }) => {
  const handleSearch = () => navigation.navigate('SearchMusic');
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
      }}
    >
      {/* Header */}
      <View style={styles.titleContainer}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoCircle}>
            <FontAwesomeIcon icon={faPlay} size={16} color="white" />
          </View>
          <Text
            style={[
              styles.titleStyle,
              { color: isDarkMode ? Colors.white : Colors.black },
            ]}
          >
            <Text style={styles.highlight}>M</Text>Player
          </Text>
        </View>
        <TouchableOpacity style={styles.searchIconContainer} onPress={handleSearch}>
          <FontAwesomeIcon
            icon={faSearch}
            size={18}
            color={isDarkMode ? Colors.white : Colors.black}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: [
            styles.tabBar,
            { backgroundColor: isDarkMode ? Colors.black : Colors.white },
          ],
          tabBarInactiveTintColor: 'grey',
          tabBarActiveTintColor: '#E82255',
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIndicatorStyle: styles.tabBarIndicator,
        }}
      >
        <Tab.Screen name="Songs" component={All_songs} />
        <Tab.Screen name="Artist" component={Artist} />
        <Tab.Screen name="Album" component={Album} />
        <Tab.Screen name="Favourites" component={FavSongs} />
      </Tab.Navigator>

      {/* Bottom Player */}
      <BottomPlayer nav={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    backgroundColor: '#E82255',
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStyle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  highlight: {
    color: '#E82255',
    fontWeight: 'bold',
  },
  searchIconContainer: {
    borderRadius: 50,
    padding: 8,
  },
  tabBar: {
    elevation: 0,
    borderBottomWidth: 1,
    paddingTop: 20,
  },
  tabBarLabel: {
    textTransform: 'capitalize',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabBarIndicator: {
    backgroundColor: '#E82255',
    height: 2.5,
    borderRadius: 2,
  },
});

export default TabNavigator;

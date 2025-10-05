import React, { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useColorScheme,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMusic, faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setFavouritesSongs } from '../../redux/action';
import { useDispatch, useSelector } from 'react-redux';
import { faHeart as solidHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';

const AddToFavourites = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const dispatch = useDispatch();

  const Songs = useSelector((state) => state.allSongsReducer);
  const favSongs = useSelector((state) => state.favSongsReducer);

  const [searchQuery, setSearchQuery] = useState('');
  const [allSongs, setFilteredSongs] = useState(Songs);

  const themeColor = isDarkMode ? Colors.white : Colors.black;
  const dimColorTheme = isDarkMode ? Colors.light : Colors.darker;
  const backgroundTheme = isDarkMode ? Colors.black : Colors.white;
  const inputBackground = isDarkMode ? Colors.darker : Colors.lighter;

  useEffect(() => {
    setFilteredSongs(Songs);
  }, [Songs]);

  /** Add/Remove Favourites */
  const toggleFavourite = async (song) => {
    try {
      if (!song || !song.url) return;

      let favSongsArray = (await AsyncStorage.getItem('favSongs')) || '[]';
      favSongsArray = JSON.parse(favSongsArray);

      const existingIndex = favSongsArray.findIndex((item) => item.url === song.url);

      if (existingIndex !== -1) {
        favSongsArray.splice(existingIndex, 1);
        ToastAndroid.show('Removed from favourites.', ToastAndroid.SHORT);
      } else {
        favSongsArray.push(song);
        ToastAndroid.show('Song added to favourites.', ToastAndroid.SHORT);
      }

      await AsyncStorage.setItem('favSongs', JSON.stringify(favSongsArray));
      dispatch(setFavouritesSongs(favSongsArray));
    } catch (e) {
      console.error('Failed to update favourites:', e);
    }
  };

  /** Back Navigation */
  const goBack = () => navigation.goBack();

  /** Search Filter */
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredSongs(Songs);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = Songs.filter(
      (song) =>
        song.title?.toLowerCase().includes(lower) ||
        song.artist?.toLowerCase().includes(lower) ||
        song.album?.toLowerCase().includes(lower)
    );
    setFilteredSongs(filtered);
  };

  /** Render Song Item */
  const renderItem = ({ item }) => {
    const isFav = favSongs.some((fav) => fav.url === item.url);

    return (
      <View style={styles.songWrapper}>
        <TouchableOpacity
          onPress={() => toggleFavourite(item)}
          style={styles.songRow}
        >
          <View style={styles.musicIconContainer}>
            <FontAwesomeIcon icon={faMusic} size={18} color="white" />
          </View>
          <View style={styles.songDetails}>
            <Text
              style={[styles.songName, { color: themeColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            <Text style={[styles.songMeta, { color: dimColorTheme }]}>
              {item.artist} - {item.album}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleFavourite(item)} style={styles.heartBtn}>
          <FontAwesomeIcon
            icon={isFav ? solidHeart : regularHeart}
            size={20}
            color={isFav ? '#e82255' : themeColor}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.wrapper, { backgroundColor: backgroundTheme }]}>
        {/* Header / Toolbar */}
        <View style={[styles.toolBar, { borderColor: isDarkMode ? Colors.darker : Colors.lighter }]}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={themeColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: themeColor }]}>Add Songs</Text>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: inputBackground }]}>
          <FontAwesomeIcon icon={faSearch} size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search song, artist, album"
            placeholderTextColor="#999"
            onChangeText={handleSearch}
            value={searchQuery}
            cursorColor={'#E82255'}
          />
        </View>

        {/* Song List */}
        <FlatList
          data={allSongs}
          renderItem={renderItem}
          keyExtractor={(item) => item.url}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1 },
  toolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    marginTop: 10,
    paddingLeft: 12,
    paddingBottom: 10,
    gap: 15,
  },
  backBtn: { padding: 10, borderRadius: 20 },
  title: { fontSize: 16, fontWeight: 'bold' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 12,
  },
  searchIcon: { marginRight: 5 },
  searchInput: {
    flex: 1,
    height: 40,
    color: 'white',
    backgroundColor: 'transparent',
  },

  songWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#444',
  },
  songRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  musicIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#E82255',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  songDetails: { flex: 1 },
  songName: { fontSize: 14, fontWeight: 'bold' },
  songMeta: { fontSize: 11 },
  heartBtn: { padding: 10 },
});

export default AddToFavourites;



import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  StyleSheet,
  Text,
  Dimensions,
  useColorScheme,
  TouchableOpacity,
  ToastAndroid,
  StatusBar,
  PanResponder,
  Platform,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import { setIsSongPlaying, setFavouritesSongs } from '../../redux/action';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer from 'react-native-track-player';
import {
  faForwardStep,
  faBackwardStep,
  faPlay,
  faMusic,
  faAngleDown,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import TextTicker from 'react-native-text-ticker';
import Slider from '@react-native-community/slider';
import { faHeart as solidHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';
import { useNavigation } from '@react-navigation/native';

const AudioPlayer = () => {
  const dispatch = useDispatch();
  const selected = useSelector((state) => state.selectedSongReducer);
  const isSongPlaying = useSelector((state) => state.isSongPlaying);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFavSong, setFavSong] = useState(false);

  const navigation = useNavigation();
  const isDarkMode = useColorScheme() === 'dark';

  // Theme colors
  const themeColor = isDarkMode ? Colors.white : Colors.black;
  const bgTheme = isDarkMode ? Colors.black : Colors.white;
  const dimColorTheme = isDarkMode ? Colors.light : Colors.darker;

  // Animation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shouldRotate = useRef(false);

  const closeIt = () => {
    navigation.goBack();
    return true;
  };

  // Track progress updater
  useEffect(() => {
    const updatePosition = async () => {
      try {
        const pos = await TrackPlayer.getPosition();
        const dur = await TrackPlayer.getDuration();
        setPosition(pos || 0);
        setDuration(dur || 0);
      } catch (err) {
        console.warn('Error updating position:', err);
      }
    };

    updatePosition();
    const intervalId = setInterval(updatePosition, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const onSlidingComplete = async (value) => {
    try {
      await TrackPlayer.seekTo(value);
      setPosition(value);
    } catch (error) {
      console.warn(error);
    }
  };

  const handleNextSong = async () => {
    try {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
      dispatch(setIsSongPlaying(true));
    } catch (err) {
      console.warn('Next song error:', err);
    }
  };

  const handlePreviousSong = async () => {
    try {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
      dispatch(setIsSongPlaying(true));
    } catch (err) {
      console.warn('Previous song error:', err);
    }
  };

  const playPause = async () => {
    try {
      if (isSongPlaying) {
        await TrackPlayer.pause();
        dispatch(setIsSongPlaying(false));
      } else {
        await TrackPlayer.play();
        dispatch(setIsSongPlaying(true));
      }
    } catch (err) {
      console.warn('Play/Pause error:', err);
    }
  };

  // Check favourite state
  useEffect(() => {
    const checkFavourite = async () => {
      try {
        const existingSongs = await AsyncStorage.getItem('favSongs');
        if (existingSongs) {
          const favSongsArray = JSON.parse(existingSongs);
          const isFav = favSongsArray.some((item) => item.url === selected?.url);
          setFavSong(isFav);
        } else {
          setFavSong(false);
        }
      } catch (e) {
        console.error('Failed to check favourite songs:', e);
      }
    };

    if (selected?.url) checkFavourite();
  }, [selected]);

  // Add/remove favourite
  const addFavSongItem = async (favSong) => {
    try {
      if (!favSong?.url) return;

      let favSongsArray = [];
      const existingSongs = await AsyncStorage.getItem('favSongs');
      if (existingSongs) favSongsArray = JSON.parse(existingSongs);

      const existingIndex = favSongsArray.findIndex(
        (item) => item.url === favSong.url
      );

      if (existingIndex !== -1) {
        favSongsArray.splice(existingIndex, 1);
        setFavSong(false);
        ToastAndroid.show('Removed from favourites.', ToastAndroid.SHORT);
      } else {
        favSongsArray.push(favSong);
        setFavSong(true);
        ToastAndroid.show('Song added to favourites.', ToastAndroid.SHORT);
      }

      await AsyncStorage.setItem('favSongs', JSON.stringify(favSongsArray));
      dispatch(setFavouritesSongs(favSongsArray));
    } catch (e) {
      console.error('Failed to update favourites:', e);
    }
  };

  const toggleFavSong = () => {
    if (selected?.url) {
      addFavSongItem(selected);
    }
  };

  // Swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) closeIt();
      },
    })
  ).current;

  // Rotation animation
  useEffect(() => {
    shouldRotate.current = isSongPlaying;
    const rotate = () => {
      if (shouldRotate.current) {
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && shouldRotate.current) {
            rotateAnim.setValue(0);
            rotate();
          }
        });
      }
    };
    rotate();
  }, [isSongPlaying, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.modal}>
      <LinearGradient
        colors={isDarkMode ? ['#870023', '#000000'] : ['#ffffff', '#ffffff']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.content} {...panResponder.panHandlers}>
          {/* Toolbar */}
          <View style={styles.toolBar}>
            <TouchableOpacity
              onPress={closeIt}
              style={[styles.toolBarIconsContainer, { marginLeft: -10 }]}
            >
              <FontAwesomeIcon icon={faAngleDown} size={20} color={themeColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBarIconsContainer, { marginRight: -10 }]}
              onPress={toggleFavSong}
            >
              <FontAwesomeIcon
                icon={isFavSong ? solidHeart : regularHeart}
                size={25}
                color={isFavSong ? '#E82255' : themeColor}
              />
            </TouchableOpacity>
          </View>

          {/* Song Info */}
          <View style={{ marginTop: 30, alignItems: 'center' }}>
            <TextTicker
              scrollSpeed={50}
              numberOfLines={1}
              style={[styles.songName, { color: themeColor }]}
              ellipsizeMode="tail"
            >
              {selected?.title || 'Unknown Title'}
            </TextTicker>
            <Text style={{ color: dimColorTheme, fontSize: 14 }}>
              {selected?.artist || 'Unknown Artist'}
            </Text>
          </View>

          {/* Rotating Disk */}
          <Animated.View
            style={[styles.musicIconContainer, { transform: [{ rotate: spin }] }]}
          >
            <FontAwesomeIcon icon={faMusic} size={100} color="white" />
          </Animated.View>

          {/* Slider */}
          <View style={{ marginTop: 40, width: '100%' }}>
            <Slider
              style={{ width: '100%' }}
              minimumValue={0}
              maximumValue={duration}
              minimumTrackTintColor="#E82255"
              maximumTrackTintColor={isDarkMode ? 'white' : '#000000'}
              thumbTintColor="#E82255"
              value={position}
              onSlidingComplete={onSlidingComplete}
            />

            <View style={styles.durationContainer}>
              <Text style={[styles.durationText, { color: dimColorTheme }]}>
                {formatTime(position)}
              </Text>
              <Text style={[styles.durationText, { color: dimColorTheme }]}>
                {formatTime(duration)}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={[styles.featuresIconContainer, { marginTop: 50 }]}>
            <TouchableOpacity
              onPress={handlePreviousSong}
              style={[styles.playPousedContainer, { backgroundColor: 'transparent' }]}
            >
              <FontAwesomeIcon icon={faBackwardStep} size={22} color={themeColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.playPousedContainer,
                { backgroundColor: isDarkMode ? 'lightgreen' : '#E82255' },
              ]}
              onPress={playPause}
            >
              <FontAwesomeIcon
                icon={isSongPlaying ? faPause : faPlay}
                size={25}
                color={bgTheme}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextSong}
              style={[styles.playPousedContainer, { backgroundColor: 'transparent' }]}
            >
              <FontAwesomeIcon icon={faForwardStep} size={22} color={themeColor} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: 'flex-end' },
  playPousedContainer: {
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresIconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  toolBarIconsContainer: {
    borderRadius: 25,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: { fontSize: 10 },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  musicIconContainer: {
    width: 250,
    height: 250,
    backgroundColor: '#E82255',
    borderRadius: 250,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 40,
  },
  toolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: { height: Dimensions.get('window').height, flex: 1, padding: 20 },
  gradient: { flex: 1 },
  songName: { fontSize: 18 },
});

export default AudioPlayer;


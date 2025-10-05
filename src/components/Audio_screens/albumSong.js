
import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useColorScheme,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  PanResponder,
  PermissionsAndroid,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faMusic,
  faEllipsisVertical,
  faPlay,
  faHeart,
  faTimes,
  faShareAlt,
  faInfoCircle,
  faTrashCan,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectedSong,
  setIsSongPlaying,
  setFavouritesSongs,
} from '../../redux/action';
import TrackPlayer from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

const AlbumSongs = ({ route, navigation }) => {
  const Songs = useSelector((state) => state.allSongsReducer);
  const selectedItem = useSelector((state) => state.selectedSongReducer);
  const isSongPlaying = useSelector((state) => state.isSongPlaying);
  const dispatch = useDispatch();

  const { albumName } = route.params;
  const isDarkMode = useColorScheme() === 'dark';

  const themeColor = isDarkMode ? Colors.white : Colors.black;
  const bgTheme = isDarkMode ? Colors.black : Colors.white;
  const dimColorTheme = isDarkMode ? Colors.light : Colors.darker;

  const [selectedArtistSongs, setSelectedArtistSongs] = useState([]);
  const [songItem, setSongItem] = useState(null);
  const [songSize, setSongSize] = useState(0);
  const [songDate, setSongDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [openDeleteSongModal, setOpenDeleteSongModal] = useState(false);

  // PanResponder to close modals on swipe down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          setModalVisible(false);
          setOptionModalVisible(false);
          setOpenDeleteSongModal(false);
        }
      },
    })
  ).current;

  // Filter songs by album
  useEffect(() => {
    setSelectedArtistSongs(Songs.filter((song) => song.album === albumName));
  }, [albumName, Songs]);

  // Load favourite songs from storage
  useEffect(() => {
    const getStoredFavSong = async () => {
      const existingSongs = await AsyncStorage.getItem('favSongs');
      if (existingSongs) {
        dispatch(setFavouritesSongs(JSON.parse(existingSongs)));
      }
    };
    getStoredFavSong();
  }, []);

  /** ---------------------- SONG ACTION HANDLERS ---------------------- **/

  const handleSongItem = async (item) => {
    setOptionModalVisible(false);

    if (selectedItem?.url === item.url && isSongPlaying) {
      ToastAndroid.show('Already Playing...', ToastAndroid.SHORT);
      return;
    }

    dispatch(selectedSong(item));
    await AsyncStorage.setItem('lastPlayedSong', JSON.stringify(item));
    await TrackPlayer.play();
    dispatch(setIsSongPlaying(true));
  };

  const openBottomSheet = (item) => {
    setSongItem(item);
    setOptionModalVisible(true);
  };

  const shareSong = async (song) => {
    setOptionModalVisible(false);
    try {
      const fileName = song.url.split('/').pop();
      const fileExtension = fileName.split('.').pop();
      const mimeType = `audio/${fileExtension}`;
      await Share.open({
        title: 'Share Audio',
        url: 'file://' + song.url,
        type: mimeType,
      });
    } catch {
      ToastAndroid.show('Share Cancelled', ToastAndroid.SHORT);
    }
  };

  const openSongInfoModal = (song) => {
    setOptionModalVisible(false);
    setModalVisible(true);
    setSongItem(song);

    getFileSize(song.url).then(setSongSize);
    getFileDateTime(song.url).then(setSongDate);
  };

  const addFavSongItem = async (favSong) => {
    setOptionModalVisible(false);
    if (!favSong?.url) return;

    try {
      const existingSongs = await AsyncStorage.getItem('favSongs');
      let favSongsArray = existingSongs ? JSON.parse(existingSongs) : [];

      if (favSongsArray.find((s) => s.url === favSong.url)) {
        ToastAndroid.show('Already in favourites.', ToastAndroid.SHORT);
        return;
      }

      favSongsArray.push(favSong);
      await AsyncStorage.setItem('favSongs', JSON.stringify(favSongsArray));
      dispatch(setFavouritesSongs(favSongsArray));
      ToastAndroid.show('Added to favourites.', ToastAndroid.SHORT);
    } catch (e) {
      console.error('Failed to add fav song:', e);
    }
  };

  const deleteSong = () => {
    setOpenDeleteSongModal(true);
    setOptionModalVisible(false);
  };

  const deleteSongFromLocal = async () => {
    if (!songItem?.url) return;

    try {
      const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
      const hasPermission = await PermissionsAndroid.check(permission);

      if (!hasPermission) {
        const granted = await PermissionsAndroid.request(permission);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return;
        }
      }

      const fileExists = await RNFS.exists(songItem.url);
      if (fileExists) {
        await RNFS.unlink(songItem.url);
        ToastAndroid.show('Song Deleted', ToastAndroid.SHORT);
      }
      setOpenDeleteSongModal(false);
    } catch (error) {
      console.log('Delete error:', error.message);
    }
  };

  /** ---------------------- HELPERS ---------------------- **/

  const formatDuration = (duration) => {
    if (!duration) return '00:00';
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${hours ? hours + ':' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return '0 B';
    if (sizeInBytes < 1024) return sizeInBytes + ' B';
    if (sizeInBytes < 1024 * 1024) return (sizeInBytes / 1024).toFixed(2) + ' KB';
    if (sizeInBytes < 1024 * 1024 * 1024)
      return (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getFileExtension = (url) => url.split('.').pop();
  const getFileSize = async (url) => {
    try {
      if (url.startsWith('http')) {
        const response = await fetch(url, { method: 'HEAD' });
        return parseInt(response.headers.get('Content-Length'));
      }
      const fileInfo = await RNFS.stat(url);
      return fileInfo.size;
    } catch {
      return null;
    }
  };

  const getFileDateTime = async (url) => {
    try {
      const fileInfo = await RNFS.stat(url);
      return fileInfo.mtime?.toLocaleString();
    } catch {
      return null;
    }
  };

  /** ---------------------- RENDER ---------------------- **/

  const renderItem = ({ item }) => {
    const isSelected = selectedItem?.url === item.url;
    return (
      <View style={styles.songRow}>
        <TouchableOpacity
          style={styles.songTouchable}
          onPress={() => handleSongItem(item)}
          onLongPress={() => openBottomSheet(item)}
        >
          <View style={styles.musicIcon}>
            <FontAwesomeIcon icon={faMusic} size={18} color="white" />
          </View>
          <View style={styles.songTextContainer}>
            <Text
              style={[styles.songName, { color: isSelected ? '#E82255' : themeColor }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={{ color: isSelected ? '#E82255' : dimColorTheme, fontSize: 10 }}>
              {item.artist} - {item.album}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openBottomSheet(item)}>
          <FontAwesomeIcon icon={faEllipsisVertical} size={15} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.headerContainer, { backgroundColor: bgTheme, borderColor: dimColorTheme }]}
      >
        <FontAwesomeIcon icon={faArrowLeft} size={18} color={themeColor} />
        <Text style={[styles.headerText, { color: themeColor }]}>{albumName}</Text>
      </TouchableOpacity>

      {/* Songs List */}
      <FlatList
        data={selectedArtistSongs}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
      />

      {/* Modals */}
      {optionModalVisible && (
        <OptionModal
          songItem={songItem}
          onClose={() => setOptionModalVisible(false)}
          panResponder={panResponder}
          onPlay={() => handleSongItem(songItem)}
          onFav={() => addFavSongItem(songItem)}
          onShare={() => shareSong(songItem)}
          onInfo={() => openSongInfoModal(songItem)}
          onDelete={() => deleteSong(songItem)}
        />
      )}

      {openDeleteSongModal && (
        <DeleteModal
          onDelete={deleteSongFromLocal}
          onCancel={() => setOpenDeleteSongModal(false)}
          panResponder={panResponder}
          themeColor={themeColor}
          isDarkMode={isDarkMode}
        />
      )}

      {modalVisible && (
        <InfoModal
          songItem={songItem}
          songSize={songSize}
          songDate={songDate}
          formatDuration={formatDuration}
          formatFileSize={formatFileSize}
          getFileExtension={getFileExtension}
          onClose={() => setModalVisible(false)}
          panResponder={panResponder}
          themeColor={themeColor}
          isDarkMode={isDarkMode}
        />
      )}
    </View>
  );
};

/** ---------------------- REUSABLE MODAL COMPONENTS ---------------------- **/

// Option Modal
const OptionModal = ({ songItem, onClose, panResponder, onPlay, onFav, onShare, onInfo, onDelete }) => (
  <Modal transparent animationType="slide" visible>
    <Pressable style={styles.overlay} onPress={onClose}>
      <TouchableWithoutFeedback>
        <View style={styles.modalContainer} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
          <ActionItem icon={faPlay} label="Play this song" onPress={onPlay} />
          <ActionItem icon={faHeart} label="Add to favourites" onPress={onFav} />
          <ActionItem icon={faShareAlt} label="Share song file" onPress={onShare} />
          <ActionItem icon={faInfoCircle} label="Song info" onPress={onInfo} />
          <ActionItem icon={faTrashCan} label="Delete song" onPress={onDelete} />
          <ActionItem icon={faTimes} label="Close" color="#E82255" onPress={onClose} />
        </View>
      </TouchableWithoutFeedback>
    </Pressable>
  </Modal>
);

// Delete Modal
const DeleteModal = ({ onDelete, onCancel, panResponder, themeColor, isDarkMode }) => (
  <Modal transparent animationType="slide" visible>
    <Pressable style={styles.overlay} onPress={onCancel}>
      <TouchableWithoutFeedback>
        <View style={styles.modalContainer} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
          <TouchableOpacity style={styles.centeredAction} onPress={onDelete}>
            <Text style={{ color: '#E82255', fontSize: 16 }}>Delete local file</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.centeredAction} onPress={onCancel}>
            <Text style={{ color: themeColor, fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </Pressable>
  </Modal>
);

// Info Modal
const InfoModal = ({ songItem, songSize, songDate, formatDuration, formatFileSize, getFileExtension, onClose, panResponder, themeColor, isDarkMode }) => (
  <Modal transparent animationType="slide" visible>
    <Pressable style={styles.overlay} onPress={onClose}>
      <TouchableWithoutFeedback>
        <View style={styles.modalContainer} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
          <Text style={styles.infoTitle}>Information</Text>
          {songItem && (
            <>
              <InfoRow label="Title" value={songItem.title} themeColor={themeColor} />
              <InfoRow label="Album" value={songItem.album} themeColor={themeColor} />
              <InfoRow label="Artist" value={songItem.artist} themeColor={themeColor} />
              <InfoRow label="Duration" value={formatDuration(songItem.duration)} themeColor={themeColor} />
              <InfoRow label="Size" value={formatFileSize(songSize)} themeColor={themeColor} />
              <InfoRow label="Format" value={`audio/${getFileExtension(songItem.url)}`} themeColor={themeColor} />
              <InfoRow label="Path" value={songItem.url} themeColor={themeColor} />
              <InfoRow label="Date" value={songDate} themeColor={themeColor} />
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Pressable>
  </Modal>
);

/** ---------------------- SMALL COMPONENTS ---------------------- **/

const ActionItem = ({ icon, label, onPress, color = '#999' }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    <FontAwesomeIcon icon={icon} size={16} style={{ color }} />
    <Text style={{ color, fontSize: 14 }}>{label}</Text>
  </TouchableOpacity>
);

const InfoRow = ({ label, value, themeColor }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: themeColor }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: themeColor }]}>{value}</Text>
  </View>
);

/** ---------------------- STYLES ---------------------- **/

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginTop: 30,
    borderBottomWidth: 1,
  },
  headerText: { fontSize: 18, marginLeft: 20, fontWeight: 'bold' },

  songRow: {
    marginVertical: 5,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songTouchable: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  songTextContainer: { flexDirection: 'column', width: 220 },
  songName: { fontSize: 14, fontWeight: '600' },

  musicIcon: {
    width: 35,
    height: 35,
    borderRadius: 25,
    backgroundColor: '#E82255',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  dragHandle: { backgroundColor: '#999', width: 40, height: 5, borderRadius: 5, alignSelf: 'center', marginBottom: 15 },
  actionItem: { flexDirection: 'row', gap: 15, alignItems: 'center', padding: 12 },
  centeredAction: { alignItems: 'center', padding: 15 },

  infoTitle: { color: '#E82255', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  infoLabel: { fontWeight: '600', width: 70 },
  infoValue: { flex: 1 },
});

export default AlbumSongs;


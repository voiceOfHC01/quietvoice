import { useRef, useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { RecordingItem, VideoRecordingItem } from '../types';

const DB_NAME = 'quietvoice_db';
const STORE_NAME = 'recordings';
const VIDEO_STORE = 'videos';
const DB_VERSION = 2;

interface RecordingRecord {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  preset: string;
  measuredNoiseReductionDb: number;
  rawBlob: Blob;
  cleanBlob: Blob;
  sampleRate: number;
  waveform: number[];
  isDeepCleaned?: boolean;
}

interface VideoRecord {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  videoBlob: Blob;
  measuredNoiseReductionDb: number;
  distanceMode: string;
}

export function useIndexedDB() {
  const activeRecordingUrlsRef = useRef<Set<string>>(new Set());
  const activeVideoUrlsRef = useRef<Set<string>>(new Set());

  const revokeUrlsSet = useCallback((set: Set<string>) => {
    set.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    set.clear();
  }, []);

  useEffect(() => {
    return () => {
      revokeUrlsSet(activeRecordingUrlsRef.current);
      revokeUrlsSet(activeVideoUrlsRef.current);
    };
  }, [revokeUrlsSet]);

  const getDb = async (): Promise<IDBPDatabase> => {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains(VIDEO_STORE)) {
          const vStore = db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
          vStore.createIndex('timestamp', 'timestamp');
        }
      },
    });
  };

  const saveRecording = async (item: RecordingItem): Promise<void> => {
    const db = await getDb();
    const record: RecordingRecord = {
      id: item.id,
      name: item.name,
      timestamp: item.timestamp,
      duration: item.duration,
      preset: item.preset,
      measuredNoiseReductionDb: item.measuredNoiseReductionDb,
      rawBlob: item.rawBlob,
      cleanBlob: item.cleanBlob,
      sampleRate: item.sampleRate,
      waveform: item.waveform,
      isDeepCleaned: item.isDeepCleaned || false
    };
    await db.put(STORE_NAME, record);
  };

  const saveVideo = async (item: VideoRecordingItem): Promise<void> => {
    const db = await getDb();
    const record: VideoRecord = {
      id: item.id,
      name: item.name,
      timestamp: item.timestamp,
      duration: item.duration,
      videoBlob: item.videoBlob,
      measuredNoiseReductionDb: item.measuredNoiseReductionDb,
      distanceMode: item.distanceMode
    };
    await db.put(VIDEO_STORE, record);
  };

  const getVideos = async (): Promise<VideoRecordingItem[]> => {
    const db = await getDb();
    const records = await db.getAllFromIndex(VIDEO_STORE, 'timestamp');
    records.reverse();

    // Revoke previous video URLs to immediately release detached video Blob RAM (AUD-04)
    revokeUrlsSet(activeVideoUrlsRef.current);

    return records.map((r: VideoRecord) => {
      const videoUrl = URL.createObjectURL(r.videoBlob);
      activeVideoUrlsRef.current.add(videoUrl);
      return {
        ...r,
        videoUrl
      };
    });
  };

  const deleteVideo = async (id: string): Promise<void> => {
    const db = await getDb();
    await db.delete(VIDEO_STORE, id);
  };

  const renameVideo = async (id: string, newName: string): Promise<void> => {
    const db = await getDb();
    const item = await db.get(VIDEO_STORE, id);
    if (item) {
      item.name = newName;
      await db.put(VIDEO_STORE, item);
    }
  };

  const getRecordings = async (): Promise<RecordingItem[]> => {
    const db = await getDb();
    const records = await db.getAllFromIndex(STORE_NAME, 'timestamp');
    // Descending order (newest first)
    records.reverse();

    // Revoke previous audio URLs to release underlying Blob memory (AUD-04)
    revokeUrlsSet(activeRecordingUrlsRef.current);

    return records.map((r: RecordingRecord) => {
      const cleanUrl = URL.createObjectURL(r.cleanBlob);
      const rawUrl = URL.createObjectURL(r.rawBlob);
      activeRecordingUrlsRef.current.add(cleanUrl);
      activeRecordingUrlsRef.current.add(rawUrl);
      return {
        ...r,
        preset: r.preset as RecordingItem['preset'],
        cleanUrl,
        rawUrl,
      };
    });
  };

  const deleteRecording = async (id: string): Promise<void> => {
    const db = await getDb();
    await db.delete(STORE_NAME, id);
  };

  const renameRecording = async (id: string, newName: string): Promise<void> => {
    const db = await getDb();
    const item = await db.get(STORE_NAME, id);
    if (item) {
      item.name = newName;
      await db.put(STORE_NAME, item);
    }
  };

  const updateRecordingBlob = async (id: string, newCleanBlob: Blob): Promise<void> => {
    const db = await getDb();
    const item = await db.get(STORE_NAME, id);
    if (item) {
      item.cleanBlob = newCleanBlob;
      item.isDeepCleaned = true;
      item.measuredNoiseReductionDb = Math.min(30, item.measuredNoiseReductionDb + 6);
      await db.put(STORE_NAME, item);
    }
  };

  return {
    saveRecording,
    getRecordings,
    deleteRecording,
    renameRecording,
    updateRecordingBlob,
    saveVideo,
    getVideos,
    deleteVideo,
    renameVideo
  };
}
